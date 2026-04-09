import { openPreviewModal } from './previewModal.js';

export function renderProjectCard(project, lang, translations) {
  const card = document.createElement('div');
  card.className = 'project-card reveal';
  const titleText = (project.title && project.title[lang]) ? project.title[lang] : (project.title || 'Untitled');
  const descText = (project.description && project.description[lang]) ? project.description[lang] : (project.description || '');
  const viewText = (translations && translations[lang] && translations[lang].projects) ? translations[lang].projects.viewProject : 'View Project';
  const title = document.createElement('h3');
  title.textContent = titleText;
  title.style.fontSize = '1.2rem';
  title.style.marginBottom = '12px';
  title.style.transition = 'color 0.3s ease';
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
    'Python': '#3776AB', 'SQL': '#3498DB', 'Databricks': '#FF3621', 'DuckDB': '#FFCC00',
    'Pandas': '#527FFF', 'Data Modeling': '#E67E22', 'ETL': '#27AE60', 'Streamlit': '#FF4B4B',
    'Folium': '#2ECC71', 'GenAI': '#9B59B6', 'Generative AI': '#9B59B6', 'Power BI': '#F1C40F',
    'Excel': '#1D6F42', 'default': '#858585'
  };
  project.tags.forEach(tag => {
    const span = document.createElement('span');
    span.textContent = tag;
    span.style.fontSize = '0.75rem';
    span.style.padding = '4px 12px';
    span.style.borderRadius = '20px';
    const color = uniqueTagColors[tag] || uniqueTagColors.default;
    span.style.border = `1px solid ${color}55`;
    span.style.color = color;
    span.style.background = `${color}15`;
    span.style.fontFamily = 'var(--font-mono)';
    span.style.fontWeight = 'bold';
    tags.appendChild(span);
  });
  const linkIndicator = document.createElement('a');
  linkIndicator.className = 'project-link-indicator';
  linkIndicator.href = '#';
  linkIndicator.innerHTML = `${viewText} &rarr;`;
  linkIndicator.style.marginTop = 'auto';
  linkIndicator.style.color = 'var(--text-primary)';
  linkIndicator.style.fontSize = '0.9rem';
  linkIndicator.style.fontWeight = 'bold';
  linkIndicator.style.cursor = 'pointer';
  linkIndicator.style.display = 'inline-block';
  linkIndicator.style.width = 'fit-content';
  linkIndicator.style.paddingBottom = '4px';
  linkIndicator.style.transition = 'all 0.3s ease';
  linkIndicator.style.textDecoration = 'none';
  linkIndicator.onclick = (e) => { e.preventDefault(); e.stopPropagation(); openPreviewModal(project.link, titleText); };
  card.appendChild(title);
  card.appendChild(desc);
  card.appendChild(tags);
  card.appendChild(linkIndicator);
  card.onmouseenter = () => { title.style.color = '#8a2be2'; };
  card.onmouseleave = () => { title.style.color = ''; };
  return card;
}
