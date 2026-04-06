export function renderProjectCard(project, lang, translations) {
  const card = document.createElement('div');
  card.className = 'project-card rainbow-border reveal';

  // Use a reliable fallback if lang/translations not passed, though they should be.
  const titleText = (project.title && project.title[lang]) ? project.title[lang] : (project.title || 'Untitled');
  const descText = (project.description && project.description[lang]) ? project.description[lang] : (project.description || '');
  const viewText = (translations && translations[lang] && translations[lang].projects) ? translations[lang].projects.viewProject : 'View Project';

  // Content Container (so we can hide it behind tabs)
  const infoContent = document.createElement('div');
  infoContent.className = 'project-info-content';
  infoContent.style.display = 'flex';
  infoContent.style.flexDirection = 'column';
  infoContent.style.height = '100%';

  const title = document.createElement('h3');
  title.textContent = titleText;
  title.style.fontSize = '1.2rem';
  title.style.marginBottom = '12px';

  const desc = document.createElement('p');
  desc.textContent = descText;
  desc.style.fontSize = '0.95rem';
  desc.style.color = 'var(--text-secondary)';
  desc.style.marginBottom = '20px';
  desc.style.lineHeight = '1.6';

  const tags = document.createElement('div');
  tags.style.display = 'flex';
  tags.style.flexWrap = 'wrap';
  tags.style.gap = '8px';
  tags.style.marginBottom = '20px';

  const uniqueTagColors = {
    'Python': '#3776AB',
    'SQL': '#3498DB',
    'Databricks': '#FF3621',
    'Data Modeling': '#E67E22',
    'ETL': '#27AE60',
    'Streamlit': '#FF4B4B',
    'Folium': '#16A085',
    'Geospatial': '#9B59B6',
    'Power BI': '#F1C40F',
    'DAX': '#34495E',
    'Governance': '#E74C3C',
    'NLP': '#8E44AD',
    'Generative AI': '#D35400',
    'Teams Integration': '#4B53BC',
    'Excel': '#1D6F42',
    'Data Analysis': '#2C3E50',
    'AWS Athena': '#FF9900',
    'AWS Glue': '#527FFF',
    'default': '#858585'
  };

  project.tags.forEach(tag => {
    const span = document.createElement('span');
    span.textContent = tag;
    span.style.fontSize = '0.75rem';
    span.style.padding = '4px 10px';
    span.style.borderRadius = '4px';

    const color = uniqueTagColors[tag] || uniqueTagColors.default;

    span.style.border = `1px solid ${color}`;
    span.style.color = color;
    span.style.background = 'var(--surface-color)';
    span.style.fontFamily = 'var(--font-mono)';
    tags.appendChild(span);
  });

  const linkEl = document.createElement('a');
  linkEl.href = project.link;
  linkEl.className = 'project-link';
  linkEl.innerHTML = `${viewText} &rarr;`;
  linkEl.style.display = 'inline-block';
  linkEl.style.marginTop = 'auto'; // Works with flex-column card
  linkEl.style.color = 'var(--text-primary)';
  linkEl.style.fontSize = '0.9rem';
  linkEl.style.fontWeight = 'bold';
  linkEl.style.textDecoration = 'none';

  infoContent.appendChild(title);
  infoContent.appendChild(desc);
  infoContent.appendChild(tags);
  infoContent.appendChild(linkEl);

  // Feature: Tab System for Live Demo Injection
  if (project.liveDemoUrl) {
    const tabsContainer = document.createElement('div');
    tabsContainer.style.display = 'flex';
    tabsContainer.style.gap = '20px';
    tabsContainer.style.marginBottom = '20px';
    tabsContainer.style.borderBottom = '1px solid var(--border-color)';

    const infoTabBtn = document.createElement('button');
    infoTabBtn.innerHTML = '📝 Overview';
    infoTabBtn.style.color = 'var(--accent-color)';
    infoTabBtn.style.borderBottom = '2px solid var(--accent-color)';
    infoTabBtn.style.fontWeight = 'bold';
    infoTabBtn.style.paddingBottom = '8px';
    infoTabBtn.style.fontSize = '0.95rem';

    const demoTabBtn = document.createElement('button');
    demoTabBtn.innerHTML = '🚀 Live App';
    demoTabBtn.style.color = 'var(--text-secondary)';
    demoTabBtn.style.borderBottom = '2px solid transparent';
    demoTabBtn.style.paddingBottom = '8px';
    demoTabBtn.style.fontSize = '0.95rem';
    demoTabBtn.style.transition = 'color 0.3s ease';
    
    demoTabBtn.onmouseover = () => { if (demoTabBtn.style.color !== 'var(--accent-color)') demoTabBtn.style.color = 'var(--text-primary)'; };
    demoTabBtn.onmouseout = () => { if (demoTabBtn.style.borderBottom === '2px solid transparent') demoTabBtn.style.color = 'var(--text-secondary)'; };

    tabsContainer.appendChild(infoTabBtn);
    tabsContainer.appendChild(demoTabBtn);

    const appContent = document.createElement('div');
    appContent.style.display = 'none';
    appContent.style.width = '100%';
    appContent.style.height = '700px'; 
    appContent.style.borderRadius = '8px';
    appContent.style.overflow = 'hidden';
    appContent.style.background = '#0e1117'; // Streamlit dark gray background buffer

    let iframeRendered = false;

    demoTabBtn.addEventListener('click', () => {
      infoTabBtn.style.color = 'var(--text-secondary)';
      infoTabBtn.style.borderBottom = '2px solid transparent';
      demoTabBtn.style.color = 'var(--accent-color)';
      demoTabBtn.style.borderBottom = '2px solid var(--accent-color)';

      infoContent.style.display = 'none';
      appContent.style.display = 'block';

      if (!iframeRendered) {
        const iframe = document.createElement('iframe');
        iframe.src = project.liveDemoUrl;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        appContent.appendChild(iframe);
        iframeRendered = true;
      }
      
      // Make card wide inside the grid to ensure map is legible
      card.style.gridColumn = '1 / -1';
    });

    infoTabBtn.addEventListener('click', () => {
      demoTabBtn.style.color = 'var(--text-secondary)';
      demoTabBtn.style.borderBottom = '2px solid transparent';
      infoTabBtn.style.color = 'var(--accent-color)';
      infoTabBtn.style.borderBottom = '2px solid var(--accent-color)';

      appContent.style.display = 'none';
      infoContent.style.display = 'flex';
      
      // Reset card width
      card.style.gridColumn = '';
    });

    card.appendChild(tabsContainer);
    card.appendChild(infoContent);
    card.appendChild(appContent);
  } else {
    card.appendChild(infoContent);
  }

  return card;
}
