import { files } from '../data/ideFiles.js';
import catalogMetadata from '../data/catalog_metadata.json';
import * as duckdb from 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/+esm';

let db = null;
let conn = null;

// Multi-Terminal State (Global)
let terminalInstances = [{ id: 1, name: 'Terminal', content: '' }];
let activeTerminalId = 1;
let updateTerminalUIBound = null;
let activeSessionRef = null;
let activeSyncRef = null;

const logToTerminal = (content, type = 'info', append = false) => {
  const active = terminalInstances.find(t => t.id === activeTerminalId);
  if (!active) return;

  let html = content;
  if (type === 'error') html = `<span class="error">${content}</span>`;
  if (type === 'success') html = `<span class="success">${content}</span>`;
  if (type === 'info') {
    if (content.includes('class="spinner"')) html = content;
    else html = `<span class="info">${content}</span>`;
  }

  if (append) active.content += (active.content ? '<br>' : '') + html;
  else active.content = html;

  if (updateTerminalUIBound) updateTerminalUIBound();

  // Re-init resizers if there's a table in the output
  if (html.includes('<table')) {
    setTimeout(() => {
      const terminal = document.querySelector('.terminal-output');
      if (terminal && typeof initTableResizersBound === 'function') initTableResizersBound(terminal);
    }, 50);
  }
};

let initTableResizersBound = null;

async function initDuckDB() {
  if (db) return { db, conn };

  const terminal = document.querySelector('.terminal-output');
  if (terminal) logToTerminal(`<span class="info"><svg class="spinner" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="margin-right:8px;"><circle cx="12" cy="12" r="10"></circle></svg>Loading Data Warehouse (Parquet Engine)...</span>`);

  try {
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
    const worker_url = URL.createObjectURL(
      new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' })
    );
    const worker = new Worker(worker_url);
    const logger = new duckdb.ConsoleLogger();
    const db_instance = new duckdb.AsyncDuckDB(logger, worker);
    await db_instance.instantiate(bundle.mainModule, bundle.pthreadWorker);
    URL.revokeObjectURL(worker_url);

    const connection = await db_instance.connect();

    // Register Parquet Files
    const providersUrl = new URL('/data/providers.parquet', window.location.origin).href;
    const usersUrl = new URL('/data/users.parquet', window.location.origin).href;

    await db_instance.registerFileURL('providers.parquet', providersUrl, duckdb.DuckDBDataProtocol.HTTP, false);
    await db_instance.registerFileURL('users.parquet', usersUrl, duckdb.DuckDBDataProtocol.HTTP, false);

    // Create Tables from Parquet
    await connection.query(`CREATE TABLE providers AS SELECT * FROM 'providers.parquet'`);
    await connection.query(`CREATE TABLE users AS SELECT * FROM 'users.parquet'`);

    if (terminal) {
      logToTerminal(`✓ Warehouse ready. Data loaded from Parquet.`, 'success');
    }

    db = db_instance;
    conn = connection;
    return { db, conn };
  } catch (err) {
    if (terminal) logToTerminal(`DuckDB Init Error: ${err.message}`, 'error', true);
    throw err;
  }
}

export function renderIDE(lang, translations) {
  const section = document.createElement('section');
  section.id = 'playground';
  section.className = 'ide-section';

  // State Management
  let currentFiles = { ...files };
  if (currentFiles['README.md'] && translations[lang]?.playground?.readmeContent) {
    currentFiles['README.md'].content = translations[lang].playground.readmeContent;
  }
  let openTabs = ['README.md'];
  let collapsedFolders = new Set();
  let isInitialLoad = true;
  let currentSearchQuery = '';
  let searchMatches = [];
  let currentMatchIdx = -1;
  let isMultiEditActive = false; // For visual multi-selection feedback
  let isSearchEsc = false; // Flag to prevent IDE exit scrolling on search-close Esc

  // Initialize SQL engine
  initDuckDB().catch(e => console.error("DuckDB Init failed:", e));

  const currentSession = {
    fileName: 'README.md',
    sidebar: 'explorer', // 'explorer' or 'catalog'
    activeCatalogItem: null, // { name, type, parentPath }
    activeCatalogTab: 'overview', // 'overview' or 'details'
    activeCatalogSort: { column: null, order: null }, // { column: string, order: 'ASC' | 'DESC' | null }
    namingNew: null, // { resultType: 'file'|'folder', parent: string, initialName?: string, isRename?: boolean }
    selectedFiles: ['README.md'],
    lastSelectedFile: 'README.md',
    terminalOpen: false
  };

  function syncTerminalVisibility() {
    const container = section.querySelector('.ide-editor-container');
    const terminalEl = section.querySelector('.ide-terminal');
    if (container && terminalEl) {
      const isOpening = container.classList.contains('terminal-hidden') && currentSession.terminalOpen;

      if (currentSession.terminalOpen) {
        container.classList.remove('terminal-hidden');
        if (isOpening) {
          const isFullscreen = !!document.fullscreenElement;
          terminalEl.style.height = isFullscreen ? '45vh' : '220px';
        }
      } else {
        container.classList.add('terminal-hidden');
      }
    }
  }

  // Table Resizer Logic (Universal) - Moved to top for scope availability
  const initTableResizers = (container) => {
    if (!container) return;
    container.querySelectorAll('[data-resizer]').forEach(resizer => {
      const th = resizer.parentElement;
      let startX, startWidth;

      resizer.onmousedown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        startX = e.pageX;
        startWidth = th.offsetWidth;
        resizer.classList.add('resizing');

        const onMouseMove = (e) => {
          const newWidth = Math.max(25, startWidth + (e.pageX - startX));
          th.style.width = `${newWidth}px`;
          th.style.minWidth = `${newWidth}px`;
        };

        const onMouseUp = () => {
          resizer.classList.remove('resizing');
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      };

      // Auto-fit on Double Click (Pro Calculation for Fixed Layout)
      resizer.ondblclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const table = th.closest('table');
        if (table) {
          const headers = Array.from(table.querySelectorAll('th'));
          const isIndexResizer = headers.indexOf(th) === 0;

          if (isIndexResizer) {
            // GLOBAL AUTO-FIT: Adjust ALL columns based on the absolute maximum content across all rows
            // 1. Completely clear all width constraints
            headers.forEach(h => {
              h.style.width = '';
              h.style.minWidth = '';
            });

            // 2. Prep for measurement: Force a state where everything expands to its natural limit
            table.style.tableLayout = 'auto';
            table.style.width = 'max-content';
            const originalWS = table.style.whiteSpace;
            table.style.whiteSpace = 'nowrap';

            // 3. Force Layout/Reflow to ensure browser calculates the true 'auto' widths
            table.offsetWidth;

            // 4. Record the browser's calculated 'auto' widths
            const newWidths = headers.map((h, idx) => {
              const rect = h.getBoundingClientRect();
              // Global fix: Index column (#) should be tight. All others use content measurement.
              if (idx === 0) return 45;

              const measured = Math.ceil(rect.width) + 14;
              return Math.max(60, measured);
            });

            // 5. Hardwire these values back to fixed layout
            headers.forEach((h, idx) => {
              h.style.width = `${newWidths[idx]}px`;
              h.style.minWidth = `${newWidths[idx]}px`;
            });

            // 6. Restore fixed layout system
            table.style.whiteSpace = originalWS;
            table.style.tableLayout = 'fixed';
            const total = newWidths.reduce((a, b) => a + b, 0);
            table.style.width = `${total}px`;
          } else {
            // LOCAL AUTO-FIT: Strictly lock others, only reset target
            const currentWidths = headers.map(h => h.offsetWidth);

            // 1. Lock all OTHER headers to their current pixel widths
            headers.forEach((header, idx) => {
              if (header !== th) {
                header.style.width = `${currentWidths[idx]}px`;
                header.style.minWidth = `${currentWidths[idx]}px`;
              } else {
                header.style.width = '';
                header.style.minWidth = '';
              }
            });

            // 2. Prep for measurement
            table.style.tableLayout = 'auto';
            table.style.width = 'max-content';
            const originalWS = table.style.whiteSpace;
            table.style.whiteSpace = 'nowrap';

            // Force Reflow
            table.offsetWidth;

            // 3. Capture the browser's measured width for target
            const measuredTargetWidth = Math.ceil(th.getBoundingClientRect().width);

            // 4. Apply back
            const finalWidth = Math.max(60, measuredTargetWidth + 14);
            th.style.width = `${finalWidth}px`;
            th.style.minWidth = `${finalWidth}px`;

            // 5. Restore
            table.style.whiteSpace = originalWS;
            table.style.tableLayout = 'fixed';
            let finalTotal = headers.reduce((acc, h) => acc + h.offsetWidth, 0);
            table.style.width = `${finalTotal}px`;
          }
        }
      };
    });
  };

  const CATALOG_TYPE_ICONS = {
    text: '<span class="type-pill type-text">TEXT</span>',
    number: '<span class="type-pill type-number">INT64</span>',
    decimal: '<span class="type-pill type-decimal">DECIMAL</span>',
    date: '<span class="type-pill type-date">DATE</span>',
    boolean: '<span class="type-pill type-bool">BOOL</span>'
  };

  // Automated Catalog Builder
  const buildCatalogHierarchy = (data) => {
    // Check if we already have the hierarchy or need to build it from flat metadata
    if (data.hierarchy) return data.hierarchy;

    const metadata = data.metadata || data;
    const tableMap = {};

    metadata.forEach(col => {
      if (!tableMap[col.table_name]) {
        tableMap[col.table_name] = {
          name: col.table_name,
          type: 'table',
          columns: [],
          rows: col.non_null
        };
      }

      tableMap[col.table_name].columns.push({
        name: col.column_name,
        type: col.type,
        nonNull: col.non_null,
        distinct: col.distinct,
        samples: col.samples
      });
    });

    const tables = Object.values(tableMap).sort((a, b) => a.name.localeCompare(b.name));

    return [
      {
        name: 'warehouse',
        type: 'database',
        open: true,
        children: [
          {
            name: 'gold',
            type: 'schema',
            open: true,
            children: tables
          }
        ]
      }
    ];
  };

  const catalogData = buildCatalogHierarchy(catalogMetadata);

  // Cache for real table previews to avoid flickering/re-querying
  let tablePreviewCache = {};

  const ICONS = {
    js: '<img src="https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/master/icons/javascript.svg" width="16" height="16">',
    py: '<img src="https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/master/icons/python.svg" width="16" height="16">',
    html: '<img src="https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/master/icons/html.svg" width="16" height="16">',
    css: '<img src="https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/master/icons/css.svg" width="16" height="16">',
    sql: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3eb0ef" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>',
    json: '<img src="https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/master/icons/json.svg" width="16" height="16">',
    md: '<img src="https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/master/icons/markdown.svg" width="16" height="16">',
    txt: '<img src="https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/master/icons/document.svg" width="16" height="16">',
    default: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#858585" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>',
    folder: '<svg width="16" height="16" viewBox="0 0 24 24" fill="#dcb67a"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>',
    folderOpen: '<svg width="16" height="16" viewBox="0 0 24 24" fill="#dcb67a"><path d="M20 18H4V8h16v10zM10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>',
    chevron: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>'
  };

  const CATALOG_ICONS = {
    database: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>', // Layered
    schema: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b392f0" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>', // Cube
    table: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7ee787" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="3" x2="9" y2="21"/></svg>'
  };



  section.innerHTML = `
    <style>
      .folder-chevron, .catalog-arrow { width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; color: var(--ide-text); transition: transform 0.2s; margin-right: 4px; }
      .folder-chevron.expanded, .catalog-arrow.expanded { transform: rotate(90deg); }
      .folder-indent { width: 14px; margin-right: 4px; flex-shrink: 0; }
      .file-icon-wrap { margin-right: 8px; display: flex; align-items: center; opacity: 0.9; }
      .file-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .file-main { display: flex; align-items: center; width: 100%; white-space: nowrap; height: 100%; }
      .file-icon-wrap { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; margin-right: 8px; flex-shrink: 0; }
      .file-main span { overflow: hidden; text-overflow: ellipsis; }
      .ide-tab .tab-close:hover { 
        opacity: 1; 
        background: rgba(255, 255, 255, 0.08); 
        animation: rainbowSimultaneous 4s linear infinite;
        color: var(--ide-text-bright);
        border-radius: 4px;
      }
      [data-theme="light"] .ide-tab .tab-close:hover {
        background: rgba(0, 0, 0, 0.05);
      }
      .ide-tab { width: 160px; flex-shrink: 0; justify-content: space-between; overflow: hidden; }
      .ide-tab .tab-main { display: flex; align-items: center; gap: 6px; overflow: hidden; white-space: nowrap; flex: 1; }
      .ide-tab .tab-main span { overflow: hidden; text-overflow: ellipsis; }
      .ide-tabs { 
        display: flex; 
        overflow-x: auto; 
        scrollbar-width: none; 
        -ms-overflow-style: none;
        scroll-behavior: smooth;
      }
      .ide-tabs::-webkit-scrollbar { display: none; }
      
      .ide-file-item { 
        display: flex; align-items: center; height: 32px; padding: 0 12px; cursor: pointer; color: var(--ide-text); 
        gap: 6px; border-left: none; transition: all 0.2s;
      }
      .ide-file-item:hover, .catalog-node:hover, .column-item:hover { background: rgba(255, 255, 255, 0.06); }
      [data-theme="light"] .ide-file-item:hover, [data-theme="light"] .catalog-node:hover, [data-theme="light"] .column-item:hover { background: rgba(0, 0, 0, 0.06); }
      .ide-file-item.drag-over { 
        background: rgba(153, 255, 255, 0.05) !important;
        box-shadow: inset 0 0 10px rgba(153, 255, 255, 0.2);
        border-left: 3px solid transparent !important;
        border-image: linear-gradient(to bottom, #99ffff, #ff99ff) 1;
      }
      .ide-sidebar.drag-over-container {
        background: rgba(255, 255, 255, 0.05);
        box-shadow: inset 0 0 20px rgba(153, 255, 255, 0.15);
        transition: background 0.2s, box-shadow 0.2s;
        border-radius: 10px;
      }


      /* Premium Modal Styles */
      .ide-modal-overlay { 
        position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0, 0, 0, 0.25); z-index: 10000; 
        display: flex; align-items: center; justify-content: center; 
        backdrop-filter: blur(6px);
        animation: fadeIn 0.3s ease;
      }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      
      .ide-modal { 
        background: #252526; 
        border: 1px solid rgba(255, 255, 255, 0.15); 
        border-radius: 14px; 
        width: 420px; 
        box-shadow: 0 30px 60px rgba(0, 0, 0, 0.8); 
        overflow: hidden; 
        animation: modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      @keyframes modalPop { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      
      .ide-modal-header { 
        padding: 20px 24px; 
        background: #323233; 
        font-weight: 600; 
        font-size: 14px; 
        color: #ffffff; 
        border-bottom: 1px solid rgba(255, 255, 255, 0.1); 
        letter-spacing: 0.3px;
      }
      .ide-modal-body { 
        padding: 30px 24px; 
        font-size: 14px; 
        color: rgba(255, 255, 255, 0.85); 
        line-height: 1.6; 
        background: #1e1e1e;
      }
      .ide-modal-footer { 
        padding: 16px 24px; 
        display: flex; 
        justify-content: flex-end; 
        gap: 12px; 
        background: #252526; 
        border-top: 1px solid rgba(255, 255, 255, 0.05);
      }
      .modal-btn { 
        padding: 10px 24px !important; 
        border-radius: 8px !important; 
        border: none !important; 
        font-size: 13px; 
        cursor: pointer; 
        transition: all 0.2s ease; 
        font-family: inherit; 
        font-weight: 500;
      }
      .modal-btn.cancel { 
        background: transparent; 
        color: rgba(255, 255, 255, 0.6); 
        border: 1px solid rgba(255, 255, 255, 0.1) !important; 
      }
      .modal-btn.cancel:hover { 
        background: rgba(255, 255, 255, 0.05); 
        color: #ffffff; 
      }
      .modal-btn.confirm { 
        background: rgba(255, 255, 255, 0.08); 
        color: #ffffff; 
        font-weight: 500; 
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }
      .modal-btn.confirm:hover { 
        transform: translateY(-1px); 
        background: rgba(255, 255, 255, 0.12); 
        border-color: rgba(255, 255, 255, 0.4) !important;
      }
      
      /* Light Mode Overrides for Modal */
      [data-theme="light"] .ide-modal-overlay {
        background: rgba(255, 255, 255, 0.3);
      }
      [data-theme="light"] .ide-modal {
        background: #ffffff;
        border-color: rgba(0, 0, 0, 0.1);
        box-shadow: 0 30px 60px rgba(0, 0, 0, 0.15);
      }
      [data-theme="light"] .ide-modal-header {
        background: #f6f8fa;
        color: #1a1f23;
        border-bottom-color: rgba(0, 0, 0, 0.08);
      }
      [data-theme="light"] .ide-modal-body {
        background: #ffffff;
        color: #24292f;
      }
      [data-theme="light"] .ide-modal-footer {
        background: #f6f8fa;
        border-top-color: rgba(0, 0, 0, 0.05);
      }
      [data-theme="light"] .modal-btn.cancel {
        color: #57606a;
        border-color: rgba(0, 0, 0, 0.1) !important;
      }
      [data-theme="light"] .modal-btn.confirm {
        background: rgba(0, 0, 0, 0.03);
        color: #1a1f23;
        border-color: rgba(0, 0, 0, 0.15) !important;
      }
      [data-theme="light"] .modal-btn.confirm:hover {
        background: rgba(0, 0, 0, 0.06);
        border-color: rgba(0, 0, 0, 0.3) !important;
      }
      
      /* Ensure IDE Window base styles are robust and theme-aware */
      #ide-window {
        background: var(--ide-bg) !important;
        border-radius: 12px;
        box-shadow: 0 40px 100px rgba(0, 0, 0, 0.4);
        border: 1px solid var(--ide-border);
      }
      [data-theme="dark"] #ide-window {
        box-shadow: 0 40px 100px rgba(0, 0, 0, 0.8);
        border-color: rgba(255, 255, 255, 0.1);
      }

      .workspace-copy-btn { opacity: 0; padding: 10px; gap: 10px; cursor: pointer; transition: all 0.2s; color: var(--ide-text); display: flex; align-items: center; justify-content: center; margin-left: auto; }
      .ide-file-item:hover .workspace-copy-btn { opacity: 1; }
      .workspace-copy-btn:hover { background: rgba(255, 255, 255, 0.1); color: var(--ide-text-bright); }
      [data-theme="light"] .workspace-copy-btn:hover,
      [data-theme="light"] .copy-table-btn:hover,
      [data-theme="light"] .copy-col-btn:hover { background: rgba(0, 0, 0, 0.08) !important; }

      @keyframes pulse-ring {
        0% { transform: scale(0.8); opacity: 0.5; }
        50% { transform: scale(1.2); opacity: 0.3; }
        100% { transform: scale(1.5); opacity: 0; }
      }
      .fab-pulse::after {
        content: '';
        position: absolute;
        width: 100%; height: 100%;
        top: 0; left: 0;
        border-radius: 50%;
        background: var(--ide-accent);
        animation: pulse-ring 1.5s ease-out infinite;
      }

      .session-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        background: rgba(126, 231, 135, 0.1);
        border: 1px solid rgba(126, 231, 135, 0.2);
        border-radius: 6px;
        font-size: 10px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #7ee787;
      }

      .badge-dot {
        width: 6px;
        height: 6px;
        background: #7ee787;
        border-radius: 50%;
        box-shadow: 0 0 8px #7ee787;
        animation: status-pulse 2s infinite;
        flex-shrink: 0;
        margin-top: -1px; /* Optical adjustment */
      }

      [data-theme="light"] .session-badge {
        background: rgba(0, 122, 204, 0.05);
        border-color: rgba(0, 122, 204, 0.1);
        color: #007acc;
      }
      [data-theme="light"] .badge-dot {
        background: #007acc;
        box-shadow: 0 0 8px #007acc;
      }

      .terminal-instance-container {
        position: relative;
        display: flex;
        align-items: center;
      }
      .custom-select-trigger {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--ide-border);
        color: var(--ide-text);
        font-size: 11px;
        padding: 2px 28px 2px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-family: var(--ide-font-mono);
        position: relative;
        transition: all 0.2s;
        min-width: 90px;
        display: flex;
        align-items: center;
        user-select: none;
        height: 22px;
      }
      .custom-select-trigger::after {
        content: "";
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        width: 10px;
        height: 10px;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23858585' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-size: contain;
      }
      [data-theme="light"] .custom-select-trigger::after {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2357606a' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      }
      .custom-select-trigger:hover { 
        background-color: rgba(255, 255, 255, 0.1); 
      }
      [data-theme="light"] .custom-select-trigger { background-color: rgba(0, 0, 0, 0.03); }
      [data-theme="light"] .custom-select-trigger:hover { background-color: rgba(0, 0, 0, 0.06); }

      .custom-select-options {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        width: 100%;
        background: var(--ide-sidebar);
        border: 1px solid var(--ide-border);
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        display: none;
        z-index: 1001;
        overflow: hidden;
        padding: 2px;
        box-sizing: border-box;
      }
      .ide-editor-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        height: 100%;
        background: #1e1e1e; /* Solid IDE Background */
        transition: background 0.3s ease;
      }
      [data-theme="light"] .ide-editor-main {
        background: #ffffff;
      }
      .ide-editor-wrapper {
        display: flex;
        flex: 1;
        overflow: hidden !important;
        position: relative;
        height: 100%;
      }
      .editor-scroll-container {
        flex: 1;
        overflow: auto !important;
        position: relative;
        height: 100%;
      }
      .code-content-wrapper {
        position: relative;
        min-width: max-content;
        min-height: 100%;
      }
      /* Unified Scrollbar System for Playground */
      .ide-textarea {
        margin: 0;
        padding: 10px;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        overflow: hidden !important;
        resize: none;
        z-index: 2;
        border: none;
        outline: none;
      }
      .ide-pre {
        margin: 0;
        padding: 10px;
        position: relative;
        min-width: 100%;
        box-sizing: border-box;
        overflow: hidden !important;
        z-index: 1;
        pointer-events: none;
      }
      .custom-select-options.active { display: block; }
      
      .custom-select-option {
        padding: 2px 10px;
        font-size: 11px;
        color: var(--ide-text);
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.2s;
        font-family: var(--ide-font-mono);
      }
      .custom-select-option:hover {
        background: rgba(255, 255, 255, 0.12);
        color: var(--ide-text-bright);
      }
      [data-theme="light"] .custom-select-option:hover {
        background: rgba(0, 0, 0, 0.05);
      }
      .custom-select-option.selected {
        background: rgba(255, 255, 255, 0.15);
        color: var(--ide-text-bright);
        font-weight: bold;
      }

      .ide-icon.active {
        color: var(--ide-text-bright);
        background: rgba(255, 255, 255, 0.05);
      }
      /* .active-selection and .active managed in main style block */
      [data-theme="light"] .ide-icon:hover { background: rgba(0, 0, 0, 0.05); }
      [data-theme="light"] .ide-icon.active { background: rgba(0, 0, 0, 0.05); }
      .sidebar-action-btn:hover, .toolbar-btn:hover { background: rgba(255, 255, 255, 0.05); animation: rainbowSimultaneous 4s linear infinite; }
      [data-theme="light"] .sidebar-action-btn:hover, [data-theme="light"] .toolbar-btn:hover { background: rgba(0, 0, 0, 0.05); }

      .catalog-viewport {
        flex: 1;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: rgba(0, 0, 0, 0.2);
        position: relative;
        cursor: grab;
      }
      [data-theme="light"] .catalog-viewport {
        background: #e9ecef linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px);
        background-size: 20px 20px;
      }
      .catalog-viewport:active { cursor: grabbing; }

      .catalog-flow-content {
        position: absolute;
        transform-origin: 0 0;
        min-width: 100%;
        min-height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        padding: 40px 100px 100px 100px;
        box-sizing: border-box;
      }

      .detail-section {
        padding: 24px 40px;
        color: var(--ide-text);
        font-family: var(--ide-font-mono);
      }
      .detail-grid {
        display: grid;
        grid-template-columns: 160px 1fr;
        gap: 16px 32px;
        background: rgba(255, 255, 255, 0.03);
        padding: 32px;
        border-radius: 12px;
        border: 1px solid var(--ide-border);
      }
      [data-theme="light"] .detail-grid {
        background: rgba(0, 0, 0, 0.015);
      }
      .detail-label {
        font-weight: 600;
        opacity: 0.6;
        font-size: 13px;
        display: flex;
        align-items: center;
      }
      .detail-value {
        font-size: 13px;
        color: var(--ide-text-bright);
        display: flex;
        align-items: center;
      }
      .detail-section h2 {
        margin-top: 0;
        margin-bottom: 24px;
        font-size: 14px;
        color: var(--ide-text-bright);
        opacity: 0.8;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .explorer-content {
        flex: 1;
        min-height: 0;
      }

      .catalog-flow-container { 
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        gap: 60px; 
        padding-top: 20px; 
        position: relative;
        z-index: 1;
      }
      .flow-level {
        display: flex;
        gap: 40px;
        justify-content: center;
        flex-wrap: nowrap;
        position: relative;
        z-index: 2;
      }

      .sql-result-wrapper {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        width: 100%;
        margin-bottom: 24px;
        border-bottom: 1px solid var(--ide-border);
      }

      .sql-summary-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 15px;
        background: var(--ide-header);
        border-bottom: 1px solid var(--ide-border);
        font-size: 11px;
        color: var(--ide-text);
        opacity: 0.8;
        position: sticky;
        top: 0;
        z-index: 20;
      }
      .sql-summary-bar svg { opacity: 0.6; }

      .sql-grid-layout {
        display: flex;
        flex-direction: row;
        background: var(--ide-bg);
        overflow: hidden;
        border: 1px solid var(--ide-border);
        border-radius: 0;
        border-top: none;
        border-left: none;
        border-right: none;
      }

      .sql-gutter {
        width: 35px;
        background: var(--ide-sidebar);
        border-right: 1px solid var(--ide-border);
        display: flex;
        flex-direction: column;
        color: var(--ide-text);
        opacity: 0.4;
        font-size: 10px;
        font-family: var(--ide-font-mono);
        text-align: center;
        flex-shrink: 0;
      }
      
      .sql-gutter-header {
        height: 28px;
        background: var(--ide-header);
        border-bottom: 1px solid var(--ide-border);
        position: sticky;
        top: 28px; /* sync with summary bar stickiness */
        z-index: 12;
      }

      .sql-gutter-item { 
        height: 28px; /* sync with tr height */
        display: flex;
        align-items: center;
        justify-content: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }

      .sql-scroll-pane {
        flex: 1;
        overflow-x: auto;
        overflow-y: visible; /* Let terminal handle vertical scroll */
      }

      .preview-table thead th {
        background: var(--ide-header);
        position: sticky;
        top: 28px; /* Below summary bar */
        z-index: 5;
        font-weight: 600;
        font-size: 11px;
        padding: 8px 12px;
        border-bottom: 1px solid var(--ide-border);
        border-right: 1px solid var(--ide-border);
        color: var(--ide-text);
        text-align: left;
        height: 28px;
        box-sizing: border-box;
      }

      .th-content {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 2px;
      }
      .th-main {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
      }

      .th-type-icon {
        opacity: 0.5;
        display: flex;
        align-items: center;
      }

      .preview-table td {
        padding: 6px 12px;
        font-size: 12px;
        font-family: var(--ide-font-mono);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        border-right: 1px solid rgba(255, 255, 255, 0.05);
        white-space: nowrap;
        height: 28px; /* Fixed height for gutter sync */
        box-sizing: border-box;
      }

      [data-theme="light"] .sql-gutter { background: #f6f8fa; }
      [data-theme="light"] .preview-table td { border-color: rgba(0, 0, 0, 0.05); }

      .terminal-add-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 4px;
        color: var(--ide-text);
        cursor: pointer;
        transition: all 0.2s;
      }
      .terminal-add-btn:hover { 
        background: rgba(255, 255, 255, 0.08); 
        animation: rainbowSimultaneous 4s linear infinite;
        color: var(--ide-text-bright); 
      }
      .terminal-add-btn:active {
        transform: scale(0.92);
      }
      
      .ide-file-item.active,
      .catalog-node.active {
        background: rgba(255, 255, 255, 0.05) !important;
        color: var(--ide-text-bright);
        position: relative !important;
      }
      [data-theme="light"] .ide-file-item.active,
      [data-theme="light"] .catalog-node.active {
        background: rgba(0, 0, 0, 0.05) !important;
      }
      
      .ide-file-item.active-selection,
      .catalog-node.active-selection {
        background: rgba(255, 255, 255, 0.1) !important;
        color: var(--ide-text-bright);
        position: relative !important;
      }
      [data-theme="light"] .ide-file-item.active-selection,
      [data-theme="light"] .catalog-node.active-selection {
        background: rgba(0, 0, 0, 0.08) !important;
      }
      
      .ide-file-item.active-selection.last-selected,
      .catalog-node.active-selection.last-selected {
        background: rgba(255, 255, 255, 0.15) !important;
      }
      [data-theme="light"] .ide-file-item.active-selection.last-selected,
      [data-theme="light"] .catalog-node.active-selection.last-selected {
        background: rgba(0, 0, 0, 0.12) !important;
      }
      
      .ide-status-bar {
        height: 24px;
        background: var(--rainbow-gradient);
        background-size: 200% 200%;
        animation: rainbowSlide 5s linear infinite;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 25px;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.95) !important;
        font-weight: 500;
        user-select: none;
        flex-shrink: 0;
        margin: 0 -10px -1px -10px;
        width: calc(100% + 20px);
        box-shadow: 0 -1px 12px rgba(0,0,0,0.15);
        z-index: 20;
        line-height: 24px;
      }
      .ide-body {
        flex: 1;
        display: flex;
        overflow: hidden;
      }
      .ide-status-bar * { color: inherit !important; }
      
      [data-theme="light"] .ide-status-bar {
        color: rgba(0, 0, 0, 0.9) !important;
      }
      .status-left, .status-right { display: flex; align-items: center; gap: 16px; height: 100%; }
      .status-item { display: flex; align-items: center; gap: 4px; height: 100%; }
      .status-dot-pulse {
        width: 6px; height: 6px;
        background: currentColor;
        opacity: 0.6;
        border-radius: 50%;
        animation: status-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
      @keyframes status-pulse { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 0.3; transform: scale(0.8); } }

      /* Table Resizing System */
      .preview-table th {
        position: relative;
        padding: 10px;
        text-align: left;
        font-size: 11px;
        border-bottom: 1px solid var(--ide-border);
        white-space: nowrap;
        user-select: none;
      }
      .ide-editor-header {
        display: flex;
        background: var(--ide-tab-inactive);
        border-bottom: 1px solid var(--ide-border);
        height: 35px;
        justify-content: space-between;
        align-items: center;
      }

      .ide-tabs-container {
        position: relative;
        flex: 1;
        overflow: hidden;
        height: 100%;
        display: flex;
        align-items: center;
      }

      /* Edge Fades */
      .ide-tabs-container::before,
      .ide-tabs-container::after {
        content: "";
        position: absolute;
        top: 0;
        bottom: 0;
        width: 32px;
        z-index: 5;
        pointer-events: none;
        transition: opacity 0.3s ease;
        opacity: 0;
      }

      .ide-tabs-container::before {
        left: 0;
        background: linear-gradient(90deg, var(--ide-tab-inactive) 0%, transparent 100%);
      }

      .ide-tabs-container::after {
        right: 0;
        background: linear-gradient(-90deg, var(--ide-tab-inactive) 0%, transparent 100%);
      }

      .ide-tabs-container.can-scroll-left::before { opacity: 1; }
      .ide-tabs-container.can-scroll-right::after { opacity: 1; }

      /* Floating Indicator Buttons */
      .tab-overflow-indicator {
        position: absolute;
        top: 50%;
        transform: translateY(-50%) scale(0.7);
        width: 22px;
        height: 22px;
        background: var(--ide-bg-dark);
        border: 1px solid var(--ide-border);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        cursor: pointer;
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        pointer-events: none;
        box-shadow: 0 2px 10px rgba(0,0,0,0.5);
        color: var(--ide-text-bright);
      }

      .tab-overflow-indicator:hover {
        background: var(--ide-header);
        border-color: rgba(255, 255, 255, 0.3);
        transform: translateY(-50%) scale(1.1);
      }

      .can-scroll-left .tab-overflow-indicator.left {
        opacity: 1;
        pointer-events: auto;
        left: 4px;
        transform: translateY(-50%) scale(1);
      }

      .can-scroll-right .tab-overflow-indicator.right {
        opacity: 1;
        pointer-events: auto;
        right: 4px;
        transform: translateY(-50%) scale(1);
      }

      .ide-tabs {
        flex: 1;
        height: 100%;
        display: flex;
        overflow-x: auto;
        scrollbar-width: none;
        scroll-behavior: smooth;
      }

      .ide-tabs::-webkit-scrollbar { display: none; }

      .ide-toolbar {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 0 8px;
        height: 100%;
        border-right: 1px solid var(--ide-border);
        background: var(--ide-header);
      }

      .toolbar-btn {
        background: transparent;
        color: var(--ide-text);
        border: none;
        width: 26px;
        height: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.2s;
      }

      .toolbar-btn:hover {
        color: var(--ide-text-bright);
      }

      [data-theme="light"] .toolbar-btn:hover {
        background: rgba(0, 0, 0, 0.05);
      }

      .toolbar-btn.run:hover {
        color: #7ee787;
        filter: drop-shadow(0 0 5px rgba(126, 231, 135, 0.4));
      }

      .toolbar-btn.pause:hover {
        color: #ff7b72;
        filter: drop-shadow(0 0 5px rgba(255, 123, 114, 0.4));
      }

      .toolbar-btn:active {
        transform: scale(0.9);
      }

      .col-resizer {
        position: absolute;
        top: 0;
        right: 0;
        width: 8px;
        height: 100%;
        cursor: col-resize;
        z-index: 11;
        background: transparent;
        transition: background 0.2s;
      }
      .col-resizer:hover {
        background: rgba(255, 255, 255, 0.15) !important;
      }
      [data-theme="light"] .col-resizer:hover {
        background: rgba(0, 0, 0, 0.1) !important;
      }
      .col-resizer.resizing {
        background: rgba(255, 255, 255, 0.25) !important;
        border-right: 1px solid var(--ide-border);
      }
      .line-numbers-sidebar {
        width: 45px;
        background: #1e1e1e;
        color: #858585;
        padding: 10px 0;
        text-align: right;
        font-family: var(--ide-font-mono);
        font-size: 13px;
        line-height: normal;
        user-select: none;
        border-right: 1px solid var(--ide-border);
        overflow: hidden;
        transition: all 0.3s ease;
      }
      [data-theme="light"] .line-numbers-sidebar {
        background: #f5f5f5;
        color: #999;
      }

      [data-theme="light"] .col-resizer.resizing {
        background: rgba(0, 0, 0, 0.15) !important;
      }
      
      .ide-editor-container.terminal-hidden .ide-terminal { display: none; }
      .ide-editor-container.terminal-hidden .ide-terminal-resizer { display: none; }
      .ide-editor-container.terminal-hidden .ide-editor-main { flex: 1 1 100%; height: 100%; }

      .top-scrollbar {
        overflow-x: auto;
        overflow-y: scroll;
        height: 10px;
        background: transparent;
        width: calc(100% - 45px);
        margin-left: 45px;
        border: none;
      }
      .bottom-scrollbar {
        margin-top: -10px;
      }
      #preview-table-container::-webkit-scrollbar:horizontal {
        display: none;
      }
      /* Column Stats Overlay (Insights) */
      .column-stats-overlay {
        position: fixed;
        background: rgba(30, 30, 31, 0.95);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 12px;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
        min-width: 240px;
        z-index: 10000;
        padding: 16px;
        font-family: var(--ide-font-mono);
        color: var(--ide-text);
        animation: modalPop 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        opacity: 0;
        transform: scale(0.95);
        transition: all 0.2s;
        pointer-events: auto;
      }
      .column-stats-overlay.active {
        opacity: 1;
        transform: scale(1);
      }
      [data-theme="light"] .column-stats-overlay {
        background: rgba(255, 255, 255, 0.95);
        border-color: rgba(0, 0, 0, 0.1);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        color: #24292f;
      }
      .stats-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }
      [data-theme="light"] .stats-header {
        border-bottom-color: rgba(0, 0, 0, 0.05);
      }
      .stats-header .label {
        font-size: 10px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        opacity: 0.6;
      }
      .stats-header .count {
        font-size: 11px;
        color: #7ee787;
      }
      [data-theme="light"] .stats-header .count {
        color: #1a7f37;
      }
      .unique-values-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
        max-height: 200px;
        overflow-y: auto;
        padding-right: 4px;
        margin: 8px 0;
      }
      .unique-values-list::-webkit-scrollbar { width: 4px; }
      .unique-values-list::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 4px; }
      [data-theme="light"] .unique-values-list::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); }

      .value-item {
        font-size: 11px;
        padding: 4px 8px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 4px;
        display: flex;
        justify-content: space-between;
        transition: background 0.2s;
      }
      [data-theme="light"] .value-item {
        background: rgba(0, 0, 0, 0.02);
      }
      .value-item:hover {
        background: rgba(255, 255, 255, 0.08);
      }
      [data-theme="light"] .value-item:hover {
        background: rgba(0, 0, 0, 0.08);
      }
      .spinner-small {
        width: 12px;
        height: 12px;
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-top-color: #7ee787;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      [data-theme="light"] .spinner-small {
        border-color: rgba(0, 0, 0, 0.05);
        border-top-color: #1a7f37;
      }
    </style>

    <h2 class="rainbow-title-center reveal" style="color: var(--text-primary); font-family: var(--font-mono);">${translations[lang].playground.title}</h2>
    
    <div class="ide-window reveal" id="ide-window">
      <div class="ide-header">
        <div class="window-controls">
          <div class="control close" id="win-close" title="${translations[lang].playground.tooltips.close}"></div>
          <div class="control minimize" id="win-min" title="${translations[lang].playground.tooltips.collapse}"></div>
          <div class="control maximize" id="win-max" title="${translations[lang].playground.tooltips.fullscreen}"></div>
        </div>
        <span>${translations[lang].playground.windowTitle}</span>
        <div style="width: 52px;"></div> <!-- Spacer to center title -->
      </div>
      <div class="ide-body">
        <div class="ide-activity-bar">
          <!-- Workspace / Repos (Folder) -->
          <div class="ide-icon active" id="v-explorer" title="${translations[lang].playground.tooltips.workspace}">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <!-- Catalog (Geometric Shapes) -->
          <div class="ide-icon" id="v-catalog" title="${translations[lang].playground.tooltips.catalog}">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 1l9 11H3l9-11z"></path>
              <circle cx="7.5" cy="18.5" r="4"></circle>
              <rect x="13" y="14.5" width="8" height="8" rx="1"></rect>
            </svg>
          </div>
        </div>

          <div class="ide-sidebar">
            <div class="ide-sidebar-content" id="sidebar-explorer">
              <div class="ide-sidebar-header">
                <div class="session-badge workspace-badge">
                  <div class="badge-dot"></div>
                  <span>${translations[lang].playground.sidebars.workspace}</span>
                </div>
                <div class="ide-sidebar-actions">
                  <div class="sidebar-action-btn" title="${translations[lang].playground.tooltips.newFile}" id="btn-new-file">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                  </div>
                  <div class="sidebar-action-btn" title="${translations[lang].playground.tooltips.newFolder}" id="btn-new-folder">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="17" x2="12" y2="11"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>
                  </div>
                  <div class="sidebar-action-btn" title="${translations[lang].playground.tooltips.refresh}" id="btn-refresh">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                  </div>
                  <div class="sidebar-action-btn" title="Toggle All" id="btn-toggle-workspace">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="toggle-icon-workspace">
                      <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </div>
                </div>
              </div>
              <div class="ide-file-list" id="ide-file-list"></div>
            </div>
            <div class="ide-sidebar-content" id="sidebar-catalog" style="display:none;">
              <div class="ide-sidebar-header">
                <div class="session-badge">
                  <div class="badge-dot"></div>
                  <span>${translations[lang].playground.sidebars.catalog}</span>
                </div>
                <div class="ide-sidebar-actions">
                  <div class="sidebar-action-btn" title="${translations[lang].playground.tooltips.refresh}" id="btn-refresh-catalog">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                  </div>
                  <div class="sidebar-action-btn" title="Toggle All" id="btn-toggle-catalog">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="toggle-icon-catalog">
                      <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </div>
                </div>
              </div>
              <div class="catalog-tree" id="catalog-tree"></div>
            </div>
          </div>

        <div class="ide-editor-container">
          <div class="ide-editor-main">
            <div class="ide-editor-header">
              <div class="ide-toolbar">
                <button id="run-btn" class="toolbar-btn run" title="${translations[lang].playground.tooltips.run}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                </button>
                <button id="pause-btn" class="toolbar-btn pause" title="Interrupt Execution">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                </button>
              </div>
              <div class="ide-tabs-container" id="ide-tabs-container">
                <div class="tab-overflow-indicator left" id="tabs-scroll-left">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                </div>
                <div class="ide-tabs" id="ide-tabs"></div>
                <div class="tab-overflow-indicator right" id="tabs-scroll-right">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                </div>
              </div>
            </div>
            <div class="ide-editor-wrapper">
              <div id="editor-view" style="display: flex; flex: 1; width: 100%; height: 100%;">
                <div class="line-numbers-sidebar" id="line-numbers" style="flex-shrink: 0; z-index: 10;"></div>
                <div class="editor-scroll-container" id="editor-scroller" style="flex: 1; position: relative; overflow: hidden;">
                  <div class="code-content-wrapper">
                    <textarea id="ide-textarea" class="ide-textarea" spellcheck="false"></textarea>
                    <pre id="ide-pre" class="ide-pre"><code id="ide-code"></code></pre>
                  </div>
                </div>
                <!-- Search Widget (Fixed Position) -->
                <div id="ide-search-widget" class="ide-search-widget">
                  <div class="search-input-wrapper">
                    <input type="text" placeholder="Find" id="search-input" spellcheck="false" autocomplete="off">
                    <span id="search-count">0/0</span>
                  </div>
                  <div class="search-actions">
                    <div class="search-action-btn" id="search-prev" title="Previous Match (Shift+F3)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"></polyline></svg>
                    </div>
                    <div class="search-action-btn" id="search-next" title="Next Match (F3)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                    <div class="search-action-btn" id="search-close" title="Close (Escape)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"></path></svg>
                    </div>
                  </div>
                </div>
              </div>
              <div id="catalog-explorer-view" class="catalog-explorer" style="display: none;"></div>
            </div>
          </div>
          <div class="ide-terminal-resizer" id="terminal-resizer" title="Resize Terminal">
            <div class="resizer-bar"></div>
          </div>
          <div class="ide-terminal">
            <div class="terminal-header">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span>${translations[lang].playground.terminal.title}</span>
                <div style="display: flex; align-items: center; gap: 4px;">
                  <div class="terminal-instance-container">
                    <div id="terminal-select-trigger" class="custom-select-trigger">1: Terminal</div>
                    <div id="terminal-select-options" class="custom-select-options"></div>
                  </div>
                  <div id="terminal-add" class="terminal-add-btn" title="New Terminal">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </div>
                </div>
              </div>
              <div class="terminal-actions">
                <button id="refresh-terminal-btn" class="run-btn" title="Clear Output">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                </button>
                <button id="delete-terminal-btn" class="run-btn" title="Delete Terminal">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>
            <div class="terminal-output" id="terminal-output"></div>
          </div>
        </div>
      </div>
      <div class="ide-status-bar">
        <div class="status-left">
          <div class="status-item" title="Current Branch">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: -2px;"><path d="M6 3v12"></path><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>
            <span>main</span>
          </div>
          <div class="status-item" title="Python Runtime">
            <span>Python <span style="opacity: 0.6;">Pyodide 0.23.4</span></span>
          </div>
          <div class="status-item" title="SQL Engine">
             <span>SQL <span style="opacity: 0.6;">DuckDB WASM</span></span>
          </div>
          <div class="status-item" id="status-lang-badge" style="margin-left: 10px;"><span>Plain Text</span></div>
        </div>
        <div class="status-right">
          <div class="status-item"><span>UTF-8</span></div>
        </div>
      </div>
    </div>
  `;

  // Interaction Logic
  setTimeout(async () => {
    const textarea = section.querySelector('#ide-textarea');
    const preCode = section.querySelector('#ide-code');
    const lineNumbers = section.querySelector('#line-numbers');
    const editorScroller = section.querySelector('#editor-scroller');

    // Sync scroll
    if (editorScroller) {
      editorScroller.onscroll = () => {
        lineNumbers.scrollTop = editorScroller.scrollTop;
      };
    }
    // Advanced Editor Shortcuts (VS Code Style)
    textarea.addEventListener('keydown', (e) => {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;

      // Tab / Shift + Tab (Indenting)
      if (e.key === 'Tab') {
        e.preventDefault();
        const before = value.substring(0, start);
        const after = value.substring(end);
        const selection = value.substring(start, end);
        const lastNewLine = before.lastIndexOf('\n') + 1;

        if (selection.includes('\n')) {
          const lines = value.substring(lastNewLine, end).split('\n');
          if (e.shiftKey) {
            const newLines = lines.map(l => l.startsWith('  ') ? l.substring(2) : l.startsWith(' ') ? l.substring(1) : l);
            const newText = newLines.join('\n');
            textarea.value = value.substring(0, lastNewLine) + newText + after;
            textarea.selectionStart = start - (lines[0].startsWith(' ') ? (lines[0].startsWith('  ') ? 2 : 1) : 0);
            textarea.selectionEnd = lastNewLine + newText.length;
          } else {
            const newText = lines.map(l => '  ' + l).join('\n');
            textarea.value = value.substring(0, lastNewLine) + newText + after;
            textarea.selectionStart = start + 2;
            textarea.selectionEnd = lastNewLine + newText.length;
          }
        } else {
          if (e.shiftKey) {
            const currentLineStart = lastNewLine;
            const line = value.substring(currentLineStart, end);
            if (line.startsWith(' ') || line.startsWith('  ')) {
              const shift = line.startsWith('  ') ? 2 : 1;
              textarea.value = value.substring(0, currentLineStart) + line.substring(shift) + after;
              textarea.selectionStart = textarea.selectionEnd = Math.max(currentLineStart, start - shift);
            }
          } else {
            textarea.value = before + '  ' + after;
            textarea.selectionStart = textarea.selectionEnd = start + 2;
          }
        }
        syncEditor();
      }

      // Ctrl + F (Find) - Toggle logic
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        toggleSearch();
      }

      // Ctrl + D (Select Next Occurrence / Select Word)
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        if (start === end) {
          // Select word under cursor
          const beforeAt = value.substring(0, start).search(/[a-zA-Z0-9_]*$/);
          const afterAt = value.substring(start).search(/[^a-zA-Z0-9_]/);
          const wordStart = beforeAt;
          const wordEnd = start + (afterAt === -1 ? value.length - start : afterAt);
          textarea.setSelectionRange(wordStart, wordEnd);

          // Trigger highlights for all occurrences
          currentSearchQuery = textarea.value.substring(wordStart, wordEnd);
          performSearch();
        } else {
          // Select next occurrence and keep highlights
          const selectedText = value.substring(start, end);
          if (selectedText) {
            currentSearchQuery = selectedText;
            const nextIdx = value.indexOf(selectedText, end);
            if (nextIdx !== -1) {
              textarea.setSelectionRange(nextIdx, nextIdx + selectedText.length);
              const lineIdx = value.substring(0, nextIdx).split('\n').length - 1;
              const lineHeight = 21;
              editorScroller.scrollTop = Math.max(0, (lineIdx * lineHeight) - (editorScroller.offsetHeight / 2));
            } else {
              const wrapIdx = value.indexOf(selectedText);
              if (wrapIdx !== -1) {
                textarea.setSelectionRange(wrapIdx, wrapIdx + selectedText.length);
                const lineIdx = value.substring(0, wrapIdx).split('\n').length - 1;
                const lineHeight = 21;
                editorScroller.scrollTop = Math.max(0, (lineIdx * lineHeight) - (editorScroller.offsetHeight / 2));
              }
            }
            performSearch();
          }
        }
        syncEditor();
      }

      // Alt + Up / Down (Move Line)
      if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        const lines = value.split('\n');
        const currentLineIdx = value.substring(0, start).split('\n').length - 1;
        const targetIdx = e.key === 'ArrowUp' ? currentLineIdx - 1 : currentLineIdx + 1;

        if (targetIdx >= 0 && targetIdx < lines.length) {
          const temp = lines[currentLineIdx];
          lines[currentLineIdx] = lines[targetIdx];
          lines[targetIdx] = temp;
          textarea.value = lines.join('\n');

          let newPos = 0;
          for (let i = 0; i < targetIdx; i++) newPos += lines[i].length + 1;
          const charOffset = start - value.lastIndexOf('\n', start - 1) - 1;
          textarea.selectionStart = textarea.selectionEnd = newPos + charOffset;
          syncEditor();
        }
      }

      // Ctrl + / (Toggle Comment)
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        const isSQL = currentSession.fileName?.endsWith('.sql');
        const commentStr = isSQL ? '-- ' : '# ';
        const lastNewLine = value.lastIndexOf('\n', start - 1) + 1;
        let nextNewLine = value.indexOf('\n', end);
        if (nextNewLine === -1) nextNewLine = value.length;

        const selection = value.substring(lastNewLine, nextNewLine);
        const lines = selection.split('\n');
        const allCommented = lines.every(l => l.trim().startsWith(commentStr.trim()) || l.trim() === '');

        const newLines = lines.map(l => {
          if (allCommented) return l.replace(commentStr, '');
          return commentStr + l;
        });

        textarea.value = value.substring(0, lastNewLine) + newLines.join('\n') + value.substring(nextNewLine);
        textarea.selectionStart = lastNewLine;
        textarea.selectionEnd = lastNewLine + newLines.join('\n').length;
        syncEditor();
      }

      // Enter: Auto-indent and Reset Horizontal Scroll
      if (e.key === 'Enter' && !e.ctrlKey) {
        const lastNewLine = value.lastIndexOf('\n', start - 1) + 1;
        const lineText = value.substring(lastNewLine, start);
        const indentMatch = lineText.match(/^\s*/);
        const indent = indentMatch ? indentMatch[0] : '';

        // Manual insertion to control scroll timing
        e.preventDefault();
        const before = value.substring(0, start);
        const after = value.substring(end);
        textarea.value = before + '\n' + indent + after;
        textarea.selectionStart = textarea.selectionEnd = start + 1 + indent.length;

        syncEditor();

        // Ensure horizontal scroll resets and vertical follows
        editorScroller.scrollLeft = 0; // Immediate reset
        requestAnimationFrame(() => {
          editorScroller.scrollLeft = 0;
          setTimeout(() => {
            editorScroller.scrollLeft = 0;
            scrollSelectionIntoView();
          }, 10);
        });
      }

      // Home (Smart Home & Ctrl + Home)
      if (e.key === 'Home') {
        e.preventDefault();
        if (e.ctrlKey) {
          const target = 0;
          if (e.shiftKey) textarea.setSelectionRange(target, end);
          else textarea.selectionStart = textarea.selectionEnd = target;

          editorScroller.scrollTop = 0;
          editorScroller.scrollLeft = 0;
        } else {
          const lastNewLine = value.lastIndexOf('\n', start - 1) + 1;
          let nextNewLine = value.indexOf('\n', lastNewLine);
          if (nextNewLine === -1) nextNewLine = value.length;

          const lineText = value.substring(lastNewLine, nextNewLine);
          const firstNonWhitespace = lineText.search(/\S/);
          const indentPos = lastNewLine + (firstNonWhitespace === -1 ? 0 : firstNonWhitespace);
          const targetPos = (start === indentPos) ? lastNewLine : indentPos;

          if (e.shiftKey) textarea.setSelectionRange(targetPos, end);
          else textarea.selectionStart = textarea.selectionEnd = targetPos;

          editorScroller.scrollLeft = 0;
        }
      }

      // End Key (Standard & Ctrl + End)
      if (e.key === 'End') {
        e.preventDefault();
        if (e.ctrlKey) {
          const target = value.length;
          if (e.shiftKey) textarea.setSelectionRange(start, target);
          else textarea.selectionStart = textarea.selectionEnd = target;

          setTimeout(() => {
            editorScroller.scrollTop = editorScroller.scrollHeight;
            editorScroller.scrollLeft = editorScroller.scrollWidth;
          }, 0);
        } else {
          let nextNewLine = value.indexOf('\n', start);
          if (nextNewLine === -1) nextNewLine = value.length;

          if (e.shiftKey) textarea.setSelectionRange(start, nextNewLine);
          else textarea.selectionStart = textarea.selectionEnd = nextNewLine;

          requestAnimationFrame(scrollSelectionIntoView);
        }
      }
    });

    // Search Logic
    const searchWidget = section.querySelector('#ide-search-widget');
    const searchInput = section.querySelector('#search-input');
    const searchCount = section.querySelector('#search-count');
    const searchPrev = section.querySelector('#search-prev');
    const searchNext = section.querySelector('#search-next');
    const searchClose = section.querySelector('#search-close');

    let searchMatches = [];
    let currentMatchIdx = -1;

    function performSearch() {
      currentSearchQuery = searchInput.value;
      if (!currentSearchQuery) {
        searchMatches = [];
        currentMatchIdx = -1;
        searchCount.innerText = '0/0';
        syncEditor();
        return;
      }

      searchMatches = [];
      let idx = textarea.value.toLowerCase().indexOf(currentSearchQuery.toLowerCase());
      while (idx !== -1) {
        searchMatches.push(idx);
        idx = textarea.value.toLowerCase().indexOf(currentSearchQuery.toLowerCase(), idx + currentSearchQuery.length);
      }

      if (searchMatches.length > 0) {
        const cursor = textarea.selectionStart;
        currentMatchIdx = searchMatches.findIndex(m => m >= cursor);
        if (currentMatchIdx === -1) currentMatchIdx = 0;
        updateSearchUI(false); // Don't steal focus while typing
      } else {
        currentMatchIdx = -1;
        searchCount.innerText = '0/0';
      }
      syncEditor();
    }

    function updateSearchUI(shouldFocus = false) {
      if (searchMatches.length > 0) {
        searchCount.innerText = `${currentMatchIdx + 1}/${searchMatches.length}`;
        const matchPos = searchMatches[currentMatchIdx];
        textarea.setSelectionRange(matchPos, matchPos + currentSearchQuery.length);
        if (shouldFocus) textarea.focus();

        requestAnimationFrame(() => {
          scrollSelectionIntoView();
          syncEditor(); // Re-sync to show 'current' match highlight
        });
      } else {
        searchCount.innerText = '0/0';
      }
    }

    function scrollSelectionIntoView() {
      const cursor = textarea.selectionStart;
      const value = textarea.value;

      const lastLineBreak = value.lastIndexOf('\n', cursor - 1);
      const lineStart = lastLineBreak + 1;
      const colIdx = cursor - lineStart;

      // Vertical position
      const lineIdx = value.substring(0, cursor).split('\n').length - 1;
      const lineHeight = 21;
      const topPadding = 15;
      const targetY = (lineIdx * lineHeight) + topPadding;
      const viewportHeight = editorScroller.clientHeight;
      const scrollY = editorScroller.scrollTop;

      // Horizontal position
      const charWidth = 8.41;
      const leftPadding = 20;
      const targetX = (colIdx * charWidth) + leftPadding;
      const viewportWidth = editorScroller.clientWidth;
      const scrollX = editorScroller.scrollLeft;

      // Vertical auto-scroll
      if (targetY < scrollY || (targetY + lineHeight) > (scrollY + viewportHeight)) {
        editorScroller.scrollTop = Math.max(0, targetY - (viewportHeight / 2));
      }

      // Horizontal auto-scroll
      if (targetX < scrollX || targetX > (scrollX + viewportWidth - 50)) {
        if (colIdx <= (value.substring(lineStart).search(/\S/) || 0)) {
          editorScroller.scrollLeft = 0;
        } else {
          editorScroller.scrollLeft = Math.max(0, targetX - (viewportWidth / 2));
        }
      }
    }

    function toggleSearch() {
      if (searchWidget.classList.contains('active')) {
        searchClose.click();
      } else {
        searchWidget.classList.add('active');
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        if (selectedText && selectedText.length < 50 && !selectedText.includes('\n')) {
          searchInput.value = selectedText;
        }
        searchInput.focus();
        searchInput.select();
        performSearch();
      }
    }

    searchInput.addEventListener('input', performSearch);
    searchInput.addEventListener('keydown', (e) => {
      // Toggle search on Ctrl+F inside input
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        toggleSearch();
        return;
      }

      if (e.key === 'Enter' || e.key === 'F3') {
        e.preventDefault();
        if (searchMatches.length > 0) {
          if (e.shiftKey) {
            currentMatchIdx = (currentMatchIdx - 1 + searchMatches.length) % searchMatches.length;
          } else {
            currentMatchIdx = (currentMatchIdx + 1) % searchMatches.length;
          }
          updateSearchUI(false); // Don't lose focus from search input
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation(); // Prevent bubbling to IDE-close handlers
        isSearchEsc = true; // Mark as search-close for fullscreenchange stabilizer
        searchClose.click(); // Reuse cleanup logic
      }
    });

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'F3') {
        e.preventDefault();
        if (searchWidget.classList.contains('active')) {
          if (e.shiftKey) {
            currentMatchIdx = (currentMatchIdx - 1 + searchMatches.length) % searchMatches.length;
          } else {
            currentMatchIdx = (currentMatchIdx + 1) % searchMatches.length;
          }
          updateSearchUI();
        } else {
          // Open search if F3 pressed but widget hidden
          const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
          if (selectedText && !selectedText.includes('\n')) {
            searchInput.value = selectedText;
          }
          searchWidget.classList.add('active');
          searchInput.focus();
          performSearch();
        }
      }
    });

    searchNext.onclick = () => {
      if (searchMatches.length > 0) {
        currentMatchIdx = (currentMatchIdx + 1) % searchMatches.length;
        updateSearchUI();
      }
    };

    searchPrev.onclick = () => {
      if (searchMatches.length > 0) {
        currentMatchIdx = (currentMatchIdx - 1 + searchMatches.length) % searchMatches.length;
        updateSearchUI();
      }
    };

    searchClose.onclick = () => {
      searchWidget.classList.remove('active');
      searchInput.value = '';
      currentSearchQuery = '';

      // Clear selection in textarea
      const cursor = textarea.selectionStart;
      textarea.setSelectionRange(cursor, cursor);

      syncEditor();
      textarea.focus();
    };

    const runBtn = section.querySelector('#run-btn');
    const terminal = section.querySelector('#terminal-output');
    const ideTerminal = section.querySelector('.ide-terminal');
    const refreshTerminalBtn = section.querySelector('#refresh-terminal-btn');
    const deleteTerminalBtn = section.querySelector('#delete-terminal-btn');
    const fileListContainer = section.querySelector('#ide-file-list');
    const catalogTreeContainer = section.querySelector('#catalog-tree');
    const tabsContainer = section.querySelector('#ide-tabs');
    const statusInfo = section.querySelector('#status-info');
    const ideWindow = section.querySelector('#ide-window');
    const activityBar = section.querySelector('.ide-activity-bar');
    const explorerSidebar = section.querySelector('#sidebar-explorer');
    const catalogSidebar = section.querySelector('#sidebar-catalog');

    // Simple Background Deselection
    explorerSidebar.onclick = (e) => {
      if (e.target === explorerSidebar || e.target.id === 'sidebar-explorer' || e.target.id === 'ide-file-list') {
        currentSession.selectedFiles = [];
        currentSession.lastSelectedFile = null;
        syncIDEState();
      }
    };

    catalogSidebar.onclick = (e) => {
      if (e.target === catalogSidebar || e.target.id === 'sidebar-catalog' || e.target.id === 'catalog-tree') {
        currentSession.selectedFiles = [];
        currentSession.lastSelectedFile = null;
        syncIDEState();
      }
    };

    const terminalSelectTrigger = section.querySelector('#terminal-select-trigger');
    const terminalSelectOptions = section.querySelector('#terminal-select-options');
    const terminalAdd = section.querySelector('#terminal-add');


    function updateTerminalUI() {
      if (!terminalSelectTrigger || !terminalSelectOptions) return;

      const active = terminalInstances.find(t => t.id === activeTerminalId);
      terminalSelectTrigger.innerText = active ? `${active.id}: ${active.name}` : translations[lang].playground.terminal.title;

      terminalSelectOptions.innerHTML = terminalInstances.map(t =>
        `<div class="custom-select-option ${t.id === activeTerminalId ? 'selected' : ''}" data-id="${t.id}">${t.id}: ${t.name}</div>`
      ).join('');

      terminalSelectOptions.querySelectorAll('.custom-select-option').forEach(opt => {
        opt.onclick = (e) => {
          e.stopPropagation();
          activeTerminalId = parseInt(opt.dataset.id);
          terminalSelectOptions.classList.remove('active');

          // Re-render immediate update
          const newActive = terminalInstances.find(t => t.id === activeTerminalId);
          if (newActive) {
            terminal.innerHTML = newActive.content || '';
            terminal.scrollTop = terminal.scrollHeight;
          }

          updateTerminalUI();
        };
      });

      if (active) {
        terminal.innerHTML = active.content || '';
        terminal.scrollTop = terminal.scrollHeight;
        if (active.content.includes('<table')) {
          setTimeout(() => initTableResizers(terminal), 50);
        }
      }
    }
    updateTerminalUIBound = updateTerminalUI;

    window.addEventListener('mousedown', (e) => {
      if (terminalSelectOptions) terminalSelectOptions.classList.remove('active');
    }, true);


    terminalAdd.onclick = () => {
      const newId = terminalInstances.length > 0 ? Math.max(...terminalInstances.map(t => t.id)) + 1 : 1;
      terminalInstances.push({ id: newId, name: 'Terminal', content: '' });
      activeTerminalId = newId;
      updateTerminalUI();
    };

    deleteTerminalBtn.onclick = () => {
      if (terminalInstances.length > 1) {
        terminalInstances = terminalInstances.filter(t => t.id !== activeTerminalId);
        activeTerminalId = terminalInstances[terminalInstances.length - 1].id;
        updateTerminalUI();
      } else {
        // Only one terminal, clear it and close the panel
        const last = terminalInstances[0];
        if (last) last.content = '';
        currentSession.terminalOpen = false;
        syncTerminalVisibility();
        updateTerminalUI();
      }
    };

    const pauseBtn = section.querySelector('#pause-btn');

    pauseBtn.onclick = () => {
      // Simulation of interrupting DuckDB/Python
      const log = document.createElement('div');
      log.style.color = '#ff7b72';
      log.style.fontSize = '12px';
      log.style.marginTop = '4px';
      log.innerHTML = `<span style="opacity:0.6">[system]</span> Execution interrupted by user.`;
      terminal.appendChild(log);
      terminal.scrollTop = terminal.scrollHeight;

      // Visual feedback
      pauseBtn.style.animation = 'rubberBand 0.3s';
      setTimeout(() => pauseBtn.style.animation = '', 300);
    };

    updateTerminalUI();
    syncTerminalVisibility();

    let pyodide = null;

    function getFileIcon(name) {
      if (name.endsWith('/')) {
        return collapsedFolders.has(name) ? ICONS.folder : ICONS.folderOpen;
      }
      const ext = name.split('.').pop().toLowerCase();
      return ICONS[ext] || ICONS.default;
    }

    function switchFileAndSync(name) {
      switchFile(name, true); // From sidebar
    }

    function renderFileList(container) {
      if (!container) return;
      let itemsHtml = Object.keys(currentFiles)
        .sort((a, b) => {
          // Force README to the absolute top of the root
          if (a === 'README.md') return -1;
          if (b === 'README.md') return 1;

          const aParts = a.split('/');
          const bParts = b.split('/');
          const minLen = Math.min(aParts.length, bParts.length);

          for (let i = 0; i < minLen; i++) {
            if (aParts[i] !== bParts[i]) {
              const aIsLast = i === aParts.length - 1;
              const bIsLast = i === bParts.length - 1;
              const aIsFolder = !aIsLast || a.endsWith('/');
              const bIsFolder = !bIsLast || b.endsWith('/');

              if (aIsFolder !== bIsFolder) return bIsFolder ? 1 : -1;
              return aParts[i].localeCompare(bParts[i]);
            }
          }
          return aParts.length - bParts.length;
        })
        .map(fileName => {
          const parts = fileName.split('/');
          let isVisible = true;
          let pathAcc = '';
          for (let i = 0; i < parts.length - 1; i++) {
            pathAcc += parts[i] + '/';
            if (collapsedFolders.has(pathAcc)) {
              if (fileName !== pathAcc) { isVisible = false; break; }
            }
          }
          if (!isVisible) return '';
          const displayName = fileName.endsWith('/') ? fileName.split('/').slice(-2, -1)[0] : fileName.split('/').pop();
          const isFolder = fileName.endsWith('/');
          const pathParts = fileName.split('/').filter(p => p.length > 0);
          const depth = isFolder ? pathParts.length - 1 : pathParts.length - 1;
          const indent = depth * 18;
          const isExpanded = !collapsedFolders.has(fileName);
          const isBeingRenamed = currentSession.namingNew && currentSession.namingNew.isRename && currentSession.namingNew.oldName === fileName;
          if (isBeingRenamed) {
            return `
              <div class="ide-file-item naming-item active-selection" style="padding-left: ${15 + indent}px">
                <div class="file-icon-wrap">${isFolder ? ICONS.folder : getFileIcon(fileName)}</div>
                <input type="text" class="naming-input" id="naming-input" placeholder="Name..." autofocus style="border-radius: 8px;" />
              </div>`;
          }
          return `
            <div class="ide-file-item ${currentSession.selectedFiles.includes(fileName) ? 'active-selection' : ''} ${fileName === currentSession.lastSelectedFile ? 'last-selected' : ''} ${fileName === currentSession.fileName ? 'active' : ''}" 
                 data-file="${fileName}" draggable="true" style="padding-left: ${8 + indent}px">
              <div class="file-main">
                ${isFolder ? `<div class="folder-chevron ${isExpanded ? 'expanded' : ''}" data-folder-toggle="${fileName}">${ICONS.chevron}</div>` : '<div class="folder-indent"></div>'}
                <div class="file-icon-wrap">${getFileIcon(fileName)}</div>
                <span class="file-label">${displayName}</span>
                <div class="workspace-copy-btn" title="Copy Path" data-copy="${fileName}">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </div>
              </div>
            </div>`;
        }).join('');
      if (currentSession.namingNew && !currentSession.namingNew.isRename) {
        const type = currentSession.namingNew.resultType;
        const parent = currentSession.namingNew.parent;
        const indent = parent ? parent.split('/').length * 10 : 0;
        itemsHtml += `
          <div class="ide-file-item naming-item" style="padding-left: ${15 + indent}px">
            <div class="file-icon-wrap">${type === 'folder' ? ICONS.folder : ICONS.default}</div>
            <input type="text" class="naming-input" id="naming-input" placeholder="Name..." autofocus style="border-radius: 8px;" />
          </div>`;
      }
      container.innerHTML = itemsHtml;
      updateWorkspaceToggleIcon();
      if (currentSession.namingNew) {
        const input = container.querySelector('#naming-input');
        if (currentSession.namingNew.initialName) input.value = currentSession.namingNew.initialName;
        setTimeout(() => {
          if (!input || !currentSession.namingNew) return; // Safety check for fast blur/cancel
          input.focus();
          if (currentSession.namingNew.isRename) {
            const dotIndex = input.value.lastIndexOf('.');
            if (dotIndex !== -1 && !currentSession.namingNew.oldName.endsWith('/')) input.setSelectionRange(0, dotIndex);
            else input.select();
          }
        }, 10);
        input.onkeydown = (e) => {
          if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); input.onblur = null; confirmNaming(); }
          if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); input.onblur = null; cancelNaming(); }
        };
        input.onblur = () => { if (currentSession.namingNew) cancelNaming(); };
      }
    }

    let isNameProcessing = false;
    function confirmNaming() {
      if (isNameProcessing) return;
      const input = section.querySelector('#naming-input');
      if (!input) { currentSession.namingNew = null; return; }
      isNameProcessing = true;
      try {
        const name = input.value.trim();
        if (name) {
          const type = currentSession.namingNew.resultType;
          const isRename = currentSession.namingNew.isRename;
          const oldName = currentSession.namingNew.oldName;
          if (isRename && oldName) {
            let newName = oldName.endsWith('/')
              ? oldName.split('/').slice(0, -2).join('/') + (oldName.split('/').slice(0, -2).length ? '/' : '') + name + '/'
              : oldName.split('/').slice(0, -1).join('/') + (oldName.split('/').slice(0, -1).length ? '/' : '') + name;
            if (newName !== oldName) {
              newName = getUniqueName(newName, oldName);
              currentFiles[newName] = currentFiles[oldName];
              delete currentFiles[oldName];
              if (currentSession.fileName === oldName) currentSession.fileName = newName;
              if (currentSession.selectedFiles.includes(oldName)) {
                currentSession.selectedFiles = currentSession.selectedFiles.map(f => f === oldName ? newName : f);
              }
              if (currentSession.lastSelectedFile === oldName) currentSession.lastSelectedFile = newName;
              const tabIdx = openTabs.indexOf(oldName);
              if (tabIdx !== -1) openTabs[tabIdx] = newName;
            }
          } else {
            let fullName = type === 'folder' ? name + '/' : name;
            fullName = getUniqueName(fullName);
            currentFiles[fullName] = { content: '', language: (name.includes('.') ? name.split('.').pop() : 'txt') };
            if (type === 'file') {
              switchFile(fullName);
              setTimeout(() => { if (textarea) textarea.focus(); }, 50);
            }
          }
        }
      } catch (e) {
        console.error("Naming error:", e);
      } finally {
        currentSession.namingNew = null;
        isNameProcessing = false;
        renderFileList(fileListContainer);
        renderTabs(tabsContainer);
      }
    }

    function getUniqueName(name, originalName = null) {
      if (!currentFiles[name]) return name;
      if (name === originalName) return name;
      const isFolder = name.endsWith('/');
      const cleanName = isFolder ? name.slice(0, -1) : name;
      const lastDot = cleanName.lastIndexOf('.');
      const ext = lastDot !== -1 && !isFolder ? cleanName.slice(lastDot) : '';
      const basePart = lastDot !== -1 && !isFolder ? cleanName.slice(0, lastDot) : cleanName;
      let counter = 1;
      let newName;
      do { newName = `${basePart} (${counter++})${ext}${isFolder ? '/' : ''}`; } while (currentFiles[newName]);
      return newName;
    }

    function cancelNaming() {
      currentSession.namingNew = null;
      isNameProcessing = false;
      renderFileList(fileListContainer);
    }

    function renderTabs(container) {
      if (!container) return;
      container.innerHTML = openTabs.map(tabId => {
        const isCatalog = tabId.startsWith('catalog://');
        const displayName = isCatalog ? tabId.split('/').pop() : tabId;

        let icon;
        if (isCatalog) {
          const parts = tabId.slice(10).split('/');
          const type = parts.length === 1 ? 'database' : parts.length === 2 ? 'schema' : 'table';
          const color = type === 'database' ? '#79c0ff' : type === 'schema' ? '#b392f0' : '#7ee787';
          icon = `<span style="color: ${color}; display: flex; align-items: center; justify-content: center;">${CATALOG_ICONS[type]}</span>`;
        } else {
          icon = getFileIcon(tabId);
        }

        const isActive = isCatalog ?
          (currentSession.activeCatalogItem && currentSession.activeCatalogItem.id === tabId) :
          (currentSession.fileName === tabId && !currentSession.activeCatalogItem);

        return `
        <div class="ide-tab ${isActive ? 'active' : ''}" data-tab-id="${tabId}">
          <div class="tab-main">${icon}<span>${displayName}</span></div>
          <div class="tab-close" data-close="${tabId}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"></path></svg></div>
        </div>`;
      }).join('');

      const updateTabIndicators = () => {
        const wrapper = section.querySelector('#ide-tabs-container');
        if (!wrapper || !container) return;
        const canScrollLeft = container.scrollLeft > 5;
        const canScrollRight = container.scrollLeft < (container.scrollWidth - container.clientWidth - 5);
        wrapper.classList.toggle('can-scroll-left', canScrollLeft);
        wrapper.classList.toggle('can-scroll-right', canScrollRight);
      };

      container.onscroll = updateTabIndicators;

      const btnLeft = section.querySelector('#tabs-scroll-left');
      const btnRight = section.querySelector('#tabs-scroll-right');
      if (btnLeft) btnLeft.onclick = () => container.scrollTo({ left: 0, behavior: 'smooth' });
      if (btnRight) btnRight.onclick = () => container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });

      updateTabIndicators();
      setTimeout(() => {
        scrollActiveTabIntoView();
        updateTabIndicators();
      }, 50);
    }

    function scrollActiveTabIntoView() {
      if (isInitialLoad) return;
      const activeTab = tabsContainer.querySelector('.ide-tab.active');
      if (activeTab && tabsContainer) {
        // Safe manual scroll that NEVER affects the whole window
        const targetScroll = activeTab.offsetLeft - (tabsContainer.offsetWidth / 2) + (activeTab.offsetWidth / 2);
        tabsContainer.scrollTo({ left: targetScroll, behavior: 'smooth' });
      }
    }

    let renderCatalogExplorer = () => {
      const explorerView = section.querySelector('#catalog-explorer-view');
      const item = currentSession.activeCatalogItem;
      const activeTab = currentSession.activeCatalogTab || 'overview';
      if (!explorerView || !item) return;

      const pathParts = item.parentPath.split('/').filter(p => p);
      const icon = CATALOG_ICONS[item.type];

      const fullName = item.id.replace('catalog://', '').split('/').join('.');
      const detailsMap = {
        database: {
          'Object ID': 'db_warehouse_881',
          'Full Name': fullName,
          'Schemas': item.children ? item.children.length : '0',
          'Managed by': 'MotherDuck',
          'Updated at': 'Apr 12, 2026, 09:44 AM'
        },
        schema: {
          'Object ID': 'sch_' + item.name + '_001',
          'Full Name': fullName,
          'Tables': item.children ? item.children.length : '0',
          'Managed by': 'MotherDuck',
          'Updated at': 'Apr 12, 2026, 10:20 AM'
        },
        table: {
          'Object ID': 'tbl_' + Math.random().toString(36).substr(2, 6),
          'Full Name': fullName,
          'Columns': item.columns ? item.columns.length : 'N/A',
          'Rows': item.rows || 'N/A',
          'Managed by': 'MotherDuck',
          'Updated at': 'Apr 12, 2026, 11:30 AM'
        }
      };

      const details = detailsMap[item.type] || {};

      explorerView.innerHTML = `
        <div style="padding: 0; height: 100%; display: flex; flex-direction: column; box-sizing: border-box;">
            <div style="padding: 10px 20px 0 20px;">
              <div style="font-size: 11px; opacity: 0.5; font-family: var(--ide-font-mono); text-transform: uppercase; letter-spacing: 0.5px;">Catalog Explorer &rsaquo; ${item.id.replace('catalog://', '').split('/').join(' &rsaquo; ')}</div>
              <div style="display: flex; align-items: center; gap: 8px; margin: 4px 0 10px 0;">
                <div style="display: flex; align-items: center; color: ${item.type === 'database' ? '#79c0ff' : item.type === 'schema' ? '#b392f0' : '#7ee787'}">${CATALOG_ICONS[item.type]}</div>
                <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: var(--ide-text-bright);">${item.name}</h1>
              </div>
            </div>

            <div style="display: flex; gap: 24px; border-bottom: 1px solid var(--ide-border); border-top: 1px solid var(--ide-border); background: var(--ide-tab-inactive); margin-bottom: 0; padding: 0 20px;">
              <div class="explorer-tab ${activeTab === 'overview' ? 'active' : ''}" data-tab="overview" style="padding: 6px 0; font-size: 13px; color: ${activeTab === 'overview' ? 'var(--ide-text-bright)' : 'var(--ide-text)'}; cursor: pointer; position: relative; font-weight: ${activeTab === 'overview' ? '600' : '400'};">
                Overview
                ${activeTab === 'overview' ? '<div style="position: absolute; bottom: -1px; left: 0; width: 100%; height: 2px; background: var(--ide-accent); box-shadow: 0 0 8px var(--ide-accent);"></div>' : ''}
              </div>
              <div class="explorer-tab ${activeTab === 'details' ? 'active' : ''}" data-tab="details" style="padding: 6px 0; font-size: 13px; color: ${activeTab === 'details' ? 'var(--ide-text-bright)' : 'var(--ide-text)'}; cursor: pointer; position: relative; font-weight: ${activeTab === 'details' ? '600' : '400'};">
                Details
                ${activeTab === 'details' ? '<div style="position: absolute; bottom: -1px; left: 0; width: 100%; height: 2px; background: var(--ide-accent); box-shadow: 0 0 8px var(--ide-accent);"></div>' : ''}
              </div>
            </div>

            <div id="explorer-content-root" style="flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column;">
            ${activeTab === 'overview' ? `
              ${item.type === 'table' ? `
                <div class="preview-section" style="flex: 1; min-height: 0; display: flex; flex-direction: column; background: var(--ide-bg); padding: 0;">
                  <div class="preview-header" style="padding: 14px 20px;">
                    <div class="sql-badge" style="display:flex; align-items:center; gap:12px; padding: 6px 16px; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; background: rgba(255, 255, 255, 0.03); width: 100%; box-sizing: border-box; margin-bottom: 0;">
                       <div style="color: #b392f0; display: flex; align-items: center; opacity: 0.8;">
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                       </div>
                       <span style="font-family: var(--ide-font-mono); font-size: 13px; color: var(--ide-text); display: flex; align-items: center; gap: 4px;">
                         <span style="opacity: 0.7;">SELECT * FROM</span>
                         <span style="color: #7ee787; font-weight: 700;">warehouse.${pathParts[1] || 'gold'}.${item.name}</span>
                         <span style="opacity: 0.7;">LIMIT 100</span>
                       </span>
                    </div>
                  </div>
                  <div class="preview-table-container" id="preview-table-container" style="overflow-x: scroll; overflow-y: auto; max-height: 600px;">
                        ${(() => {
              const tableWidth = 45 + ((item.columns || []).length * 150);
              return `<table class="preview-table" style="width: ${tableWidth}px; min-width: 100%; border-collapse: collapse; table-layout: fixed;">`;
            })()}
                      <thead>
                          <th style="width: 45px; min-width: 45px; max-width: 45px; text-align: center; color: var(--ide-text); opacity: 0.6; padding: 6px 2px; border: 1px solid var(--ide-border); position: sticky; top: 0; z-index: 100; background-color: var(--ide-header);">
                            <div class="col-resizer" data-resizer></div>
                            #
                          </th>
                          ${item.columns ? item.columns.map(c => {
              const isSorted = currentSession.activeCatalogSort.column === c.name;
              const sortOrder = isSorted ? currentSession.activeCatalogSort.order : null;
              const sortIcon = sortOrder === 'ASC' ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 15l-6-6-6 6"/></svg>' :
                sortOrder === 'DESC' ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 9l6 6 6-6"/></svg>' :
                  '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.3"><path d="M7 15l5 5 5-5M7 9l5-5 5 5"/></svg>';

              return `
                            <th style="width: 150px; min-width: 40px; position: sticky; top: 0; z-index: 90; text-align: center; border: 1px solid var(--ide-border); background-color: var(--ide-header); padding: 6px 10px; cursor: pointer;" data-sort-col="${c.name}">
                              <div class="col-resizer" data-resizer></div>
                              <div style="display:flex; align-items:center; justify-content:center; gap:4px; margin-bottom: 0px;">
                                <span style="${isSorted ? 'color: var(--ide-text-bright); font-weight: bold;' : ''}">${c.name}</span>
                                <div class="sort-icon">${sortIcon}</div>
                              </div>
                              <div style="display:flex; justify-content:center; align-items:center;">
                                <div style="transform: scale(0.85); transform-origin: center; display: inline-block;">
                                  ${CATALOG_TYPE_ICONS[c.type === 'number' ? 'number' : (c.type === 'decimal' ? 'decimal' : (c.type === 'boolean' || c.type === 'bool' ? 'boolean' : 'text'))] || CATALOG_TYPE_ICONS.text}
                                </div>
                              </div>
                            </th>`;
            }).join('') : ''}
                        </tr>
                      </thead>
                      <tbody>
                        ${(() => {
              const rows = tablePreviewCache[item.name] || [];
              if (rows.length === 0) {
                // Trigger async load from real DuckDB
                setTimeout(async () => {
                  try {
                    const duck = await initDuckDB();
                    const sort = currentSession.activeCatalogSort;
                    const orderClause = sort.column && sort.order ? `ORDER BY ${sort.column} ${sort.order}` : "";
                    const res = await duck.conn.query(`SELECT * FROM ${item.name} ${orderClause} LIMIT 100`);
                    tablePreviewCache[item.name] = res.toArray().map(r => {
                      const obj = {};
                      for (let k of Object.keys(r)) {
                        let val = r[k];
                        if (typeof val === 'bigint') val = Number(val);
                        obj[k] = val;
                      }
                      return obj;
                    });
                    renderCatalogExplorer(); // Re-render with real data
                  } catch (e) {
                    console.error("Catalog Real Preview failed:", e);
                  }
                }, 10);
                return `<tr><td colspan="${(item.columns || []).length + 1}" style="padding: 40px; text-align: center; opacity:0.5;">
                  <div style="display:flex; align-items:center; justify-content:center; gap:10px;">
                    <svg class="spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"></circle></svg>
                    Fetching live samples...
                  </div></td></tr>`;
              }
              return rows.map((row, r) => `
                            <tr>
                              <td style="width: 45px; min-width: 45px; max-width: 45px; text-align: center; opacity: 0.6; color: var(--ide-text); font-size: 10px; padding: 8px 2px; background-color: var(--ide-bg); border-right: 1px solid var(--ide-border);">${r + 1}</td>
                              ${item.columns ? item.columns.map(c => {
                let val = row[c.name];
                if (val === null || val === undefined) val = '<span style="opacity:0.2">NULL</span>';
                return `<td style="text-align: center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${val}</td>`;
              }).join('') : ''}
                            </tr>
                          `).join('');
            })()}
                      </tbody>
                    </table>
                  </div>
                  <div class="top-scrollbar bottom-scrollbar" id="bottom-scrollbar">
                    <div id="bottom-scrollbar-content" class="top-scrollbar-content"></div>
                  </div>
                </div>
              ` : `
                <div class="catalog-viewport" id="flow-viewport">
                  <div class="catalog-flow-content" id="flow-content">
                    <div class="catalog-flow-container">
                       <svg class="flow-svg-layer" id="flow-svg"></svg>
                       ${item.type === 'schema' ? `
                       <div class="flow-level">
                          <div class="flow-node" data-level="parent" data-node-id="catalog://${item.parentPath}">
                             <div class="node-icon" style="color: #79c0ff">${CATALOG_ICONS.database}</div>
                             <div class="node-info">
                                <div class="node-name">${item.parentPath}</div>
                                <div class="node-type">database</div>
                             </div>
                          </div>
                       </div>
                       ` : ''}
                       <div class="flow-level">
                          <div class="flow-node" data-level="0" data-node-id="${item.id}">
                             <div class="node-icon" style="color: ${item.type === 'database' ? '#79c0ff' : '#b392f0'}">${CATALOG_ICONS[item.type]}</div>
                             <div class="node-info">
                                <div class="node-name">${item.name}</div>
                                <div class="node-type">${item.type}</div>
                             </div>
                          </div>
                       </div>
                       <div class="flow-level">
                          ${(item.children || []).map(child => `
                            <div class="flow-node" data-level="1" data-node-id="${item.id}/${child.name}">
                               <div class="node-icon" style="color: ${child.type === 'schema' ? '#b392f0' : '#7ee787'}">${CATALOG_ICONS[child.type]}</div>
                               <div class="node-info">
                                  <div class="node-name">${child.name}</div>
                                  <div class="node-type">${child.type}</div>
                               </div>
                            </div>
                          `).join('')}
                       </div>
                    </div>
                  </div>
                </div>
              `}
            ` : `
              <div style="flex: 1; display: flex; justify-items: center; align-items: flex-start; padding: 32px; background: transparent;">
                <div class="detail-grid" style="margin: 0 auto; width: 100%; max-width: 900px;">
                  ${Object.entries(details).map(([k, v]) => `
                    <div class="detail-label">${k}</div>
                    <div class="detail-value">${v}</div>
                  `).join('')}
                </div>
              </div>
            `}
          </div>
        </div>
      `;

      // Sync horizontal scrolls
      const bottomSyncScroll = explorerView.querySelector('#bottom-scrollbar');
      const tableContainer = explorerView.querySelector('#preview-table-container');
      const table = explorerView.querySelector('.preview-table');
      const bottomContent = explorerView.querySelector('#bottom-scrollbar-content');

      if (table && tableContainer) {
        setTimeout(() => {
          const contentWidth = table.offsetWidth + 'px';
          if (bottomSyncScroll && bottomContent) {
            bottomSyncScroll.style.width = `100%`;
            bottomContent.style.width = contentWidth;
          }
        }, 100);

        const syncHorizontal = (e) => {
          const left = e.target.scrollLeft;
          if (bottomSyncScroll && e.target === tableContainer) bottomSyncScroll.scrollLeft = left;
          if (tableContainer && e.target === bottomSyncScroll) tableContainer.scrollLeft = left;
        };

        if (bottomSyncScroll) bottomSyncScroll.onscroll = syncHorizontal;
        if (tableContainer) tableContainer.onscroll = syncHorizontal;
      }

      explorerView.querySelectorAll('.explorer-tab').forEach(t => {
        t.onclick = () => { currentSession.activeCatalogTab = t.dataset.tab; renderCatalogExplorer(); };
      });

      // --- Interaction Canvas Logic (Zoom & Pan) ---
      const viewport = explorerView.querySelector('#flow-viewport');
      const content = explorerView.querySelector('#flow-content');

      if (viewport && content) {
        let scale = 1;
        let x = 0;
        let y = 0;
        let isDragging = false;
        let startX, startY;

        // Start centered
        setTimeout(() => {
          if (!viewport || !content) return;
          const vR = viewport.getBoundingClientRect();
          const cR = content.getBoundingClientRect();
          x = (vR.width / 2) - (cR.width / 2);
          y = 30; // Slight top margin
          updateTransform();
        }, 0);

        function updateTransform() {
          if (content) content.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
        }

        viewport.onwheel = (e) => {
          e.preventDefault();
          const deltaMag = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
          if (deltaMag === 0) return;
          const delta = deltaMag > 0 ? 0.9 : 1.1;
          const newScale = Math.max(0.2, Math.min(3, scale * delta));

          const rect = viewport.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;

          x = mouseX - (mouseX - x) * (newScale / scale);
          y = mouseY - (mouseY - y) * (newScale / scale);

          scale = newScale;
          updateTransform();
        };

        viewport.onmousedown = (e) => {
          if (e.target.closest('.flow-node')) return;
          isDragging = true;
          viewport.style.cursor = 'grabbing';
          startX = e.clientX - x;
          startY = e.clientY - y;
        };

        window.addEventListener('mousemove', (e) => {
          if (!isDragging) return;
          x = e.clientX - startX;
          y = e.clientY - startY;
          updateTransform();
        });

        window.addEventListener('mouseup', () => {
          isDragging = false;
          if (viewport) viewport.style.cursor = 'grab';
        });
      }

      const flowContainer = explorerView.querySelector('.catalog-flow-container');

      // --- NEW: ROBUST EVENT DELEGATION for Table Interactions ---
      explorerView.onmousedown = async (e) => {
        // 1. Column Insights & Sorting
        const th = e.target.closest('[data-sort-col]');
        if (th) {
          e.stopPropagation(); // Stop early to bypass global listeners
          if (e.target.hasAttribute('data-resizer') || e.target.closest('[data-resizer]')) return;

          const colName = th.dataset.sortCol;
          const current = currentSession.activeCatalogSort;

          const originalBg = th.style.backgroundColor;
          th.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
          setTimeout(() => { if(th) th.style.backgroundColor = originalBg; }, 1500);

          const rect = th.getBoundingClientRect();
          const overlay = document.createElement('div');
          overlay.className = 'column-stats-overlay';
          overlay.style.left = `${rect.left}px`;
          overlay.style.top = `${rect.bottom + 8}px`;
          overlay.innerHTML = `
            <div class="stats-header">
              <span class="label">FETCHING INSIGHTS...</span>
              <div class="spinner-small"></div>
            </div>
          `;
          document.body.appendChild(overlay);
          setTimeout(() => overlay.classList.add('active'), 10);

          const closer = (evt) => {
            if (overlay && !overlay.contains(evt.target)) {
              overlay.classList.remove('active');
              setTimeout(() => overlay.remove(), 200);
              window.removeEventListener('mousedown', closer);
            }
          };
          window.addEventListener('mousedown', closer);

          try {
            const duck = await initDuckDB();
            const stats = await duck.conn.query(`
              SELECT 
                count(distinct "${colName}") as distinct_count,
                count(*) as total_count,
                count(*) FILTER (WHERE "${colName}" is null) as null_count
              FROM ${item.name}
            `);
            const rowArr = stats.toArray()[0];
            const distinctCount = Number(rowArr.distinct_count);
            const nullCount = Number(rowArr.null_count);

            const samples = await duck.conn.query(`
              SELECT "${colName}" as val, count(*) as freq 
              FROM ${item.name} 
              GROUP BY 1 
              ORDER BY 2 DESC 
              LIMIT 10
            `);
            const sampleRows = samples.toArray();

            overlay.innerHTML = `
              <div class="stats-header">
                <span class="label">COLUMN: ${colName}</span>
                <span class="count">${distinctCount.toLocaleString()} distinct</span>
              </div>
              <div class="unique-values-list">
                ${sampleRows.map(r => {
                  let val = r.val;
                  if (val === null) val = '<span style="opacity:0.3">NULL</span>';
                  return `<div class="value-item"><span>${val}</span> <span style="float:right; opacity:0.4">${Number(r.freq).toLocaleString()}</span></div>`;
                }).join('')}
              </div>
              <div class="stats-footer" style="padding-top: 8px; border-top: 1px solid var(--ide-border); display: flex; justify-content: space-between;">
                <span>NULLS: ${nullCount.toLocaleString()}</span>
                <div style="display: flex; gap: 12px;">
                  <span style="color: var(--ide-accent); cursor: pointer; font-weight: bold;" data-sort-action="ASC">ASC</span>
                  <span style="color: var(--ide-accent); cursor: pointer; font-weight: bold;" data-sort-action="DESC">DESC</span>
                </div>
              </div>
            `;
            
            overlay.querySelectorAll('[data-sort-action]').forEach(btn => {
              btn.onclick = (evt) => {
                evt.stopPropagation();
                current.column = colName;
                current.order = btn.dataset.sortAction;
                tablePreviewCache[item.name] = null;
                renderCatalogExplorer();
                overlay.remove();
              };
            });
          } catch (err) {
            overlay.innerHTML = `<div style="color:var(--ide-error)">Error: ${err.message}</div>`;
          }
          return;
        }

        // 2. Flowchart Node Clicks
        const node = e.target.closest('.flow-node');
        if (node) {
          const id = node.dataset.nodeId;
          if (id && item && id !== item.id) switchView(id);
          return;
        }
      };

      // Table Resizers (Call immediately)
      if (typeof initTableResizers === 'function') initTableResizers(explorerView);

      // Flowchart SVG Drawing
      const flowSvg = explorerView.querySelector('#flow-svg');
      const drawLines = () => {
        if (!flowContainer || !flowSvg) return;
        const firstLevelNodes = flowContainer.querySelectorAll('.flow-node[data-level="0"]');
        const parent = firstLevelNodes[0];
        const children = flowContainer.querySelectorAll('.flow-node[data-level="1"]');
        if (!parent) return;

        const cRect = flowContainer.getBoundingClientRect();
        const pRect = parent.getBoundingClientRect();
        const px = (pRect.left + pRect.width / 2) - cRect.left;
        const py = (pRect.bottom) - cRect.top;

        flowSvg.innerHTML = '';

        const parentNode = flowContainer.querySelector('.flow-node[data-level="parent"]');
        if (parentNode && firstLevelNodes[0]) {
          const r1 = parentNode.getBoundingClientRect();
          const r2 = firstLevelNodes[0].getBoundingClientRect();
          const x1 = (r1.left + r1.width / 2) - cRect.left;
          const y1 = (r1.bottom) - cRect.top;
          const x2 = (r2.left + r2.width / 2) - cRect.left;
          const y2 = (r2.top) - cRect.top;

          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', `M ${x1} ${y1} L ${x1} ${(y1 + y2) / 2} L ${x2} ${(y1 + y2) / 2} L ${x2} ${y2}`);
          path.setAttribute('stroke', 'rgba(255,255,255,0.15)');
          path.setAttribute('stroke-width', '2');
          path.setAttribute('fill', 'none');
          flowSvg.appendChild(path);
        }

        children.forEach(child => {
          const r = child.getBoundingClientRect();
          const cx = (r.left + r.width / 2) - cRect.left;
          const cy = (r.top) - cRect.top;
          const midY = py + (cy - py) / 2;

          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', `M ${px} ${py} L ${px} ${midY} L ${cx} ${midY} L ${cx} ${cy}`);
          path.setAttribute('stroke', 'rgba(255,255,255,0.15)');
          path.setAttribute('stroke-width', '2');
          path.setAttribute('fill', 'none');
          flowSvg.appendChild(path);
        });
      };
      if (flowContainer) {
        requestAnimationFrame(() => drawLines());
        window.addEventListener('resize', drawLines);
      }
    }

    function switchView(tabId, isFromSidebar = false) {
      if (tabId.startsWith('catalog://')) {
        const pathParts = tabId.slice(10).split('/'); // warehouse/gold/users
        const name = pathParts[pathParts.length - 1];
        const type = pathParts.length === 1 ? 'database' : pathParts.length === 2 ? 'schema' : 'table';

        let nodeRef = null;
        const findNodeRecursive = (list, path = '') => {
          for (const item of list) {
            const currentPath = path ? `${path}/${item.name}` : item.name;
            if (currentPath === tabId.slice(10)) { nodeRef = item; return true; }
            if (item.children && findNodeRecursive(item.children, currentPath)) return true;
          }
          return false;
        };
        findNodeRecursive(catalogData);

        currentSession.activeCatalogItem = {
          name: nodeRef ? nodeRef.name : name,
          type: nodeRef ? nodeRef.type : type,
          parentPath: pathParts.slice(0, -1).join('/'),
          id: tabId,
          columns: nodeRef ? nodeRef.columns : [],
          rows: nodeRef ? nodeRef.rows : '0',
          children: nodeRef ? nodeRef.children : []
        };
        currentSession.fileName = null;

        // Selection Logic Harmony
        currentSession.selectedFiles = [tabId];
        if (isFromSidebar) {
          currentSession.lastSelectedFile = tabId;
        } else {
          if (currentSession.lastSelectedFile !== tabId) currentSession.lastSelectedFile = null;
        }

        if (!openTabs.includes(tabId)) openTabs.push(tabId);

        renderCatalogExplorer();
        syncIDEState();
      } else {
        currentSession.activeCatalogItem = null;
        switchFile(tabId, isFromSidebar);
      }
    }

    function renderCatalog() {
      if (!catalogTreeContainer) return;

      function renderNode(node, depth = 0, nodeIdPath = 'catalog://', dotPath = '') {
        const icon = CATALOG_ICONS[node.type];
        const color = node.type === 'database' ? '#79c0ff' : node.type === 'schema' ? '#b392f0' : '#7ee787';
        const nodeId = `${nodeIdPath}${node.name}`;
        const currentDotPath = dotPath ? `${dotPath}.${node.name}` : node.name;

        const isSelected = currentSession.selectedFiles.includes(nodeId);
        const isLastSelected = currentSession.lastSelectedFile === nodeId;
        const isActiveView = (currentSession.activeCatalogItem && currentSession.activeCatalogItem.id === nodeId) || (currentSession.fileName === nodeId);
        const isOpenInTab = openTabs.includes(nodeId);

        let html = `
          <div class="ide-file-item catalog-node ${node.open ? 'open' : ''} ${isSelected ? 'active-selection' : ''} ${isLastSelected ? 'last-selected' : ''} ${isActiveView ? 'active' : ''}" 
               style="padding-left: ${depth * 15 + 10}px; border-left: none !important;" 
               data-node-id="${nodeId}"
               data-node-name="${node.name}">
            <span class="folder-chevron ${node.open ? 'expanded' : ''}" data-catalog-toggle="true" style="display: flex; align-items: center; justify-content: center; width: 14px;">${(node.children || node.columns) ? ICONS.chevron : ' '}</span>
            <span class="file-icon" style="color: ${color}; display: flex; align-items: center; justify-content: center; width: 16px;">${icon}</span>
            <span class="file-name" style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${node.name}</span>

            <div class="catalog-node-meta">
              ${node.type === 'table' ? `<span class="catalog-rows-count">${node.rows}</span>` : ''}
              <div class="copy-table-btn" title="Copy ${node.type} Path" data-copy="${currentDotPath}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              </div>
            </div>
          </div>
        `;

        if (node.open && node.children) {
          html += node.children.map(child => renderNode(child, depth + 1, `${nodeId}/`, currentDotPath)).join('');
        }

        if (node.open && node.type === 'table' && node.columns) {
          html += `
            <div class="catalog-table-details" style="margin-left: ${depth * 15 + 24}px">
              <div class="column-list">
                ${node.columns.map(col => `
                  <div class="column-item-wrap">
                    <div class="column-item" data-column-name="${col.name}" data-table-name="${node.name}">
                      <div class="col-main">
                        <div class="type-pill-container">${CATALOG_TYPE_ICONS[col.type]}</div>
                        <span class="name" title="${col.name}">${col.name}</span>
                      </div>
                      <div class="catalog-node-meta">
                        <span class="catalog-rows-count">${col.nonNull}</span>
                        <div class="copy-col-btn" title="Copy Column Path" data-copy="${currentDotPath}.${col.name}">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        </div>
                      </div>
                    </div>
                    ${col.showStats ? `
                      <div class="column-stats-panel">
                        <div class="stats-header">
                          <span class="label">UNIQUE VALUES</span>
                          <span class="count">${col.distinct}</span>
                        </div>
                         <div class="unique-values-list">
                          ${[...col.samples].sort((a, b) => a.toString().localeCompare(b.toString()))
                .slice(0, col.showAll ? 100 : 8).map(s => {
                  return `<div class="value-item" title="${s}"><span>${s}</span></div>`;
                }).join('')}
                         </div>
                          ${!col.showAll && col.samples.length > 8 ? `
                            <div class="value-item show-more-btn" 
                                 data-column-name="${col.name}" 
                                 data-table-name="${node.name}">
                              ...
                            </div>
                          ` : ''}
                        <div class="stats-footer">
                          <span>NULLS: ${(parseInt(node.rows.toString().replace(/,/g, '')) - parseInt(col.nonNull.toString().replace(/,/g, ''))) || 0}</span>
                        </div>
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }

        return html;
      }

      catalogTreeContainer.innerHTML = catalogData.map(db => renderNode(db)).join('');
      updateToggleIcon();
    }

    function updateWorkspaceToggleIcon() {
      const btn = section.querySelector('#btn-toggle-workspace');
      if (!btn) return;
      const icon = btn.querySelector('#toggle-icon-workspace');
      const allFolders = Object.keys(currentFiles).filter(key => key.endsWith('/'));
      const isAnyOpen = allFolders.some(f => !collapsedFolders.has(f));

      if (isAnyOpen) {
        icon.innerHTML = '<line x1="5" y1="12" x2="19" y2="12"></line>'; // Minus
      } else {
        icon.innerHTML = '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>'; // Plus
      }
    }

    function updateToggleIcon() {
      const btn = section.querySelector('#btn-toggle-catalog');
      if (!btn) return;
      const icon = btn.querySelector('#toggle-icon-catalog');

      const isAnyOpen = (list) => {
        for (const item of list) {
          if (item.open) return true;
          if (item.children && isAnyOpen(item.children)) return true;
        }
        return false;
      };

      if (isAnyOpen(catalogData)) {
        icon.innerHTML = '<line x1="5" y1="12" x2="19" y2="12"></line>'; // Minus
      } else {
        icon.innerHTML = '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>'; // Plus
      }
    }

    function switchSidebar(view) {
      currentSession.sidebar = view;
      activityBar.querySelectorAll('.ide-icon').forEach(icon => icon.classList.remove('active'));

      if (view === 'explorer') {
        activityBar.querySelector('#v-explorer').classList.add('active');
        explorerSidebar.style.display = 'flex';
        catalogSidebar.style.display = 'none';
        renderFileList(fileListContainer);
      } else {
        activityBar.querySelector('#v-catalog').classList.add('active');
        explorerSidebar.style.display = 'none';
        catalogSidebar.style.display = 'flex';
        renderCatalog();
      }
      syncTerminalVisibility();
    }

    // Set side bar click events
    activityBar.querySelector('#v-explorer').onclick = () => switchSidebar('explorer');
    activityBar.querySelector('#v-catalog').onclick = () => switchSidebar('catalog');
    section.querySelector('#btn-refresh').onclick = () => {
      const btn = section.querySelector('#btn-refresh');
      btn.style.animation = 'spin 1s linear';

      // Restore initial state
      currentFiles = { ...files };
      if (currentFiles['README.md'] && translations[lang]?.playground?.readmeContent) {
        currentFiles['README.md'].content = translations[lang].playground.readmeContent;
      }

      // Keep open tabs if they still exist, otherwise reset to README
      openTabs = openTabs.filter(t => currentFiles[t]);
      if (openTabs.length === 0) openTabs = ['README.md'];

      if (!currentFiles[currentSession.fileName]) {
        switchFile('README.md');
      }

      const log = document.createElement('div');
      log.className = 'info';
      log.style.color = '#79c0ff';
      log.innerHTML = `<span style="color: #7ee787">[workspace]</span> Restoring file system...<br><span style="color: #7ee787">[workspace]</span> Re-indexed ${Object.keys(currentFiles).length} files. UI updated.`;
      terminal.appendChild(log);
      terminal.scrollTop = terminal.scrollHeight;

      setTimeout(() => {
        btn.style.animation = '';
        renderFileList(fileListContainer);
        renderTabs(tabsContainer);
      }, 1000);
    };

    section.querySelector('#btn-refresh-catalog').onclick = () => {
      const btn = section.querySelector('#btn-refresh-catalog');
      btn.style.animation = 'spin 1s linear';

      // Simulate fetching truth from MotherDuck
      const output = section.querySelector('#terminal-output');
      const log = document.createElement('div');
      log.className = 'info';
      log.style.color = '#79c0ff';
      log.innerHTML = `
        <span style="color: #7ee787">[catalog]</span> Connecting to MotherDuck (token: md_***...)...<br>
        <span style="color: #7ee787">[catalog]</span> Authenticated as pedro@warehouse.ai<br>
        <span style="color: #7ee787">[catalog]</span> Discovering schemas in 'warehouse'...<br>
        <span style="color: #7ee787">[catalog]</span> Fetching column metadata for 'gold.users' and 'gold.providers'...<br>
        <span style="color: #7ee787">[catalog]</span> Done. Catalog hierarchy updated with real-time stats.
      `;
      output.appendChild(log);
      output.scrollTop = output.scrollHeight;

      setTimeout(() => {
        btn.style.animation = '';
        renderCatalog();
      }, 1000);
    };

    // Drag and Drop (Moved and Consolidated below)

    catalogTreeContainer.onclick = (e) => {
      const arrow = e.target.closest('.folder-chevron');
      const nodeEl = e.target.closest('.ide-file-item');
      const column = e.target.closest('.column-item');
      const copyBtn = e.target.closest('.copy-table-btn, .copy-col-btn');
      const isShowMore = e.target.closest('.show-more-btn');

      if (copyBtn) {
        e.stopPropagation();
        const text = copyBtn.dataset.copy;
        navigator.clipboard.writeText(text).then(() => {
          const original = copyBtn.innerHTML;
          copyBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7ee787" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
          setTimeout(() => copyBtn.innerHTML = original, 1500);
        });
        return;
      }

      if (arrow) {
        e.stopPropagation();
        const nodeName = nodeEl.dataset.nodeName;

        const findAndToggle = (list) => {
          for (const item of list) {
            if (item.name === nodeName) {
              item.open = !item.open;
              return true;
            }
            if (item.children && findAndToggle(item.children)) return true;
          }
          return false;
        };
        findAndToggle(catalogData);
        renderCatalog();
        return;
      }
      if (nodeEl) {
        if (e.button !== 0) return; // Only L-Mouse
        e.stopPropagation();
        const fileId = nodeEl.dataset.nodeId;

        // Find node object
        const findNodeById = (list, targetId, path = 'catalog://') => {
          for (const n of list) {
            const nodeId = `${path}${n.name}`;
            if (nodeId === targetId) return n;
            if (n.children) {
              const res = findNodeById(n.children, targetId, `${nodeId}/`);
              if (res) return res;
            }
          }
          return null;
        };

        const targetNode = findNodeById(catalogData, fileId);
        if (!targetNode) return;

        const wasSelected = currentSession.selectedFiles.includes(fileId);

        if (e.ctrlKey || e.metaKey) {
          if (wasSelected) currentSession.selectedFiles = currentSession.selectedFiles.filter(f => f !== fileId);
          else currentSession.selectedFiles.push(fileId);
          currentSession.lastSelectedFile = fileId;
        } else if (e.shiftKey && currentSession.lastSelectedFile) {
          const allItems = Array.from(catalogTreeContainer.querySelectorAll('.ide-file-item')).map(el => el.dataset.nodeId);
          const startIdx = allItems.indexOf(currentSession.lastSelectedFile);
          const endIdx = allItems.indexOf(fileId);
          if (startIdx !== -1 && endIdx !== -1) {
            currentSession.selectedFiles = allItems.slice(Math.min(startIdx, endIdx), Math.max(startIdx, endIdx) + 1);
          }
        } else {
          // SIMPLE CLICK: Aggressive Reset
          currentSession.selectedFiles = [fileId];
          currentSession.lastSelectedFile = fileId;
          switchView(fileId, true);

          if (wasSelected && (targetNode.children || targetNode.type === 'table')) {
            targetNode.open = !targetNode.open;
          }
        }
        syncIDEState();
        return;
      }

      if (column || isShowMore) {
        const target = column || isShowMore;
        const colName = target.dataset.columnName;
        const tableName = target.dataset.tableName;

        const toggleColumn = (list) => {
          for (const item of list) {
            if (item.name === tableName && item.type === 'table') {
              const col = item.columns.find(c => c.name === colName);
              if (col) {
                if (isShowMore) {
                  col.showAll = true;
                } else {
                  col.showStats = !col.showStats;
                  if (!col.showStats) col.showAll = false;
                }
                return true;
              }
            }
            if (item.children && toggleColumn(item.children)) return true;
          }
          return false;
        };
        toggleColumn(catalogData);
        renderCatalog();
      }
    };

    function syncEditor() {
      const fileName = currentSession.fileName;
      const file = currentFiles[fileName];
      if (!file) return;

      const ext = fileName.split('.').pop();
      const langMap = { py: 'python', sql: 'sql', js: 'javascript', html: 'markup', css: 'css', md: 'markdown', json: 'json' };
      const lang = langMap[ext] || file.language || 'text';

      const code = textarea.value;
      file.content = code;
      preCode.className = `language-${lang}`;

      if (window.Prism) {
        let highlighted = window.Prism.highlight(code, window.Prism.languages[lang] || window.Prism.languages.text, lang);

        // Inject Search Highlights
        if (currentSearchQuery) {
          const parts = highlighted.split(/(<[^>]+>)/g);
          let globalMatchCounter = 0;
          highlighted = parts.map(part => {
            if (part.startsWith('<')) return part;
            const regex = new RegExp(`(${currentSearchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
            return part.replace(regex, (match) => {
              const className = (globalMatchCounter === currentMatchIdx) ? 'search-highlight current' : 'search-highlight';
              globalMatchCounter++;
              return `<span class="${className}">${match}</span>`;
            });
          }).join('');
        }

        preCode.innerHTML = highlighted;
      } else {
        preCode.textContent = code;
      }

      const lines = code.split('\n');
      lineNumbers.innerHTML = lines.map((_, i) => `<div class="line-number-item">${i + 1}</div>`).join('');
    }

    function batchDeleteFiles(paths) {
      if (!paths || paths.length === 0) return;

      const toDelete = paths; // ALL files can be deleted now
      if (toDelete.length === 0) return;

      const title = toDelete.length > 1 ? `Delete ${toDelete.length} Items` : `Delete Item`;
      const msg = toDelete.length > 1
        ? `Are you sure you want to delete these <b>${toDelete.length} items</b>? This action cannot be undone.`
        : `Are you sure you want to delete <b>${toDelete[0]}</b>${toDelete[0].endsWith('/') ? ' and all its contents' : ''}?`;

      showIDEModal(title, msg, () => {
        const allPathsToDelete = [];
        toDelete.forEach(p => {
          const victims = Object.keys(currentFiles).filter(f => f.startsWith(p));
          allPathsToDelete.push(...victims);
        });

        const uniqueVictims = [...new Set(allPathsToDelete)];

        uniqueVictims.forEach(p => {
          delete currentFiles[p];
          openTabs = openTabs.filter(t => t !== p);
          if (currentSession.fileName === p) {
            currentSession.fileName = null;
          }
          currentSession.selectedFiles = currentSession.selectedFiles.filter(f => f !== p);
        });

        if (!currentSession.fileName && openTabs.length > 0) {
          switchFile(openTabs[0]);
        } else if (!currentSession.fileName) {
          textarea.value = '';
          preCode.textContent = '';
          lineNumbers.innerHTML = '';
        }

        if (currentSession.lastSelectedFile && !currentFiles[currentSession.lastSelectedFile]) {
          currentSession.lastSelectedFile = null;
        }

        renderFileList(fileListContainer);
        renderTabs(tabsContainer);
      });
    }

    function showIDEModal(title, msg, onConfirm) {
      const modal = document.createElement('div');
      modal.className = 'ide-modal-overlay';
      modal.innerHTML = `
        <div class="ide-modal">
          <div class="ide-modal-header">${title}</div>
          <div class="ide-modal-body">${msg}</div>
          <div class="ide-modal-footer">
            <button class="modal-btn cancel">Cancel</button>
            <button class="modal-btn confirm">Confirm</button>
          </div>
        </div>
      `;
      section.querySelector('#ide-window').appendChild(modal);

      const close = () => { if (modal && modal.parentNode) modal.remove(); window.removeEventListener('keydown', handleKey); };
      const confirm = () => { onConfirm(); close(); };
      const handleKey = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); confirm(); }
        if (e.key === 'Escape') { e.preventDefault(); close(); }
      };

      modal.querySelector('.cancel').onclick = close;
      modal.querySelector('.confirm').onclick = confirm;
      window.addEventListener('keydown', handleKey);
    }

    function renameFile(name) {
      if (!name) return;
      const displayName = name.endsWith('/') ? name.split('/').slice(-2, -1)[0] : name.split('/').pop();
      currentSession.namingNew = { isRename: true, oldName: name, initialName: displayName, resultType: name.endsWith('/') ? 'folder' : 'file' };
      renderFileList(fileListContainer);
    }

    let clipboardFiles = [];

    // Keyboard Shortcuts (Global)
    const handleGlobalShortcuts = (e) => {
      if (section.style.display === 'none') return;
      const isInputSource = e.target.tagName === 'INPUT';
      const isEditorSource = e.target.tagName === 'TEXTAREA';

      // ESC: Close/Exit IDE and return to Projects
      // ESC: Deselect all files
      if (e.key === 'Escape') {
        deselectAll();
        return;
      }

      // Allow Undo/Redo in textarea
      if (isInputSource && (e.key === 'z' || e.key === 'y') && e.ctrlKey) return;

      // Ctrl + Enter: Run
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        runBtn.click();
      }

      // Ctrl + S: Save (Simulate and prevent browser dialog)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        const log = document.createElement('div');
        log.style.color = '#7ee787';
        log.style.fontSize = '12px';
        log.style.marginTop = '4px';
        log.innerHTML = `<span style="opacity:0.6">[workspace]</span> Local session state persisted.`;
        terminal.appendChild(log);
        terminal.scrollTop = terminal.scrollHeight;
      }

      // Ctrl + ` : Toggle Terminal visibility
      if (e.ctrlKey && e.code === 'Backquote' && !e.shiftKey) {
        e.preventDefault();
        currentSession.terminalOpen = !currentSession.terminalOpen;
        syncTerminalVisibility();
      }

      // Ctrl + Shift + ` : New Terminal
      if (e.ctrlKey && e.shiftKey && e.code === 'Backquote') {
        e.preventDefault();
        terminalAdd.click(); // Create new terminal
      }

      // Ctrl + B: Toggle Sidebar
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        const sidebar = section.querySelector('.ide-sidebar');
        if (sidebar) {
          sidebar.style.display = sidebar.style.display === 'none' ? 'flex' : 'none';
        }
      }

      // Ctrl + PageUp: Previous Tab
      if (e.ctrlKey && e.key === 'PageUp') {
        e.preventDefault();
        const idx = openTabs.indexOf(currentSession.fileName);
        if (idx > 0) switchFile(openTabs[idx - 1]);
      }

      // Ctrl + PageDown: Next Tab
      if (e.ctrlKey && e.key === 'PageDown') {
        e.preventDefault();
        const idx = openTabs.indexOf(currentSession.fileName);
        if (idx < openTabs.length - 1) switchFile(openTabs[idx + 1]);
      }

      // Ctrl + W: Close Tab
      if (e.ctrlKey && e.key === 'w') {
        e.preventDefault();
        if (currentSession.fileName) closeTab(currentSession.fileName);
      }

      // F2: Rename (only when not typing in editor/inputs)
      if (e.key === 'F2' && !isInputSource && !isEditorSource) {
        e.preventDefault();
        if (currentSession.lastSelectedFile) {
          renameFile(currentSession.lastSelectedFile);
        }
      }

      // Delete
      if (e.key === 'Delete' && !isInputSource && !isEditorSource) {
        e.preventDefault();
        if (currentSession.lastSelectedFile && currentSession.selectedFiles.length > 0) {
          batchDeleteFiles([...currentSession.selectedFiles]);
        }
      }

      // Ctrl + C: Copy File (only if not in editor/inputs)
      if (e.ctrlKey && e.key === 'c' && !isInputSource && !isEditorSource) {
        if (currentSession.lastSelectedFile && currentSession.selectedFiles.length > 0) {
          clipboardFiles = [...currentSession.selectedFiles];
        }
      }

      // Clipboard Pasting
      if (e.ctrlKey && e.key === 'v' && !isInputSource && !isEditorSource && clipboardFiles.length > 0) {
        e.preventDefault();
        clipboardFiles.forEach(cf => {
          if (!cf) return;
          const baseName = cf.split('/').pop();
          const ext = baseName.includes('.') ? baseName.slice(baseName.lastIndexOf('.')) : '';
          const namePart = baseName.includes('.') ? baseName.slice(0, baseName.lastIndexOf('.')) : baseName;
          let newName = namePart + '_copy' + ext;
          let counter = 1;
          while (currentFiles[newName]) { newName = namePart + '_copy' + (counter++) + ext; }
          currentFiles[newName] = { ...currentFiles[cf], name: newName };
        });
        renderFileList(fileListContainer);
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);

    // Handlers for New File/Folder
    explorerSidebar.querySelector('#btn-new-file').onclick = () => {
      currentSession.namingNew = { resultType: 'file', parent: '' };
      renderFileList(explorerSidebar.querySelector('#file-tree') || fileListContainer);
    };
    explorerSidebar.querySelector('#btn-new-folder').onclick = () => {
      currentSession.namingNew = { resultType: 'folder', parent: '' };
      renderFileList(explorerSidebar.querySelector('#file-tree') || fileListContainer);
    };
    catalogSidebar.querySelector('#btn-toggle-catalog').onclick = () => {
      const isAnyOpen = (list) => {
        for (const item of list) {
          if (item.open) return true;
          if (item.children && isAnyOpen(item.children)) return true;
        }
        return false;
      };

      const shouldOpen = !isAnyOpen(catalogData);
      const setStates = (list) => {
        list.forEach(item => {
          item.open = shouldOpen;
          if (item.children) setStates(item.children);
          if (!shouldOpen && item.columns) item.columns.forEach(c => { c.showStats = false; c.showAll = false; });
        });
      };
      setStates(catalogData);
      if (!shouldOpen) {
        currentSession.activeCatalogItem = null;
        section.querySelector('#catalog-explorer-view').style.display = 'none';
      }
      renderCatalog();
    };

    let draggedFiles = [];
    fileListContainer.addEventListener('dragstart', (e) => {
      const item = e.target.closest('.ide-file-item');
      if (item) {
        const file = item.dataset.file;
        // Dragging should automatically reinforce the selection (make it active/last-selected)
        if (!currentSession.selectedFiles.includes(file)) {
          currentSession.selectedFiles = [file];
        }
        currentSession.lastSelectedFile = file;

        // Manually update classes to avoid full re-render which might cancel the drag session in some browsers
        fileListContainer.querySelectorAll('.ide-file-item').forEach(el => {
          const f = el.dataset.file;
          el.classList.toggle('active-selection', currentSession.selectedFiles.includes(f));
          el.classList.toggle('last-selected', f === currentSession.lastSelectedFile);
        });

        draggedFiles = [...currentSession.selectedFiles];
        e.dataTransfer.setData('text/plain', JSON.stringify(draggedFiles));

        // Dim all dragged items
        fileListContainer.querySelectorAll('.ide-file-item').forEach(el => {
          if (currentSession.selectedFiles.includes(el.dataset.file)) {
            el.style.opacity = '0.5';
          }
        });
      }
    });

    fileListContainer.addEventListener('dragend', (e) => {
      fileListContainer.querySelectorAll('.ide-file-item').forEach(el => el.style.opacity = '1');
      draggedFiles = [];
      fileListContainer.querySelectorAll('.ide-file-item').forEach(el => el.classList.remove('drag-over'));
    });

    explorerSidebar.addEventListener('dragover', (e) => {
      e.preventDefault();
      const item = e.target.closest('.ide-file-item');
      if (item && item.dataset.file.endsWith('/')) {
        item.classList.add('drag-over');
        explorerSidebar.classList.remove('drag-over-container');
      } else {
        explorerSidebar.classList.add('drag-over-container');
        explorerSidebar.querySelectorAll('.ide-file-item').forEach(el => el.classList.remove('drag-over'));
      }
    });

    explorerSidebar.addEventListener('dragleave', (e) => {
      const item = e.target.closest('.ide-file-item');
      if (item) item.classList.remove('drag-over');
      if (e.target === explorerSidebar || e.target.id === 'sidebar-explorer' || e.target.id === 'ide-file-list') {
        explorerSidebar.classList.remove('drag-over-container');
      }
    });

    explorerSidebar.addEventListener('drop', (e) => {
      e.preventDefault();
      explorerSidebar.classList.remove('drag-over-container');
      const targetItem = e.target.closest('.ide-file-item');
      if (targetItem) targetItem.classList.remove('drag-over');

      if (draggedFiles.length > 0) {
        const targetDir = (targetItem && targetItem.dataset.file.endsWith('/')) ? targetItem.dataset.file : '';
        let movedCount = 0;

        // Move each selected file/folder
        // Sort by path length to ensure we don't move a child before its parent
        const sorted = [...draggedFiles].sort((a, b) => a.length - b.length);

        sorted.forEach(oldPath => {
          // If the item doesn't exist anymore, it might have been moved as part of a parent folder
          if (!currentFiles[oldPath]) return;

          const fileNameOnly = oldPath.endsWith('/')
            ? oldPath.split('/').slice(-2, -1)[0] + '/'
            : oldPath.split('/').pop();

          let newName = targetDir + fileNameOnly;
          if (newName === oldPath) return;

          // If there's a conflict, generate unique name
          if (currentFiles[newName]) {
            newName = getUniqueName(newName);
          }

          // Recursive move logic for folders (flat map style)
          const allChildren = Object.keys(currentFiles).filter(p => p.startsWith(oldPath));

          allChildren.forEach(childOldPath => {
            const childNewPath = childOldPath.replace(oldPath, newName);
            currentFiles[childNewPath] = currentFiles[childOldPath];
            delete currentFiles[childOldPath];

            // Sync UI states
            if (currentSession.fileName === childOldPath) currentSession.fileName = childNewPath;
            if (currentSession.lastSelectedFile === childOldPath) currentSession.lastSelectedFile = childNewPath;

            const tabIdx = openTabs.indexOf(childOldPath);
            if (tabIdx !== -1) openTabs[tabIdx] = childNewPath;

            movedCount++;
          });
        });

        if (movedCount > 0) {
          currentSession.selectedFiles = []; // Clear selection to avoid dangling references
          renderFileList(fileListContainer);
          renderTabs(tabsContainer);

          // Log to terminal
          const log = document.createElement('div');
          log.className = 'info';
          log.style.color = '#79c0ff';
          log.innerHTML = `<span style="color: #7ee787">[workspace]</span> Moved ${movedCount} items.`;
          terminal.appendChild(log);
          terminal.scrollTop = terminal.scrollHeight;
        }
      }
    });

    function switchFile(name, isFromSidebar = false) {
      if (name.startsWith('catalog://')) {
        switchView(name);
        return;
      }
      if (name.endsWith('/')) return;
      currentSession.activeCatalogItem = null;

      currentSession.fileName = name;

      if (!openTabs.includes(name)) openTabs.push(name);

      // Tabs vs Sidebar behavior
      if (isFromSidebar) {
        currentSession.selectedFiles = [name];
        currentSession.lastSelectedFile = name;
      } else {
        currentSession.selectedFiles = [name];
      }

      syncIDEState();
    }

    // Event Bindings
    // (Workspace refresh handled above)

    section.querySelector('#btn-new-file').onclick = (e) => {
      e.stopPropagation();
      currentSession.namingNew = { isRename: false, resultType: 'file', parent: '' };
      renderFileList(fileListContainer);
      setTimeout(() => {
        const input = section.querySelector('#naming-input');
        if (input) input.focus();
      }, 50);
    };

    section.querySelector('#btn-new-folder').onclick = (e) => {
      e.stopPropagation();
      currentSession.namingNew = { isRename: false, resultType: 'folder', parent: '' };
      renderFileList(fileListContainer);
      setTimeout(() => {
        const input = section.querySelector('#naming-input');
        if (input) input.focus();
      }, 50);
    };

    function deselectAll() {
      if (currentSession.selectedFiles.length > 0) {
        currentSession.selectedFiles = [];
        currentSession.lastSelectedFile = null;
        syncIDEState();
      }
    }

    // консолидировано в глобальный слушатель в конце файла

    section.querySelector('#btn-toggle-workspace').onclick = () => {
      const allFolders = Object.keys(currentFiles).filter(key => key.endsWith('/'));
      const isAnyOpen = allFolders.some(f => !collapsedFolders.has(f));

      if (isAnyOpen) {
        allFolders.forEach(f => collapsedFolders.add(f));
      } else {
        collapsedFolders.clear();
      }
      renderFileList(fileListContainer);
      updateWorkspaceToggleIcon();
    };



    // Window Logic & Shortcuts
    window.addEventListener('keydown', (e) => {
      // F11 Strategy: Override browser fullscreen to focus on IDE if it's open
      if (e.code === 'F11') {
        if (ideWindow.style.display !== 'none') {
          e.preventDefault();
          if (!document.fullscreenElement) {
            lastFullscreenWasIDE = true;
            ideWindow.requestFullscreen().catch(err => {
              console.warn("IDE F11 Fullscreen failed:", err);
              lastFullscreenWasIDE = false;
            });
          } else {
            isManualExit = true;
            document.exitFullscreen().then(() => {
              setTimeout(() => { isManualExit = false; }, 300);
            });
          }
        }
      }
    });

    // Window Closing
    section.querySelector('#win-close').onclick = () => {
      ideWindow.style.opacity = '0';
      ideWindow.style.transform = 'scale(0.95)';
      setTimeout(() => {
        ideWindow.style.display = 'none';
        const recovery = document.createElement('button');
        recovery.className = 'run-btn';
        recovery.textContent = 'Restore IDE';
        recovery.style.margin = '20px auto';
        recovery.style.display = 'block';
        recovery.onclick = () => {
          ideWindow.style.display = 'flex';
          setTimeout(() => {
            ideWindow.style.opacity = '1';
            ideWindow.style.transform = 'scale(1)';
            recovery.remove();
          }, 50);
        };
        section.appendChild(recovery);
      }, 300);
    };

    fileListContainer.onclick = (e) => {
      const copyBtn = e.target.closest('.workspace-copy-btn');
      if (copyBtn) {
        e.stopPropagation();
        const text = copyBtn.dataset.copy;
        navigator.clipboard.writeText(text).then(() => {
          const original = copyBtn.innerHTML;
          copyBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7ee787" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
          setTimeout(() => copyBtn.innerHTML = original, 1500);
        });
        return;
      }

      const chevron = e.target.closest('.folder-chevron');
      if (chevron) {
        e.stopPropagation();
        const folder = chevron.dataset.folderToggle;
        if (collapsedFolders.has(folder)) collapsedFolders.delete(folder);
        else collapsedFolders.add(folder);
        renderFileList(fileListContainer);
        return;
      }

      const item = e.target.closest('.ide-file-item');
      if (item && !item.classList.contains('naming-item')) {
        e.stopPropagation(); // Prevent background click from deselecting
        const file = item.dataset.file;
        const wasSelected = currentSession.selectedFiles.includes(file);

        if (e.ctrlKey || e.metaKey) {
          if (wasSelected) currentSession.selectedFiles = currentSession.selectedFiles.filter(f => f !== file);
          else currentSession.selectedFiles.push(file);
          currentSession.lastSelectedFile = file;
        } else if (e.shiftKey && currentSession.lastSelectedFile) {
          const allVisibleFiles = Array.from(fileListContainer.querySelectorAll('.ide-file-item')).map(el => el.dataset.file);
          const startIdx = allVisibleFiles.indexOf(currentSession.lastSelectedFile);
          const endIdx = allVisibleFiles.indexOf(file);
          if (startIdx !== -1 && endIdx !== -1) {
            currentSession.selectedFiles = allVisibleFiles.slice(Math.min(startIdx, endIdx), Math.max(startIdx, endIdx) + 1);
          }
        } else {
          // SIMPLE CLICK: Force Reset
          currentSession.selectedFiles = [file];
          currentSession.lastSelectedFile = file;

          if (!file.endsWith('/')) {
            switchFile(file, true);
          } else {
            if (wasSelected) {
              if (collapsedFolders.has(file)) collapsedFolders.delete(file);
              else collapsedFolders.add(file);
            }
          }
        }
        syncIDEState();
      } else {
        // Handled by global click listener
      }
    };

    textarea.oninput = syncEditor;

    const executeCurrentFile = async () => {
      try {
        if (!currentSession) return;
        currentSession.terminalOpen = true;
        syncTerminalVisibility();

        const fileName = currentSession.fileName || '';
        const content = textarea.value.trim();

        if (!content) {
          logToTerminal(`Empty file. Nothing to run.`, 'error', true);
          return;
        }

        // Translation safety
        const t = (translations[lang]?.playground?.terminal) || {
          running: 'Running...',
          executedSuccess: 'Executed successfully.',
          title: 'Terminal'
        };

        // Check if file is runnable
        const extension = fileName.split('.').pop().toLowerCase();
        const runnableExtensions = ['py', 'sql'];
        if (!runnableExtensions.includes(extension)) {
          logToTerminal(`File type .${extension.toUpperCase()} is not runnable.`, 'error', true);
          return;
        }

        // Handle SQL execution
        if (fileName.endsWith('.sql')) {
          const startTime = performance.now();
          logToTerminal(`<div class="info" style="display:flex; align-items:center; height:20px;"><svg class="spinner" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"></circle></svg> Running Query...</div>`, 'info', false);

          setTimeout(async () => {
            try {
              const cleanContent = content.replace(/([a-zA-Z_][a-zA-Z0-9_]*\.)+([a-zA-Z_][a-zA-Z0-9_]*)/gi, (match) => {
                const parts = match.split('.');
                const tableName = parts[parts.length - 1].toLowerCase();
                const knownTables = ['users', 'providers', 'orders', 'products', 'metrics'];
                if (knownTables.includes(tableName)) return tableName;
                return match;
              });

              const duck = await initDuckDB();
              const result = await duck.conn.query(cleanContent);

              const rows = result.toArray().map(row => {
                const obj = {};
                for (const key of Object.keys(row)) {
                  let val = row[key];
                  if (typeof val === 'bigint') val = Number(val);
                  obj[key] = val;
                }
                return obj;
              });

              if (rows.length === 0) {
                logToTerminal(`Query executed successfully. No rows returned.`, 'info', true);
                return;
              }
              const columns = Object.keys(rows[0]);
              const elapsed = (performance.now() - startTime) / 1000;

              let html = `<div class="sql-result-wrapper">`;
              html += `<div class="sql-summary-bar"><span>${rows.length} rows and ${columns.length} columns returned in ${elapsed.toFixed(1)}s</span></div>`;
              html += `<div class="sql-grid-layout"><div class="sql-scroll-pane"><table class="preview-table"><thead><tr><th class="index-th" style="width: 45px; min-width: 45px; text-align: center; user-select: none; padding: 0; position: sticky; left: 0; top: 0; z-index: 100; background-color: var(--ide-header); border-right: 2px solid var(--ide-border); box-shadow: 2px 0 5px rgba(0,0,0,0.3);"><div class="col-resizer" data-resizer="true"></div><span class="th-name" style="opacity: 0.8;">#</span></th>${columns.map(c => {
                const rawVal = rows[0][c];
                const typeKey = typeof rawVal === 'number' ? 'number' : typeof rawVal === 'boolean' ? 'boolean' : 'text';
                const typeIcon = CATALOG_TYPE_ICONS[typeKey];
                const typeLabel = typeKey === 'number' ? 'INT64' : typeKey === 'boolean' ? 'BOOL' : 'TEXT';
                return `<th style="width: 150px; min-width: 150px;"><div class="col-resizer" data-resizer="true"></div><div class="th-content"><div class="th-main"><span class="th-name">${c}</span><div class="type-pill-container" style="margin-top: 4px; opacity: 1;">${typeIcon}</div></div></div></th>`;
              }).join('')}</tr></thead><tbody>${rows.slice(0, 100).map((row, r) => `<tr><td style="width: 45px; min-width: 45px; text-align: center; background-color: var(--ide-bg); opacity: 1; font-size: 10px; user-select: none; padding: 0; position: sticky; left: 0; z-index: 90; border-right: 2px solid var(--ide-border); box-shadow: 2px 0 5px rgba(0,0,0,0.3);">${r + 1}</td>${columns.map(c => {
                let val = row[c];
                let displayVal = val;
                if (val === null || val === undefined) displayVal = '<span style="opacity:0.3">NULL</span>';
                else if (typeof val === 'number') {
                  displayVal = !Number.isInteger(val) ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : val.toLocaleString('en-US');
                }
                return `<td style="text-align: ${typeof val === 'number' ? 'right' : 'left'}">${displayVal}</td>`;
              }).join('')}</tr>`).join('')}</tbody></table></div></div>`;

              if (rows.length > 100) html += `<div style="font-size:10px; opacity:0.5; padding: 10px; text-align:center;">Showing first 100 rows only.</div>`;
              html += `</div>`;
              logToTerminal(html, null, true);
            } catch (err) {
              logToTerminal(`SQL Error: ${err.message}`, 'error', true);
            }
          }, 800);
          return;
        }

        // Handle Python execution
        if (!pyodide) {
          if (runBtn) {
            runBtn.disabled = true;
            runBtn.innerHTML = '<svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"></circle></svg>';
          }
          pyodide = await window.loadPyodide();
          if (runBtn) {
            runBtn.disabled = false;
            runBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
          }
        }

        logToTerminal(t.running || 'Running...', 'info');
        try {
          pyodide.runPython(`import sys\nimport io\nsys.stdout = io.StringIO()`);
          await pyodide.runPythonAsync(content);
          const stdout = pyodide.runPython("sys.stdout.getvalue()");
          logToTerminal(stdout ? stdout.replace(/\n/g, '<br>') : (t.executedSuccess || 'Executed successfully.'), stdout ? 'info' : 'success');
        } catch (err) {
          logToTerminal(`${err.message}`, 'error');
        }
      } catch (err) {
        console.error("Execution Error:", err);
        logToTerminal(`Internal Error: ${err.message}`, 'error', true);
      }
    };

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value = textarea.value.substring(0, start) + "    " + textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 4;
        syncEditor();
      }
      if (e.key === 'Backspace' && textarea.selectionStart === textarea.selectionEnd) {
        const start = textarea.selectionStart;
        const textView = textarea.value.substring(0, start);
        const lastFour = textView.slice(-4);
        if (lastFour === '    ') {
          // Calculate column to ensure we are at a tab stop
          const lineStart = textView.lastIndexOf('\n') + 1;
          const col = start - lineStart;
          if (col % 4 === 0) {
            e.preventDefault();
            textarea.value = textView.substring(0, start - 4) + textarea.value.substring(start);
            textarea.selectionStart = textarea.selectionEnd = start - 4;
            syncEditor();
          }
        }
      }
      if (e.ctrlKey && (e.key === 'Enter' || e.keyCode === 13)) {
        e.preventDefault();
        executeCurrentFile();
      }
    });

    if (runBtn) runBtn.onclick = executeCurrentFile;

    function syncIDEState() {
      const hasTabs = openTabs.length > 0;
      const launchView = section.querySelector('#playground-launch-view');
      const catalogView = section.querySelector('#catalog-explorer-view');
      const editorView = section.querySelector('#editor-view');
      const editorHeader = section.querySelector('.ide-editor-header');
      const isCatalog = !!currentSession.activeCatalogItem;
      const textarea = section.querySelector('#ide-textarea');
      const fileListContainer = section.querySelector('#ide-file-list');
      const tabsContainer = section.querySelector('#ide-tabs');

      if (!hasTabs) {
        if (editorView) editorView.style.display = 'none';
        if (catalogView) catalogView.style.display = 'none';
        if (editorHeader) editorHeader.style.display = 'none';
        if (launchView) {
          // As per specific request: hide everything in the IDE area
          launchView.style.display = 'none';
        }
        currentSession.fileName = null;
        currentSession.activeCatalogItem = null;
        currentSession.selectedFiles = [];
        currentSession.lastSelectedFile = null;
      } else {
        if (launchView) launchView.style.display = 'none';
        if (editorHeader) editorHeader.style.display = 'flex';
        if (isCatalog) {
          if (editorView) editorView.style.display = 'none';
          if (catalogView) {
            catalogView.style.display = 'block';
            catalogView.style.backgroundColor = 'var(--ide-bg)';
          }
        } else {
          if (editorView) editorView.style.display = 'flex';
          if (catalogView) catalogView.style.display = 'none';

          const file = currentFiles[currentSession.fileName];
          if (file && textarea) {
            if (textarea.value !== file.content) {
              textarea.value = file.content;
              syncEditor();
            }

            // Sync Lang Badge
            const langBadge = section.querySelector('#status-lang-badge span');
            if (langBadge) {
              const ext = currentSession.fileName.split('.').pop().toUpperCase();
              const langMap = { 'PY': 'Python', 'SQL': 'SQL', 'MD': 'Markdown', 'JSON': 'JSON' };
              langBadge.innerText = langMap[ext] || 'Text';
            }
          }
        }
      }

      renderFileList(fileListContainer);
      renderCatalog();
      renderTabs(tabsContainer);
    }

    function closeTab(name) {
      const wasActive = currentSession.fileName === name ||
        (currentSession.activeCatalogItem && currentSession.activeCatalogItem.id === name);
      openTabs = openTabs.filter(t => t !== name);

      if (wasActive) {
        if (openTabs.length > 0) {
          const nextTab = openTabs[openTabs.length - 1];
          if (nextTab.startsWith('catalog://')) switchView(nextTab, false);
          else switchFile(nextTab, false);
        } else {
          currentSession.fileName = null;
          currentSession.activeCatalogItem = null;
          currentSession.selectedFiles = [];
          currentSession.lastSelectedFile = null;
        }
      }

      syncIDEState();
    }

    tabsContainer.onclick = (e) => {
      const closeBtn = e.target.closest('.tab-close');
      const tab = e.target.closest('.ide-tab');

      if (closeBtn) {
        e.stopPropagation();
        closeTab(closeBtn.dataset.close);
        return;
      }

      if (tab) {
        if (tab.dataset.tabId.startsWith('catalog://')) switchView(tab.dataset.tabId, false);
        else switchFile(tab.dataset.tabId, false);
      }
    };

    const launchPlaceholder = document.createElement('div');
    launchPlaceholder.id = 'playground-launch-view';
    launchPlaceholder.style.display = 'none';
    launchPlaceholder.style.textAlign = 'center';
    launchPlaceholder.style.padding = '80px 20px';
    launchPlaceholder.innerHTML = `
      <button class="btn-outline" id="btn-launch-ide">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
        <span>${translations[lang].playground.launchButton}</span>
      </button>
    `;
    section.appendChild(launchPlaceholder);

    const restoreFab = document.createElement('div');
    restoreFab.id = 'ide-restore-fab';
    restoreFab.style.position = 'fixed';
    restoreFab.style.bottom = '30px';
    restoreFab.style.right = '30px';
    restoreFab.style.width = '52px';
    restoreFab.style.height = '52px';
    restoreFab.style.borderRadius = '50%';
    restoreFab.style.padding = '2px';
    restoreFab.style.background = 'var(--rainbow-gradient)';
    restoreFab.style.backgroundSize = '200% 200%';
    restoreFab.style.display = 'none';
    restoreFab.style.zIndex = '2000';
    restoreFab.style.cursor = 'pointer';
    restoreFab.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    restoreFab.style.boxShadow = '0 0 20px rgba(153, 255, 255, 0.3)';
    restoreFab.style.animation = 'rainbowSlide 5s linear infinite';

    const fabInner = document.createElement('div');
    fabInner.className = 'fab-inner';
    fabInner.style.width = '100%';
    fabInner.style.height = '100%';
    fabInner.style.borderRadius = '50%';
    fabInner.style.background = 'var(--bg-color)';
    fabInner.style.display = 'flex';
    fabInner.style.alignItems = 'center';
    fabInner.style.justifyContent = 'center';
    fabInner.innerHTML = `<div class="icon-wrap" style="display:flex;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" stroke-width="2.5"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg></div>`;

    restoreFab.appendChild(fabInner);
    document.body.appendChild(restoreFab);

    const scrollToIDE = (delay = 100) => {
      setTimeout(() => {
        const yOffset = -20;
        const y = section.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }, delay);
    };

    const h2Title = section.querySelector('h2');

    let returnPositionY = null;
    let isMinimizing = false;
    let isManualExit = false;
    let lastFullscreenWasIDE = false;

    // State preservation for when opened via Projects
    let savedPlaygroundState = {
      wasPlaceholderVisible: true,
      wasFabVisible: false
    };

    const scrollToProjectsTop = () => {
      const projectsSec = document.getElementById('projects');
      if (projectsSec) {
        const targetY = projectsSec.offsetTop - 20;
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      }
    };

    section.id = 'playground';

    const scrollToPlaygroundTop = () => {
      const el = document.getElementById('playground');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    };

    const handleReturnNavigation = () => {
      if (returnPositionY !== null) {
        scrollToProjectsTop();
        returnPositionY = null;
      } else {
        scrollToPlaygroundTop();
      }
    };

    section.querySelector('#win-close').onclick = () => {
      const isFromProject = returnPositionY !== null;

      const finalizeClose = () => {
        if (isFromProject) {
          scrollToProjectsTop();
          returnPositionY = null;
          // Reset section to pristine state
          ideWindow.style.display = 'none';
          launchPlaceholder.style.display = 'block';
          restoreFab.style.display = 'none';
        } else {
          scrollToPlaygroundTop();
          ideWindow.style.display = 'none';
          launchPlaceholder.style.display = 'block';
          restoreFab.style.display = 'none';
        }
      };

      if (document.fullscreenElement) {
        document.exitFullscreen().then(() => setTimeout(finalizeClose, 200)).catch(finalizeClose);
      } else {
        finalizeClose();
      }
    };

    section.querySelector('#win-min').onclick = () => {
      const wasFromProjectAtClick = returnPositionY !== null;
      isMinimizing = true;
      isManualExit = true;

      const finalizeMin = () => {
        if (ideWindow.style.display === 'none') {
          isMinimizing = false;
          isManualExit = false;
          return;
        }

        ideWindow.style.transition = 'all 0.4s ease';
        ideWindow.style.transform = 'scale(0.8) translateY(100px)';
        ideWindow.style.opacity = '0';
        setTimeout(() => {
          ideWindow.style.display = 'none';
          restoreFab.style.display = 'flex';
          launchPlaceholder.style.display = 'none'; // Ensure Launch button is HIDDEN when minimized

          restoreFab.classList.add('fab-pulse');
          setTimeout(() => restoreFab.classList.remove('fab-pulse'), 4500);

          if (wasFromProjectAtClick) {
            scrollToProjectsTop();
            returnPositionY = null;
          } else {
            scrollToPlaygroundTop();
          }
          isMinimizing = false;
          isManualExit = false;
        }, 400);
      };

      if (document.fullscreenElement) {
        document.exitFullscreen().then(() => setTimeout(finalizeMin, 150)).catch(() => finalizeMin());
      } else {
        finalizeMin();
      }
    };

    section.querySelector('#btn-launch-ide').onclick = () => {
      returnPositionY = null; // Direct playground launch
      launchPlaceholder.style.display = 'none';
      if (h2Title) h2Title.style.display = 'block';
      ideWindow.style.display = 'flex';
      scrollToPlaygroundTop(); // Ensure we are aligned
    };

    restoreFab.onclick = () => {
      restoreFab.style.display = 'none';
      ideWindow.style.display = 'flex';
      setTimeout(() => {
        ideWindow.style.transform = 'scale(1) translateY(0)';
        ideWindow.style.opacity = '1';
        scrollToPlaygroundTop(); // Ensure we are aligned
      }, 10);
    };

    section.querySelector('#win-max').onclick = () => {
      if (!document.fullscreenElement) {
        lastFullscreenWasIDE = true;
        ideWindow.requestFullscreen().catch(err => {
          console.error(err);
          lastFullscreenWasIDE = false;
        });
      } else {
        if (returnPositionY !== null) {
          // Erro 3 Fix: Green button from project = Soft Exit
          // Just go back to projects, don't hide IDE, don't mess with site below
          isManualExit = true;
          document.exitFullscreen().then(() => {
            setTimeout(() => {
              scrollToProjectsTop();
              returnPositionY = null;
              isManualExit = false;
            }, 300);
          }).catch(() => {
            scrollToProjectsTop();
            returnPositionY = null;
            isManualExit = false;
          });
        } else {
          isManualExit = true;
          document.exitFullscreen()
            .then(() => {
              setTimeout(scrollToPlaygroundTop, 300);
              setTimeout(scrollToPlaygroundTop, 600);
              setTimeout(() => { isManualExit = false; }, 700);
            })
            .catch(() => {
              scrollToPlaygroundTop();
              isManualExit = false;
            });
        }
      }
    };


    refreshTerminalBtn.onclick = () => {
      const active = terminalInstances.find(t => t.id === activeTerminalId);
      if (active) {
        active.content = '';
        updateTerminalUI();
      }
    };


    window.openIDE = (mode = 'explorer', shouldFullscreen = false, returnY = null) => {
      if (returnY !== null) {
        // Save the current state of the playground section
        savedPlaygroundState.wasPlaceholderVisible = launchPlaceholder.style.display !== 'none';
        savedPlaygroundState.wasFabVisible = restoreFab.style.display === 'flex';
      }

      const placeholder = section.querySelector('#btn-launch-ide')?.parentElement;
      if (placeholder) placeholder.style.display = 'none';
      restoreFab.style.display = 'none'; // Hide FAB while IDE is open

      if (h2Title) h2Title.style.display = 'block';
      ideWindow.style.display = 'flex';
      ideWindow.style.transform = 'scale(1) translateY(0)';
      ideWindow.style.opacity = '1';
      switchSidebar(mode === 'catalog' ? 'catalog' : 'explorer');
      scrollToIDE(200);

      returnPositionY = returnY;

      if (shouldFullscreen && !document.fullscreenElement) {
        setTimeout(() => {
          lastFullscreenWasIDE = true;
          ideWindow.requestFullscreen().catch(err => {
            console.warn("IDE Fullscreen failed:", err);
            lastFullscreenWasIDE = false;
          });
        }, 300);
      }
    };

    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement) {
        // If we were NOT in an IDE fullscreen session, ignore this event
        if (!lastFullscreenWasIDE) return;

        if (!isManualExit) {
          if (isSearchEsc) {
            // It was just a search bar close, ignore exit-scroll logic
            isSearchEsc = false;
            setTimeout(scrollToPlaygroundTop, 100);
            return;
          }

          if (returnPositionY !== null) {
            scrollToProjectsTop();
            returnPositionY = null;
          } else if (ideWindow.style.display !== 'none' || restoreFab.style.display === 'flex') {
            // Stabilize scroll after FS transition
            setTimeout(scrollToPlaygroundTop, 300);
            setTimeout(scrollToPlaygroundTop, 600);
          }
        }

        // Reset the tracker after handling
        lastFullscreenWasIDE = false;
      }
    });

    // Initial Render
    // Initial Load
    syncIDEState();

    // Sync references for global listeners
    activeSessionRef = currentSession;
    activeSyncRef = syncIDEState;
    initTableResizersBound = initTableResizers;

    // Lock auto-scrolls for a longer period to ensure stability
    setTimeout(() => { isInitialLoad = false; }, 500);
  }, 0);

  // Terminal Resizer Logic
  const resizer = section.querySelector('#terminal-resizer');
  const terminalEl = section.querySelector('.ide-terminal');
  const editorMainEl = section.querySelector('.ide-editor-main');
  let isResizing = false;

  resizer.onmousedown = (e) => {
    isResizing = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (e) => {
      if (!isResizing) return;
      const containerRect = section.querySelector('.ide-editor-container').getBoundingClientRect();
      const relativeY = e.clientY - containerRect.top;
      const totalHeight = containerRect.height;
      let terminalHeight = totalHeight - relativeY - 3;

      if (terminalHeight > 60 && terminalHeight < totalHeight - 150) {
        terminalEl.style.height = `${terminalHeight}px`;
        terminalEl.style.flex = 'none';
        editorMainEl.style.flex = '1';
      }
    };

    const onMouseUp = () => {
      isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return section;
}

// Global Deselection Monitor (Persistent across re-renders)
window.addEventListener('mousedown', (e) => {
  if (!activeSessionRef || !activeSyncRef) return;

  const isInsideIDE = e.composedPath().some(el => el.id === 'playground');
  const isSelectable = e.target.closest('.ide-file-item, .naming-item, .ide-tab, .sidebar-action-btn, .toolbar-btn, [data-sort-col], .preview-table, .detail-grid, .catalog-node');
  const isInteracting = e.target.closest('[data-resizer], #terminal-resizer, .ide-terminal-resizer, .ide-modal, .window-controls, .status-bar, .ide-activity-bar, .column-stats-overlay, .catalog-explorer, .naming-input');

  // 1. Cancel Naming if clicking outside
  if (activeSessionRef.namingNew && !e.target.closest('.naming-input')) {
    // We need to call cancelNaming here. Since it's local to renderIDE, we should have a ref.
    // However, the simplest way is to trigger a custom event or check name.
    // For now, let's focus on the file selection.
  }

  // 2. Clear Selection
  const isInsideCatalog = e.target.closest('.catalog-explorer, .column-stats-overlay');
  if (!isInsideIDE || isInsideCatalog || (!isSelectable && !isInteracting)) {
    if (isInsideCatalog) return; 
    if (e.ctrlKey || e.metaKey || e.shiftKey) return;
    
    // Only clear if there's actually something to clear to avoid loops
    if (activeSessionRef.selectedFiles.length > 0) {
      activeSessionRef.selectedFiles = [];
      activeSessionRef.lastSelectedFile = null;
      activeSyncRef();
    }
  }
}, true);
