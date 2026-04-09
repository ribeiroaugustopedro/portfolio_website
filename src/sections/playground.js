import { files } from '../data/ideFiles.js';

export function renderIDE() {
  const section = document.createElement('section');
  section.id = 'playground';
  section.className = 'ide-section reveal';

  // State Management
  let currentFiles = { ...files };
  let openTabs = ['pipeline.py'];
  let collapsedFolders = new Set();
  const currentSession = {
    fileName: 'pipeline.py',
    sidebar: 'explorer' // 'explorer' or 'catalog'
  };

  const CATALOG_TYPE_ICONS = {
    text: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#79c0ff" stroke-width="2.5"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>',
    number: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7ee787" stroke-width="2.5"><path d="M5 22V2M19 22V2M2 17h20M2 7h20"/></svg>',
    date: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ff7b72" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
  };

  const catalogData = [
    {
      name: 'warehouse',
      type: 'database',
      open: true,
      children: [
        {
          name: 'gold',
          type: 'schema',
          open: true,
          children: [
            {
              name: 'members',
              type: 'table',
              rows: '149,203',
              columns: [
                { name: 'user_id', type: 'text', distinct: '149,203' },
                { name: 'user_gender', type: 'text', distinct: '2' },
                { name: 'user_age', type: 'number', distinct: '84' },
                { name: 'loc_region', type: 'text', distinct: '5' },
                { name: 'loc_state', type: 'text', distinct: '27' },
                { name: 'created_at', type: 'date', distinct: '1,450' }
              ]
            },
            {
              name: 'providers',
              type: 'table',
              rows: '1,240',
              columns: [
                { name: 'provider_id', type: 'text', distinct: '1,240' },
                { name: 'specialty', type: 'text', distinct: '14' },
                { name: 'rating', type: 'number', distinct: '5' },
                { name: 'is_active', type: 'text', distinct: '2' }
              ]
            }
          ]
        }
      ]
    }
  ];

  const ICONS = {
    js: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f7df1e" stroke-width="2"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>',
    py: '<svg width="14" height="14" viewBox="0 0 24 24" fill="#3776ab"><path d="M11.97 2c-3.111 0-2.887 1.341-2.887 1.341l.004 1.383h2.923v.409H7.957S5.034 5.004 5.034 8.169c0 3.165 2.502 3.018 2.502 3.018h1.493v-2.11s.033-2.503 2.503-2.503h2.518s2.454.017 2.454-2.39c0-2.408-2.146-2.184-2.146-2.184H11.97zm2.936 3.655a.519.519 0 0 1 .519.519.519.519 0 0 1-.519.519.519.519 0 0 1-.519-.519.519.519 0 0 1 .519-.519zM12.03 22c3.111 0 2.887-1.341 2.887-1.341l-.004-1.383h-2.923v-.409h4.053s2.923.129 2.923-3.036c0-3.165-2.502-3.018-2.502-3.018h-1.493v2.11s-.033 2.503-2.503 2.503H10.05s-2.454-.017-2.454 2.39c0 2.408 2.146 2.184 2.146 2.184H12.03zm-2.936-3.655a.519.519 0 0 1-.519-.519.519.519 0 0 1 .519-.519.519.519 0 0 1 .519.519.519.519 0 0 1-.519.519z"/></svg>',
    html: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e34f26" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>',
    css: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1572b6" stroke-width="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.5 9.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm-3-3c-.83 0-1.5-.67-1.5-1.5S12.67 5.5 13.5 5.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm-3-1c-.83 0-1.5-.67-1.5-1.5S8.67 4.5 9.5 4.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm-3 4c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>', // Palette
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
    if (name.endsWith('/')) {
      return collapsedFolders.has(name) ? ICONS.folder : ICONS.folderOpen;
    }
    const ext = name.split('.').pop().toLowerCase();
    return ICONS[ext] || ICONS.default;
  }

  function renderFileList(container) {
    if (!container) return;

    const entries = Object.keys(currentFiles).sort();

    container.innerHTML = entries.map(fileName => {
      // Check if this file is inside a collapsed folder
      const parts = fileName.split('/');
      let isVisible = true;
      let pathAcc = '';

      for (let i = 0; i < parts.length - 1; i++) {
        pathAcc += parts[i] + '/';
        if (collapsedFolders.has(pathAcc)) {
          // If the file is NOT the collapsed folder itself, hide it
          if (fileName !== pathAcc) {
            isVisible = false;
            break;
          }
        }
      }

      if (!isVisible) return '';

      const displayName = fileName.endsWith('/')
        ? fileName.split('/').slice(-2, -1)[0]
        : fileName.split('/').pop();

      const indent = (fileName.split('/').length - (fileName.endsWith('/') ? 2 : 1)) * 10;

      return `
        <div class="ide-file-item ${fileName === currentSession.fileName ? 'active' : ''}" 
             data-file="${fileName}" 
             draggable="true"
             style="padding-left: ${15 + indent}px">
          ${getFileIcon(fileName)}
          <span>${displayName}</span>
          <div class="file-delete-btn" title="Delete" data-delete="${fileName}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderTabs(container) {
    if (!container) return;
    container.innerHTML = openTabs.map(fileName => `
      <div class="ide-tab ${fileName === currentSession.fileName ? 'active' : ''}" data-file="${fileName}">
        ${getFileIcon(fileName)}
        <span>${fileName}</span>
        <div class="tab-close" data-close="${fileName}">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
        </div>
      </div>
    `).join('');
  }

  section.innerHTML = `
    <h2 class="section-title" style="text-align: center; margin-bottom: 40px; color: var(--text-primary);">Interactive Playground</h2>
    
    <div class="ide-window" id="ide-window">
      <div class="ide-header">
        <div class="window-controls">
          <div class="control close" id="win-close"></div>
          <div class="control minimize"></div>
          <div class="control maximize"></div>
        </div>
        <span>pedro_augusto_ribeiro — playground</span>
        <div style="width: 52px;"></div> <!-- Spacer to center title -->
      </div>
      <div class="ide-body">
        <div class="ide-activity-bar">
          <!-- Workspace / Repos (Folder) -->
          <div class="ide-icon active" title="Workspace">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <!-- Catalog (Geometric Shapes) -->
          <div class="ide-icon" title="Catalog">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <!-- Triangle (Aggressive) -->
              <path d="M12 1l9 11H3l9-11z"></path>
              <!-- Circle (Aggressive) -->
              <circle cx="7.5" cy="18.5" r="4"></circle>
              <!-- Square (Aggressive) -->
              <rect x="13" y="14.5" width="8" height="8" rx="1"></rect>
            </svg>
          </div>
        </div>

          <div class="ide-sidebar">
            <div class="ide-sidebar-content" id="sidebar-explorer">
              <div class="ide-sidebar-header">
                <span>Explorer</span>
                <div class="ide-sidebar-actions">
                  <div class="sidebar-action-btn" title="New File" id="btn-new-file">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                  </div>
                  <div class="sidebar-action-btn" title="New Folder" id="btn-new-folder">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="17" x2="12" y2="11"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>
                  </div>
                  <div class="sidebar-action-btn" title="Refresh" id="btn-refresh">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                  </div>
                  <div class="sidebar-action-btn" title="Collapse/Expand All" id="btn-collapse">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path><line x1="12" y1="15" x2="19" y2="15"></line></svg>
                  </div>
                </div>
              </div>
              <div class="ide-file-list" id="ide-file-list"></div>
            </div>
            <div class="ide-sidebar-content" id="sidebar-catalog" style="display:none;">
              <div class="ide-sidebar-header">
                <span>Attached Databases</span>
                <div class="ide-sidebar-actions">
                  <div class="sidebar-action-btn" title="Add Database"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></div>
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
              <span>OUTPUT</span>
              <div class="terminal-actions">
                <button id="run-btn" class="run-btn" title="Run (Ctrl+Enter)" style="padding-top: 2px;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                </button>
                <button id="restart-btn" class="run-btn" title="Restart Kernel">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                </button>
                <button id="clear-btn" class="run-btn" title="Clear Output">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>
            <div class="terminal-output" id="terminal-output">
              <span class="info">Ready.</span>
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

    function renderCatalog() {
      if (!catalogTreeContainer) return;

      function renderNode(node, depth = 0) {
        const icon = CATALOG_ICONS[node.type];
        const color = node.type === 'database' ? '#79c0ff' : node.type === 'schema' ? '#d1d5db' : '#7ee787';

        let html = `
          <div class="catalog-node ${node.open ? 'open' : ''}" style="padding-left: ${depth * 15 + 10}px" data-node-name="${node.name}">
            <span class="catalog-arrow" style="font-size: 8px;">${node.children ? (node.open ? '▼' : '▶') : ' '}</span>
            <span class="catalog-icon" style="color: ${color}">${icon}</span>
            <span class="catalog-name">${node.name}</span>
          </div>
        `;

        if (node.open && node.children) {
          html += node.children.map(child => renderNode(child, depth + 1)).join('');
        }

        if (node.open && node.type === 'table' && node.columns) {
          html += `
            <div class="catalog-table-details" style="margin-left: ${depth * 15 + 28}px">
              <div class="details-header">
                <span>${node.name}</span>
                <span class="rows">${node.rows} rows</span>
              </div>
              <div class="column-list">
                ${node.columns.map(col => `
                  <div class="column-item">
                    <span class="type-icon">${CATALOG_TYPE_ICONS[col.type]}</span>
                    <span class="name">${col.name}</span>
                    <span class="stat" title="Distinct Values">${col.distinct}</span>
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
        activityBar.querySelector('[title="Workspace"]').classList.add('active');
        explorerSidebar.style.display = 'flex';
        catalogSidebar.style.display = 'none';
      } else {
        activityBar.querySelector('[title="Catalog"]').classList.add('active');
        explorerSidebar.style.display = 'none';
        catalogSidebar.style.display = 'flex';
        renderCatalog();
      }
    }

    // Set side bar click events
    activityBar.querySelector('[title="Workspace"]').onclick = () => switchSidebar('explorer');
    activityBar.querySelector('[title="Catalog"]').onclick = () => switchSidebar('catalog');

    catalogTreeContainer.onclick = (e) => {
      const node = e.target.closest('.catalog-node');
      if (!node) return;

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
    };

    function syncEditor() {
      const file = currentFiles[currentSession.fileName];
      if (!file) return;

      file.content = code;
      preCode.className = `language-${file.language}`;
      preCode.textContent = code;
      if (window.Prism) window.Prism.highlightElement(preCode);

      const lines = code.split('\n');
      lineNumbers.innerHTML = lines.map((_, i) => `<div class="line-number-item">${i + 1}</div>`).join('');

      // Dynamic Height Sync to fix alignment in long files
      requestAnimationFrame(() => {
        const height = Math.max(textarea.scrollHeight, 600); // Minimum height of window
        textarea.style.height = height + 'px';
        section.querySelector('#ide-pre').style.height = height + 'px';
        lineNumbers.style.height = height + 'px';
      });
    }

    function switchFile(name) {
      if (name.endsWith('/')) return;
      currentSession.fileName = name;

      // Add to open tabs if not already there
      if (!openTabs.includes(name)) {
        openTabs.push(name);
      }

      const file = currentFiles[name];
      if (!file) {
        // Handle file not found (could happen after deletion)
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

    function closeTab(name) {
      openTabs = openTabs.filter(t => t !== name);
      if (currentSession.fileName === name) {
        if (openTabs.length > 0) {
          switchFile(openTabs[openTabs.length - 1]);
        } else {
          // No more tabs
          currentSession.fileName = null;
          textarea.value = '';
          preCode.textContent = '';
          lineNumbers.innerHTML = '';
          tabsContainer.innerHTML = '';
          statusInfo.innerHTML = '<span>UTF-8</span><span>Text</span>';
          runBtn.style.display = 'none';
        }
      } else {
        renderTabs(tabsContainer);
      }
    }

    function createItem(type) {
      const input = document.createElement('input');
      input.className = 'ide-file-input';
      input.placeholder = type === 'file' ? 'filename.js' : 'folder_name';
      fileListContainer.prepend(input);
      input.focus();

      const finishCreate = () => {
        const name = input.value.trim();
        if (name) {
          if (type === 'file') {
            const ext = name.split('.').pop().toLowerCase();
            const langMap = {
              js: 'javascript',
              py: 'python',
              html: 'html',
              css: 'css',
              sql: 'sql',
              md: 'markdown',
              json: 'json',
              txt: 'text'
            };
            currentFiles[name] = { name, language: langMap[ext] || 'javascript', content: '' };
            switchFile(name);
          } else {
            currentFiles[name + '/'] = { name: name + '/', language: 'folder', content: '' };
            renderFileList(fileListContainer);
          }
        } else {
          renderFileList(fileListContainer);
        }
      };

      input.onkeydown = (e) => {
        if (e.key === 'Enter') finishCreate();
        else if (e.key === 'Escape') renderFileList(fileListContainer);
      };
      input.onblur = () => {
        if (!input.value.trim()) setTimeout(() => renderFileList(fileListContainer), 100);
      };
    }

    // Event Bindings
    section.querySelector('#btn-new-file').onclick = () => createItem('file');
    section.querySelector('#btn-new-folder').onclick = () => createItem('folder');
    section.querySelector('#btn-refresh').onclick = () => renderFileList(fileListContainer);
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
        // Add a "Recovery" button or just let them reload for now
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
      const deleteBtn = e.target.closest('.file-delete-btn');
      const item = e.target.closest('.ide-file-item');

      if (deleteBtn) {
        const name = deleteBtn.dataset.delete;
        delete currentFiles[name];
        closeTab(name);
        renderFileList(fileListContainer);
        return;
      }

      if (item) {
        const name = item.dataset.file;
        if (name.endsWith('/')) {
          if (collapsedFolders.has(name)) {
            collapsedFolders.delete(name);
          } else {
            collapsedFolders.add(name);
          }
          renderFileList(fileListContainer);
        } else {
          switchFile(name);
        }
      }
    };

    tabsContainer.onclick = (e) => {
      const closeBtn = e.target.closest('.tab-close');
      const tab = e.target.closest('.ide-tab');

      if (closeBtn) {
        closeTab(closeBtn.dataset.close);
        return;
      }

      if (tab) switchFile(tab.dataset.file);
    };

    // Drag & Drop Logic
    fileListContainer.ondragstart = (e) => {
      const item = e.target.closest('.ide-file-item');
      if (item) {
        e.dataTransfer.setData('text/plain', item.dataset.file);
        e.dataTransfer.effectAllowed = 'move';
      }
    };

    fileListContainer.ondragover = (e) => {
      e.preventDefault();
      const item = e.target.closest('.ide-file-item');
      if (item && item.dataset.file.endsWith('/')) {
        item.classList.add('drag-over');
        e.dataTransfer.dropEffect = 'move';
      }
    };

    fileListContainer.ondragleave = (e) => {
      const item = e.target.closest('.ide-file-item');
      if (item) item.classList.remove('drag-over');
    };

    fileListContainer.ondrop = (e) => {
      e.preventDefault();
      const sourceName = e.dataTransfer.getData('text/plain');
      const targetItem = e.target.closest('.ide-file-item');

      if (targetItem) targetItem.classList.remove('drag-over');

      if (targetItem && targetItem.dataset.file.endsWith('/') && sourceName !== targetItem.dataset.file) {
        const targetFolder = targetItem.dataset.file;
        const fileNameOnly = sourceName.split('/').pop();
        const newName = targetFolder + fileNameOnly;

        if (currentFiles[sourceName]) {
          const fileData = { ...currentFiles[sourceName] };
          fileData.name = newName;
          delete currentFiles[sourceName];
          currentFiles[newName] = fileData;

          // Update tabs and session if moving active file
          if (currentSession.fileName === sourceName) {
            currentSession.fileName = newName;
          }
          openTabs = openTabs.map(t => t === sourceName ? newName : t);

          renderFileList(fileListContainer);
          renderTabs(tabsContainer);
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
        // Add spinner animation style if not exists
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
      terminal.innerHTML = '<span class="info">Executing...</span>';
      try {
        pyodide.runPython(`import sys\nimport io\nsys.stdout = io.StringIO()`);
        await pyodide.runPythonAsync(textarea.value);
        const stdout = pyodide.runPython("sys.stdout.getvalue()");
        terminal.innerHTML = stdout ? stdout.replace(/\n/g, '<br>') : '<span class="success">✓ Executed successfully (no output).</span>';
      } catch (err) {
        terminal.innerHTML = `<span class="error">${err.message}</span>`;
      }
    };

    // Keyboard Shortcuts
    textarea.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        runBtn.click();
      }
    });

    restartBtn.onclick = () => {
      terminal.innerHTML = '<span class="info">Restarting kernel...</span>';
      pyodide = null; // This will trigger reload on next run
      setTimeout(() => {
        terminal.innerHTML = '<span class="success">✓ Kernel restarted. Ready.</span>';
      }, 500);
    };

    clearBtn.onclick = () => { terminal.innerHTML = ''; };

    // Initial Render
    switchFile('pipeline.py');
  }, 0);

  return section;
}
