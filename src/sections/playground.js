import { files } from '../data/ideFiles.js';
import catalogMetadata from '../data/catalog_metadata.json';

export function renderIDE(lang, translations) {
  const section = document.createElement('section');
  section.id = 'playground';
  section.className = 'ide-section';

  // State Management
  let currentFiles = { ...files };
  let openTabs = ['pipeline.py'];
  let collapsedFolders = new Set();
  const currentSession = {
    fileName: 'pipeline.py',
    sidebar: 'explorer', // 'explorer' or 'catalog'
    namingNew: null, // { resultType: 'file'|'folder', parent: string, initialName?: string, isRename?: boolean }
    selectedFile: 'pipeline.py'
  };

  const CATALOG_TYPE_ICONS = {
    text: '<span class="type-pill type-text">TEXT</span>',
    number: '<span class="type-pill type-number">INT64</span>',
    decimal: '<span class="type-pill type-number">DECIMAL</span>',
    date: '<span class="type-pill type-date">DATE</span>'
  };

  // Automated Catalog Builder
  const buildCatalogHierarchy = (metadata) => {
    const tableMap = {};
    
    metadata.forEach(col => {
      if (!tableMap[col.table_name]) {
        tableMap[col.table_name] = {
          name: col.table_name,
          type: 'table',
          rows: col.non_null, // Uses the non_null of the first column found as row count
          columns: []
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

  const ICONS = {
    js: '<img src="https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/master/icons/javascript.svg" width="16" height="16">',
    py: '<img src="https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/master/icons/python.svg" width="16" height="16">',
    html: '<img src="https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/master/icons/html.svg" width="16" height="16">',
    css: '<img src="https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/master/icons/css.svg" width="16" height="16">',
    sql: '<img src="https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/master/icons/database.svg" width="16" height="16">',
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
    schema: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>', // Cube
    table: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="3" x2="9" y2="21"/></svg>'
  };



  section.innerHTML = `
    <style>
      .folder-chevron { width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; color: var(--ide-text); transition: transform 0.2s; margin-right: 4px; }
      .folder-chevron.expanded { transform: rotate(90deg); }
      .folder-indent { width: 18px; }
      .file-main { display: flex; align-items: center; width: 100%; white-space: nowrap; height: 100%; }
      .file-icon-wrap { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; margin-right: 8px; flex-shrink: 0; }
      .file-main span { overflow: hidden; text-overflow: ellipsis; }
      .ide-tab .tab-close:hover { opacity: 1; background: rgba(255,255,255,0.1); border-radius: 4px; }
      .ide-tab { width: 160px; flex-shrink: 0; justify-content: space-between; overflow: hidden; }
      .ide-tab .tab-main { display: flex; align-items: center; gap: 6px; overflow: hidden; white-space: nowrap; flex: 1; }
      .ide-tab .tab-main span { overflow: hidden; text-overflow: ellipsis; }
      
      .ide-file-item.drag-over { 
        background: rgba(126, 231, 135, 0.1) !important;
        border-left: 3px solid #7ee787 !important;
      }

      /* Custom Modal Style */
      .ide-modal-overlay { position: absolute; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.5); z-index: 1000; display:flex; align-items:center; justify-content:center; }
      .ide-modal { background: var(--ide-bg); border: 1px solid var(--ide-accent); border-radius: 8px; width: 320px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); overflow: hidden; }
      .ide-modal-header { padding: 12px 16px; background: rgba(255,255,255,0.05); font-weight: bold; font-size: 13px; color: var(--ide-text-bright); border-bottom: 1px solid rgba(255,255,255,0.05); }
      .ide-modal-body { padding: 20px 16px; font-size: 14px; color: var(--ide-text); line-height: 1.5; }
      .ide-modal-footer { padding: 12px 16px; display:flex; justify-content: flex-end; gap: 8px; background: rgba(0,0,0,0.2); }
      .modal-btn { padding: 6px 16px; border-radius: 4px; border: none; font-size: 12px; cursor: pointer; transition: all 0.2s; }
      .modal-btn.cancel { background: transparent; color: var(--ide-text); border: 1px solid rgba(255,255,255,0.1); }
      .modal-btn.cancel:hover { background: rgba(255,255,255,0.05); }
      .modal-btn.confirm { background: var(--ide-accent); color: white; }
      .modal-btn.confirm:hover { filter: brightness(1.1); }

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
                  <div class="sidebar-action-btn" title="${translations[lang].playground.tooltips.collapseAll}" id="btn-collapse">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path><line x1="12" y1="15" x2="19" y2="15"></line></svg>
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
                  <div class="sidebar-action-btn" title="${translations[lang].playground.tooltips.collapseAll}" id="btn-collapse-catalog">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path><line x1="12" y1="15" x2="19" y2="15"></line></svg>
                  </div>
                </div>
              </div>
              <div class="catalog-tree" id="catalog-tree"></div>
            </div>
          </div>

        <div class="ide-editor-container">
          <div class="ide-editor-main">
            <div class="ide-tabs" id="ide-tabs"></div>
            <div class="ide-editor-wrapper">
              <div class="line-numbers-sidebar" id="line-numbers"></div>
              <textarea id="ide-textarea" class="ide-textarea" spellcheck="false"></textarea>
              <pre id="ide-pre" class="ide-pre"><code id="ide-code"></code></pre>
            </div>
          </div>
          <div class="ide-terminal">
            <div class="terminal-header">
              <span>${translations[lang].playground.terminal.title}</span>
              <div class="terminal-actions">
                <button id="run-btn" class="run-btn" title="${translations[lang].playground.tooltips.run}" style="padding-top: 2px;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                </button>
                <button id="restart-btn" class="run-btn" title="${translations[lang].playground.tooltips.restart}">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                </button>
                <button id="clear-btn" class="run-btn" title="${translations[lang].playground.tooltips.clear}">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>
            <div class="terminal-output" id="terminal-output">
              <span class="info">${translations[lang].playground.terminal.ready}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="ide-status-bar">
        <div class="status-left"></div>
        <div class="status-right" id="status-info"><span>UTF-8</span><span>Text</span></div>
      </div>
    </div>
  `;

  // Interaction Logic
  setTimeout(async () => {
    const textarea = section.querySelector('#ide-textarea');
    const preCode = section.querySelector('#ide-code');
    const lineNumbers = section.querySelector('#line-numbers');
    const runBtn = section.querySelector('#run-btn');
    const terminal = section.querySelector('#terminal-output');
    const clearBtn = section.querySelector('#clear-btn');
    const restartBtn = section.querySelector('#restart-btn');
    const fileListContainer = section.querySelector('#ide-file-list');
    const catalogTreeContainer = section.querySelector('#catalog-tree');
    const tabsContainer = section.querySelector('#ide-tabs');
    const statusInfo = section.querySelector('#status-info');
    const ideWindow = section.querySelector('#ide-window');
    const activityBar = section.querySelector('.ide-activity-bar');

    const explorerSidebar = section.querySelector('#sidebar-explorer');
    const catalogSidebar = section.querySelector('#sidebar-catalog');

    let pyodide = null;

    function getFileIcon(name) {
      if (name.endsWith('/')) {
        return collapsedFolders.has(name) ? ICONS.folder : ICONS.folderOpen;
      }
      const ext = name.split('.').pop().toLowerCase();
      return ICONS[ext] || ICONS.default;
    }

    function renderFileList(container) {
      if (!container) return;
      let itemsHtml = Object.keys(currentFiles)
        .sort((a, b) => {
          const aIsFolder = a.endsWith('/');
          const bIsFolder = b.endsWith('/');
          if (aIsFolder !== bIsFolder) return bIsFolder ? 1 : -1;
          return a.localeCompare(b);
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
          const indent = (fileName.split('/').length - (fileName.endsWith('/') ? 2 : 1)) * 10;
          const isFolder = fileName.endsWith('/');
          const isExpanded = !collapsedFolders.has(fileName);
          const isBeingRenamed = currentSession.namingNew && currentSession.namingNew.isRename && currentSession.namingNew.oldName === fileName;
          if (isBeingRenamed) {
            return `
              <div class="ide-file-item naming-item active-selection" style="padding-left: ${15 + indent}px">
                <div class="file-icon-wrap">${isFolder ? ICONS.folder : getFileIcon(fileName)}</div>
                <input type="text" class="naming-input" id="naming-input" placeholder="Name..." autofocus />
              </div>`;
          }
          return `
            <div class="ide-file-item ${fileName === currentSession.fileName || fileName === currentSession.selectedFile ? 'active-selection' : ''} ${fileName === currentSession.fileName ? 'active' : ''}" 
                 data-file="${fileName}" draggable="true" style="padding-left: ${10 + indent}px">
              <div class="file-main">
                ${isFolder ? `<div class="folder-chevron ${isExpanded ? 'expanded' : ''}">${ICONS.chevron}</div>` : '<div class="folder-indent"></div>'}
                <div class="file-icon-wrap">${getFileIcon(fileName)}</div>
                <span>${displayName}</span>
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
            <input type="text" class="naming-input" id="naming-input" placeholder="Name..." autofocus />
          </div>`;
      }
      container.innerHTML = itemsHtml;
      if (currentSession.namingNew) {
        const input = container.querySelector('#naming-input');
        if (currentSession.namingNew.initialName) input.value = currentSession.namingNew.initialName;
        setTimeout(() => {
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
        input.onblur = () => { if (currentSession.namingNew) confirmNaming(); };
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
              if (currentSession.selectedFile === oldName) currentSession.selectedFile = newName;
              const tabIdx = openTabs.indexOf(oldName);
              if (tabIdx !== -1) openTabs[tabIdx] = newName;
            }
          } else {
            let fullName = type === 'folder' ? name + '/' : name;
            fullName = getUniqueName(fullName);
            currentFiles[fullName] = { content: '', language: (name.includes('.') ? name.split('.').pop() : 'txt') };
            if (type === 'file') switchFile(fullName);
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
      container.innerHTML = openTabs.map(fileName => `
        <div class="ide-tab ${fileName === currentSession.fileName ? 'active' : ''}" data-file="${fileName}">
          <div class="tab-main">${getFileIcon(fileName)}<span>${fileName}</span></div>
          <div class="tab-close" data-close="${fileName}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"></path></svg></div>
        </div>`).join('');
    }

    function renderCatalog() {
      if (!catalogTreeContainer) return;

      function renderNode(node, depth = 0) {
        const icon = CATALOG_ICONS[node.type];
        const color = node.type === 'database' ? '#79c0ff' : node.type === 'schema' ? '#d1d5db' : '#7ee787';

        let html = `
          <div class="catalog-node ${node.open ? 'open' : ''}" style="padding-left: ${depth * 15 + 10}px" data-node-name="${node.name}">
            <span class="catalog-arrow" style="font-size: 8px;">${node.children ? (node.open ? '▼' : '▶') : ' '}</span>
            <span class="catalog-icon" style="color: ${color}" title="${node.type.charAt(0).toUpperCase() + node.type.slice(1)}">${icon}</span>
            <span class="catalog-name">${node.name}</span>
            <div class="catalog-node-meta">
              ${node.type === 'table' ? `<span class="catalog-rows-count">${node.rows}</span>` : ''}
              ${node.type === 'table' ? `
                <div class="copy-table-btn" title="Copy Table Path" data-copy="gold.${node.name}">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </div>
              ` : ''}
            </div>
          </div>
        `;

        if (node.open && node.children) {
          html += node.children.map(child => renderNode(child, depth + 1)).join('');
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
                      <div class="col-actions">
                        <span class="stat-non-null">${col.nonNull}</span>
                        <div class="copy-col-btn" title="Copy Path" data-copy="gold.${node.name}.${col.name}">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
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
                          ${col.samples.slice(0, col.showAll ? col.samples.length : 8).map(s => `<div class="value-item"><span>${s}</span></div>`).join('')}
                          ${!col.showAll && col.samples.length > 8 ? `
                            <div class="value-item show-more-btn" data-column-name="${col.name}" data-table-name="${node.name}" title="Show all ${col.samples.length} values">
                              <span>...</span>
                            </div>
                          ` : ''}
                        </div>
                        <div class="stats-footer">
                          <span>NULLS: ${parseInt(node.rows.replace(/,/g, '')) - parseInt(col.nonNull.replace(/,/g, ''))}</span>
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
    }

    function switchSidebar(view) {
      currentSession.sidebar = view;
      activityBar.querySelectorAll('.ide-icon').forEach(icon => icon.classList.remove('active'));

      if (view === 'explorer') {
        activityBar.querySelector('#v-explorer').classList.add('active');
        explorerSidebar.style.display = 'flex';
        catalogSidebar.style.display = 'none';
      } else {
        activityBar.querySelector('#v-catalog').classList.add('active');
        explorerSidebar.style.display = 'none';
        catalogSidebar.style.display = 'flex';
        renderCatalog();
      }
    }

    // Set side bar click events
    activityBar.querySelector('#v-explorer').onclick = () => switchSidebar('explorer');
    activityBar.querySelector('#v-catalog').onclick = () => switchSidebar('catalog');
    section.querySelector('#btn-refresh').onclick = () => renderFileList(fileListContainer);

    // Drag and Drop
    let draggedFile = null;
    fileListContainer.addEventListener('dragstart', (e) => {
      const item = e.target.closest('.ide-file-item');
      if (item) {
        draggedFile = item.dataset.file;
        e.dataTransfer.setData('text/plain', draggedFile);
        item.style.opacity = '0.5';
      }
    });

    fileListContainer.addEventListener('dragend', (e) => {
      const item = e.target.closest('.ide-file-item');
      if (item) item.style.opacity = '1';
      draggedFile = null;
      fileListContainer.querySelectorAll('.ide-file-item').forEach(el => el.classList.remove('drag-over'));
    });

    fileListContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      const item = e.target.closest('.ide-file-item');
      if (item && item.dataset.file.endsWith('/')) item.classList.add('drag-over');
    });

    fileListContainer.addEventListener('dragleave', (e) => {
      const item = e.target.closest('.ide-file-item');
      if (item) item.classList.remove('drag-over');
    });

    fileListContainer.addEventListener('drop', (e) => {
      e.preventDefault();
      const target = e.target.closest('.ide-file-item');
      if (target) target.classList.remove('drag-over');
      if (target && target.dataset.file.endsWith('/') && draggedFile) {
        const newName = target.dataset.file + draggedFile.split('/').pop();
        if (!currentFiles[newName]) {
          currentFiles[newName] = currentFiles[draggedFile];
          delete currentFiles[draggedFile];
          if (currentSession.fileName === draggedFile) currentSession.fileName = newName;
          renderFileList(fileListContainer);
          renderTabs(tabsContainer);
        }
      }
    });

    catalogTreeContainer.onclick = (e) => {
      const node = e.target.closest('.catalog-node');
      const column = e.target.closest('.column-item');
      const copyBtn = e.target.closest('.copy-table-btn, .copy-col-btn');

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

      if (node) {
        const name = node.dataset.nodeName;
        const findAndToggle = (list) => {
          for (const item of list) {
            if (item.name === name) {
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

      const isShowMore = e.target.closest('.show-more-btn');

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
                  if (!col.showStats) col.showAll = false; // Reset on close
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
    }

    function syncEditor() {
      const file = currentFiles[currentSession.fileName];
      if (!file) return;

      const code = textarea.value;
      file.content = code;
      preCode.className = `language-${file.language}`;
      preCode.textContent = code;
      if (window.Prism) window.Prism.highlightElement(preCode);

      const lines = code.split('\n');
      lineNumbers.innerHTML = lines.map((_, i) => `<div class="line-number-item">${i + 1}</div>`).join('');
    }

    function deleteFile(name) {
      if (!name || name === 'pipeline.py') return;
      showIDEModal(`Delete File`, `Are you sure you want to delete <b>${name}</b>?`, () => {
        delete currentFiles[name];
        if (currentSession.fileName === name) {
          currentSession.fileName = null;
          textarea.value = '';
          preCode.textContent = '';
          lineNumbers.innerHTML = '';
        }
        openTabs = openTabs.filter(t => t !== name);
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
      section.appendChild(modal);

      modal.querySelector('.cancel').onclick = () => modal.remove();
      modal.querySelector('.confirm').onclick = () => {
        onConfirm();
        modal.remove();
      };
    }

    function renameFile(name) {
      if (!name) return;
      const displayName = name.endsWith('/') ? name.split('/').slice(-2, -1)[0] : name.split('/').pop();
      currentSession.namingNew = { isRename: true, oldName: name, initialName: displayName, resultType: name.endsWith('/') ? 'folder' : 'file' };
      renderFileList(fileListContainer);
    }

    let clipboardFile = null;

    // Keyboard Shortcuts (Global)
    const handleGlobalShortcuts = (e) => {
      if (section.style.display === 'none') return;
      const isInputSource = ['INPUT', 'TEXTAREA'].includes(e.target.tagName);

      // ESC: Close/Exit IDE and return to Projects
      if (e.key === 'Escape') {
        if (currentSession.namingNew) return; // Let renderFileList handle its Esc
        if (section.querySelector('.ide-modal-overlay')) return; // Prioritize closing modal

        // Only close IDE if it's currently visible
        if (ideWindow.style.display !== 'none') {
          e.preventDefault();
          section.querySelector('#win-close').click();
        }
        return;
      }

      // Allow Undo/Redo in textarea
      if (isInputSource && (e.key === 'z' || e.key === 'y') && e.ctrlKey) return;

      // Ctrl + Enter: Run
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        runBtn.click();
      }

      // F2: Rename
      if (e.key === 'F2') {
        e.preventDefault();
        renameFile(currentSession.selectedFile || currentSession.fileName);
      }

      // Delete
      if (e.key === 'Delete' && !isInputSource) {
        e.preventDefault();
        deleteFile(currentSession.selectedFile || currentSession.fileName);
      }

      // Ctrl + C: Copy File (only if not in editor)
      if (e.ctrlKey && e.key === 'c' && !isInputSource) {
        clipboardFile = currentSession.selectedFile || currentSession.fileName;
      }

      // Clipboard Pasting
      if (e.ctrlKey && e.key === 'v' && !isInputSource && clipboardFile) {
        e.preventDefault();
        const baseName = clipboardFile.split('/').pop();
        const ext = baseName.includes('.') ? baseName.slice(baseName.lastIndexOf('.')) : '';
        const namePart = baseName.includes('.') ? baseName.slice(0, baseName.lastIndexOf('.')) : baseName;
        let newName = namePart + '_copy' + ext;
        let counter = 1;
        while (currentFiles[newName]) { newName = namePart + '_copy' + (counter++) + ext; }
        currentFiles[newName] = { ...currentFiles[clipboardFile], name: newName };
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
    catalogSidebar.querySelector('#btn-collapse-catalog').onclick = () => {
      const collapse = (list) => {
        list.forEach(item => {
          item.open = false;
          if (item.children) collapse(item.children);
          if (item.columns) item.columns.forEach(c => { c.showStats = false; c.showAll = false; });
        });
      };
      collapse(catalogData);
      renderCatalog();
    };

    // Drag and Drop Logic with Indicators

    fileListContainer.addEventListener('dragstart', (e) => {
      const item = e.target.closest('.ide-file-item');
      if (item) {
        draggedFile = item.dataset.file;
        e.dataTransfer.setData('text/plain', draggedFile);
        item.style.opacity = '0.5';
      }
    });

    fileListContainer.addEventListener('dragend', (e) => {
      const item = e.target.closest('.ide-file-item');
      if (item) item.style.opacity = '1';
      draggedFile = null;
      fileListContainer.querySelectorAll('.ide-file-item').forEach(el => el.classList.remove('drag-over'));
    });

    fileListContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      const item = e.target.closest('.ide-file-item');
      if (item && item.dataset.file.endsWith('/')) {
        item.classList.add('drag-over');
      }
    });

    fileListContainer.addEventListener('dragleave', (e) => {
      const item = e.target.closest('.ide-file-item');
      if (item) item.classList.remove('drag-over');
    });

    fileListContainer.addEventListener('drop', (e) => {
      e.preventDefault();
      const targetItem = e.target.closest('.ide-file-item');
      if (targetItem) targetItem.classList.remove('drag-over');

      if (targetItem && targetItem.dataset.file.endsWith('/') && draggedFile) {
        const targetFolder = targetItem.dataset.file;
        const fileNameOnly = draggedFile.split('/').pop();
        const newName = targetFolder + fileNameOnly;

        if (newName !== draggedFile && !currentFiles[newName]) {
          currentFiles[newName] = currentFiles[draggedFile];
          delete currentFiles[draggedFile];
          if (currentSession.fileName === draggedFile) currentSession.fileName = newName;
          renderFileList(fileListContainer);
          renderTabs(tabsContainer);
        }
      }
    });

    function switchFile(name) {
      if (name.endsWith('/')) return;
      currentSession.fileName = name;

      // Add to open tabs if not already there
      if (!openTabs.includes(name)) {
        openTabs.push(name);
      }

      const file = currentFiles[name];
      if (!file) {
        textarea.value = '';
        renderTabs(tabsContainer);
        return;
      }

      textarea.value = file.content;
      statusInfo.innerHTML = `<span>UTF-8</span><span></span>`;
      runBtn.style.display = name.endsWith('.py') ? 'block' : 'none';

      renderFileList(fileListContainer);
      renderTabs(tabsContainer);
      syncEditor();
    }

    // Event Bindings
    section.querySelector('#btn-refresh').onclick = () => renderFileList(fileListContainer);

    section.querySelector('#btn-new-file').onclick = (e) => {
      e.stopPropagation();
      currentSession.namingNew = { isRename: false, resultType: 'file', parent: '' };
      renderFileList(fileListContainer);
    };

    section.querySelector('#btn-new-folder').onclick = (e) => {
      e.stopPropagation();
      currentSession.namingNew = { isRename: false, resultType: 'folder', parent: '' };
      renderFileList(fileListContainer);
    };

    section.querySelector('#btn-collapse').onclick = () => {
      const allFolders = Object.keys(currentFiles).filter(key => key.endsWith('/'));
      const allCollapsed = allFolders.every(f => collapsedFolders.has(f));

      if (allCollapsed) {
        collapsedFolders.clear();
      } else {
        allFolders.forEach(f => collapsedFolders.add(f));
      }
      renderFileList(fileListContainer);
    };

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

    // CONSOLIDATED FILE LIST HANDLER
    fileListContainer.onclick = (e) => {
      const item = e.target.closest('.ide-file-item');
      if (item && !item.classList.contains('naming-item')) {
        const file = item.dataset.file;
        currentSession.selectedFile = file;

        fileListContainer.querySelectorAll('.ide-file-item').forEach(el => el.classList.remove('active-selection'));
        item.classList.add('active-selection');

        if (!file.endsWith('/')) {
          switchFile(file);
        } else {
          if (collapsedFolders.has(file)) collapsedFolders.delete(file);
          else collapsedFolders.add(file);
          renderFileList(fileListContainer);
        }
      }
    };

    textarea.oninput = syncEditor;
    textarea.onscroll = () => {
      section.querySelector('#ide-pre').scrollTop = textarea.scrollTop;
      section.querySelector('#ide-pre').scrollLeft = textarea.scrollLeft;
      lineNumbers.scrollTop = textarea.scrollTop;
    };

    runBtn.onclick = async () => {
      if (!pyodide) {
        runBtn.disabled = true;
        runBtn.innerHTML = '<svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><circle cx="12" cy="12" r="10"></circle></svg>';
        if (!document.getElementById('ide-spinner-style')) {
          const style = document.createElement('style');
          style.id = 'ide-spinner-style';
          style.textContent = `
            @keyframes spin { 100% { transform: rotate(360deg); } }
            .spinner { animation: spin 1s linear infinite; opacity: 0.7; }
          `;
          document.head.appendChild(style);
        }
        pyodide = await window.loadPyodide();
        runBtn.disabled = false;
        runBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
      }
      terminal.innerHTML = `<span class="info">${translations[lang].playground.terminal.running}</span>`;
      try {
        pyodide.runPython(`import sys\nimport io\nsys.stdout = io.StringIO()`);
        await pyodide.runPythonAsync(textarea.value);
        const stdout = pyodide.runPython("sys.stdout.getvalue()");
        terminal.innerHTML = stdout ? stdout.replace(/\n/g, '<br>') : `<span class="success">✓ ${translations[lang].playground.terminal.executedSuccess}</span>`;
      } catch (err) {
        terminal.innerHTML = `<span class="error">${err.message}</span>`;
      }
    };

    function closeTab(name) {
      openTabs = openTabs.filter(t => t !== name);
      if (currentSession.fileName === name) {
        if (openTabs.length > 0) {
          switchFile(openTabs[openTabs.length - 1]);
        } else {
          currentSession.fileName = null;
          textarea.value = '';
          preCode.textContent = '';
          lineNumbers.innerHTML = '';
          tabsContainer.innerHTML = '';
        }
      } else {
        renderTabs(tabsContainer);
      }
    }

    tabsContainer.onclick = (e) => {
      const closeBtn = e.target.closest('.tab-close');
      const tab = e.target.closest('.ide-tab');

      if (closeBtn) {
        e.stopPropagation();
        closeTab(closeBtn.dataset.close);
        return;
      }

      if (tab) switchFile(tab.dataset.file);
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
    restoreFab.style.animation = 'rainbowSlide 3s linear infinite';

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

    restartBtn.onclick = () => {
      terminal.innerHTML = `<span class="info">${translations[lang].playground.terminal.restarting}</span>`;
      pyodide = null;
      setTimeout(() => {
        terminal.innerHTML = `<span class="success">${translations[lang].playground.terminal.restarted}</span>`;
      }, 500);
    };

    clearBtn.onclick = () => { terminal.innerHTML = ''; };

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
    switchFile('pipeline.py');
  }, 0);

  return section;
}
