import { files } from '../data/ideFiles.js';

export function renderIDE() {
  const section = document.createElement('section');
  section.id = 'playground';
  section.className = 'ide-section';
  let currentFiles = { ...files };
  let openTabs = ['pipeline.py'];
  let collapsedFolders = new Set();
  const currentSession = { fileName: 'pipeline.py', sidebar: 'explorer' };
  const CATALOG_TYPE_ICONS = {
    text: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#79c0ff" stroke-width="2.5"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>',
    number: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7ee787" stroke-width="2.5"><path d="M5 22V2M19 22V2M2 17h20M2 7h20"/></svg>',
    date: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ff7b72" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
  };
  const catalogData = [{ name: 'warehouse', type: 'database', open: true, children: [{ name: 'gold', type: 'schema', open: true, children: [{ name: 'members', type: 'table', rows: '149,203', columns: [{ name: 'user_id', type: 'text', distinct: '149,203' }, { name: 'user_gender', type: 'text', distinct: '2' }, { name: 'user_age', type: 'number', distinct: '84' }, { name: 'loc_region', type: 'text', distinct: '5' }, { name: 'loc_state', type: 'text', distinct: '27' }, { name: 'created_at', type: 'date', distinct: '1,450' }] }, { name: 'providers', type: 'table', rows: '1,240', columns: [{ name: 'provider_id', type: 'text', distinct: '1,240' }, { name: 'specialty', type: 'text', distinct: '14' }, { name: 'rating', type: 'number', distinct: '5' }, { name: 'is_active', type: 'text', distinct: '2' }] }] }] }];
  const ICONS = {
    js: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f7df1e" stroke-width="2"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>',
    py: '<svg width="14" height="14" viewBox="0 0 24 24" fill="#3776ab"><path d="M11.97 2c-3.111 0-2.887 1.341-2.887 1.341l.004 1.383h2.923v.409H7.957S5.034 5.004 5.034 8.169c0 3.165 2.502 3.018 2.502 3.018h1.493v-2.11s.033-2.503 2.503-2.503h2.518s2.454.017 2.454-2.39c0-2.408-2.146-2.184-2.146-2.184H11.97zm2.936 3.655a.519.519 0 0 1 .519.519.519.519 0 0 1-.519.519.519.519 0 0 1-.519-.519.519.519 0 0 1 .519-.519zM12.03 22c3.111 0 2.887-1.341 2.887-1.341l-.004-1.383h-2.923v-.409h4.053s2.923.129 2.923-3.036c0-3.165-2.502-3.018-2.502-3.018h-1.493v2.11s-.033 2.503-2.503 2.503H10.05s-2.454-.017-2.454 2.39c0 2.408 2.146 2.184 2.146 2.184H12.03zm-2.936-3.655a.519.519 0 0 1-.519-.519.519.519 0 0 1 .519-.519.519.519 0 0 1 .519.519.519.519 0 0 1-.519.519z"/></svg>',
    html: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e34f26" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>',
    css: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1572b6" stroke-width="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>',
    sql: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f29111" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
    md: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#858585" stroke-width="2"><path d="M3 18h18M3 6h18M3 12h18"/></svg>',
    json: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbcb41" stroke-width="2"><path d="M10 20l-6-6 6-6M14 4l6 6-6 6"/></svg>',
    txt: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#858585" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    default: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>',
    folder: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dcb67a" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
    folderOpen: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dcb67a" stroke-width="2"><path d="M6 14l1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h4a2 2 0 0 1 2 2v2"/></svg>'
  };
  const CATALOG_ICONS = {
    database: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
    schema: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/></svg>',
    table: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>'
  };
  function getFileIcon(name) {
    if (name.endsWith('/')) return collapsedFolders.has(name) ? ICONS.folder : ICONS.folderOpen;
    return ICONS[name.split('.').pop().toLowerCase()] || ICONS.default;
  }
  function renderFileList(container) {
    if (!container) return;
    fileListContainer.innerHTML = Object.keys(currentFiles).sort().map(f => {
      let isVisible = true, parts = f.split('/'), acc = '';
      for (let i = 0; i < parts.length - 1; i++) { acc += parts[i] + '/'; if (collapsedFolders.has(acc) && f !== acc) { isVisible = false; break; } }
      if (!isVisible) return '';
      const dName = f.endsWith('/') ? f.split('/').slice(-2, -1)[0] : f.split('/').pop();
      const indent = (f.split('/').length - (f.endsWith('/') ? 2 : 1)) * 10;
      return `<div class="ide-file-item ${f === currentSession.fileName ? 'active' : ''}" data-file="${f}" draggable="true" style="padding-left: ${15 + indent}px">${getFileIcon(f)}<span>${dName}</span><div class="file-delete-btn" title="Delete" data-delete="${f}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"></path></svg></div></div>`;
    }).join('');
  }
  function renderTabs(container) {
    if (!container) return;
    container.innerHTML = openTabs.map(f => `<div class="ide-tab ${f === currentSession.fileName ? 'active' : ''}" data-file="${f}">${getFileIcon(f)}<span>${f}</span><div class="tab-close" data-close="${f}"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"></path></svg></div></div>`).join('');
  }
  section.innerHTML = `<h2 class="section-title reveal" style="text-align: center; margin-bottom: 40px; color: var(--text-primary);">Interactive Playground</h2><div class="ide-window reveal" id="ide-window"><div class="ide-header"><div class="window-controls"><div class="control close" id="win-close"></div><div class="control minimize"></div><div class="control maximize"></div></div><span>pedro_augusto_ribeiro — playground</span><div style="width: 52px;"></div></div><div class="ide-body"><div class="ide-activity-bar"><div class="ide-icon active" title="Workspace"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg></div><div class="ide-icon" title="Catalog"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 1l9 11H3l9-11z"></path><circle cx="7.5" cy="18.5" r="4"></circle><rect x="13" y="14.5" width="8" height="8" rx="1"></rect></svg></div></div><div class="ide-sidebar"><div class="ide-sidebar-content" id="sidebar-explorer"><div class="ide-sidebar-header"><span>Explorer</span><div class="ide-sidebar-actions"><div class="sidebar-action-btn" title="New File" id="btn-new-file"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg></div><div class="sidebar-action-btn" title="New Folder" id="btn-new-folder"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="17" x2="12" y2="11"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg></div><div class="sidebar-action-btn" title="Refresh" id="btn-refresh"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg></div><div class="sidebar-action-btn" title="Collapse" id="btn-collapse"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path><line x1="12" y1="15" x2="19" y2="15"></line></svg></div></div></div><div class="ide-file-list" id="ide-file-list"></div></div><div class="ide-sidebar-content" id="sidebar-catalog" style="display:none;"><div class="ide-sidebar-header"><span>Attached Databases</span><div class="ide-sidebar-actions"><div class="sidebar-action-btn" title="Add Database"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></div></div></div><div class="catalog-tree" id="catalog-tree"></div></div></div><div class="ide-editor-container"><div class="ide-editor-main"><div class="ide-tabs" id="ide-tabs"></div><div class="ide-editor-wrapper"><div class="line-numbers-sidebar" id="line-numbers"></div><textarea id="ide-textarea" class="ide-textarea" spellcheck="false"></textarea><pre id="ide-pre" class="ide-pre"><code id="ide-code"></code></pre></div></div><div class="ide-terminal"><div class="terminal-header"><span>OUTPUT</span><div class="terminal-actions"><button id="run-btn" class="run-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></button><button id="restart-btn" class="run-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg></button><button id="clear-btn" class="run-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button></div></div><div class="terminal-output" id="terminal-output"><span class="info">Ready.</span></div></div></div></div><div class="ide-status-bar"><div class="status-left"></div><div class="status-right" id="status-info"><span>UTF-8</span></div></div></div>`;
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
    function renderCatalog() {
      if (!catalogTreeContainer) return;
      function rNode(n, d = 0) {
        const i = CATALOG_ICONS[n.type], c = n.type === 'database' ? '#79c0ff' : n.type === 'schema' ? '#d1d5db' : '#7ee787';
        let h = `<div class="catalog-node ${n.open ? 'open' : ''}" style="padding-left: ${d * 15 + 10}px" data-node-name="${n.name}"><span class="catalog-arrow">${n.children ? (n.open ? '▼' : '▶') : ' '}</span><span class="catalog-icon" style="color: ${c}">${i}</span><span class="catalog-name">${n.name}</span></div>`;
        if (n.open && n.children) h += n.children.map(ch => rNode(ch, d + 1)).join('');
        if (n.open && n.type === 'table' && n.columns) h += `<div class="catalog-table-details" style="margin-left: ${d * 15 + 28}px"><div class="details-header"><span>${n.name}</span><span class="rows">${n.rows} rows</span></div><div class="column-list">${n.columns.map(cl => `<div class="column-item"><span class="type-icon">${CATALOG_TYPE_ICONS[cl.type]}</span><span class="name">${cl.name}</span><span class="stat">${cl.distinct}</span></div>`).join('')}</div></div>`;
        return h;
      }
      catalogTreeContainer.innerHTML = catalogData.map(db => rNode(db)).join('');
    }
    function switchSidebar(v) {
      currentSession.sidebar = v;
      activityBar.querySelectorAll('.ide-icon').forEach(i => i.classList.remove('active'));
      if (v === 'explorer') { activityBar.querySelector('[title="Workspace"]').classList.add('active'); explorerSidebar.style.display = 'flex'; catalogSidebar.style.display = 'none'; } 
      else { activityBar.querySelector('[title="Catalog"]').classList.add('active'); explorerSidebar.style.display = 'none'; catalogSidebar.style.display = 'flex'; renderCatalog(); }
    }
    activityBar.querySelector('[title="Workspace"]').onclick = () => switchSidebar('explorer');
    activityBar.querySelector('[title="Catalog"]').onclick = () => switchSidebar('catalog');
    catalogTreeContainer.onclick = (e) => {
      const n = e.target.closest('.catalog-node'); if (!n) return;
      const nm = n.dataset.nodeName;
      const fToggle = (l) => { for (const tt of l) { if (tt.name === nm) { tt.open = !tt.open; return true; } if (tt.children && fToggle(tt.children)) return true; } return false; };
      fToggle(catalogData); renderCatalog();
    };
    function syncEditor() {
      const f = currentFiles[currentSession.fileName]; if (!f) return;
      f.content = textarea.value; preCode.className = `language-${f.language}`; preCode.textContent = textarea.value;
      if (window.Prism) window.Prism.highlightElement(preCode);
      lineNumbers.innerHTML = textarea.value.split('\n').map((_, i) => `<div class="line-number-item">${i + 1}</div>`).join('');
      requestAnimationFrame(() => { const h = Math.max(textarea.scrollHeight, 600); textarea.style.height = h + 'px'; section.querySelector('#ide-pre').style.height = h + 'px'; lineNumbers.style.height = h + 'px'; });
    }
    function switchFile(n) {
      if (n.endsWith('/')) return;
      currentSession.fileName = n; if (!openTabs.includes(n)) openTabs.push(n);
      const f = currentFiles[n]; if (!f) { textarea.value = ''; renderTabs(tabsContainer); return; }
      textarea.value = f.content; runBtn.style.display = n.endsWith('.py') ? 'block' : 'none';
      renderFileList(fileListContainer); renderTabs(tabsContainer); syncEditor();
    }
    textarea.oninput = syncEditor;
    textarea.onscroll = () => { section.querySelector('#ide-pre').scrollTop = textarea.scrollTop; section.querySelector('#ide-pre').scrollLeft = textarea.scrollLeft; lineNumbers.scrollTop = textarea.scrollTop; };
    runBtn.onclick = async () => {
      if (!pyodide) { runBtn.disabled = true; pyodide = await window.loadPyodide(); runBtn.disabled = false; }
      terminal.innerHTML = '<span class="info">Executing...</span>';
      try { pyodide.runPython(`import sys\nimport io\nsys.stdout = io.StringIO()`); await pyodide.runPythonAsync(textarea.value); const so = pyodide.runPython("sys.stdout.getvalue()"); terminal.innerHTML = so ? so.replace(/\n/g, '<br>') : '<span class="success">✓ Executed successfully.</span>'; } 
      catch (err) { terminal.innerHTML = `<span class="error">${err.message}</span>`; }
    };
    fileListContainer.onclick = (e) => {
      const d = e.target.closest('.file-delete-btn'), it = e.target.closest('.ide-file-item');
      if (d) { const name = d.dataset.delete; delete currentFiles[name]; openTabs = openTabs.filter(t => t !== name); renderFileList(fileListContainer); renderTabs(tabsContainer); return; }
      if (it) { const n = it.dataset.file; if (n.endsWith('/')) { if (collapsedFolders.has(n)) collapsedFolders.delete(n); else collapsedFolders.add(n); renderFileList(fileListContainer); } else switchFile(n); }
    };
    tabsContainer.onclick = (e) => { const c = e.target.closest('.tab-close'), t = e.target.closest('.ide-tab'); if (c) { openTabs = openTabs.filter(tt => tt !== c.dataset.close); renderTabs(tabsContainer); } else if (t) switchFile(t.dataset.file); };
    clearBtn.onclick = () => { terminal.innerHTML = ''; };
    restartBtn.onclick = () => { pyodide = null; terminal.innerHTML = '<span class="success">✓ Kernel restarted.</span>'; };
    section.querySelector('#win-close').onclick = () => { ideWindow.style.display = 'none'; };
    switchFile('pipeline.py');
  }, 0);
  return section;
}
