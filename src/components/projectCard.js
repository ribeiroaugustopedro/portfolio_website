import { openPreviewModal } from './previewModal.js';
import { getTagStyle } from '../utils/tagColors.js';

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
  title.style.textAlign = 'center';
  title.style.width = '100%'; // Ensure it takes full width for centering
  const desc = document.createElement('p');
  desc.textContent = descText;
  desc.style.fontSize = '0.95rem';
  desc.style.color = 'var(--text-secondary)';
  desc.style.marginBottom = '20px';
  desc.style.lineHeight = '1.6';
  desc.style.textAlign = 'justify';
  const tags = document.createElement('div');
  tags.style.display = 'flex';
  tags.style.flexWrap = 'wrap';
  tags.style.gap = '8px';
  tags.style.marginBottom = '20px';

  project.tags.forEach(tag => {
    const span = document.createElement('span');
    span.textContent = tag;
    const style = getTagStyle(tag);
    Object.assign(span.style, {
      fontSize: style.fontSize,
      padding: style.padding,
      borderRadius: style.borderRadius,
      border: style.border,
      color: style.color,
      background: style.background,
      fontFamily: style.fontFamily,
      fontWeight: style.fontWeight
    });
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
  linkIndicator.onclick = (e) => { 
    e.preventDefault(); 
    e.stopPropagation(); 
    if (project.link === '#catalog') {
      if (window.openIDE) window.openIDE('catalog', true, window.pageYOffset);
    } else if (project.link === '#ide') {
      if (window.openIDE) window.openIDE('explorer', true, window.pageYOffset);
    } else {
      openPreviewModal(project.link, titleText); 
    }
  };
  card.appendChild(title);
  card.appendChild(desc);
  card.appendChild(tags);
  card.appendChild(linkIndicator);
  card.onmouseenter = () => { /* Logic handled by CSS */ };
  card.onmouseleave = () => { /* Logic handled by CSS */ };
  return card;
}
