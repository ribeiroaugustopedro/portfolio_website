import { getTagStyle } from '../utils/tagColors.js';

export function renderResume(lang, translations) {
  const t = translations[lang].resume;
  const section = document.createElement('section');
  section.className = 'section container';
  section.id = 'resume';

  const h2 = document.createElement('h2');
  h2.textContent = t.title;
  h2.className = 'rainbow-title-center reveal';

  const content = document.createElement('div');
  content.className = 'resume-container reveal';

  const summaryBox = document.createElement('div');
  summaryBox.style.marginBottom = '48px';
  summaryBox.className = 'project-card reveal';

  const summaryTitle = document.createElement('h3');
  summaryTitle.textContent = t.summaryTitle;
  summaryTitle.style.fontSize = '1.2rem';
  summaryTitle.style.marginBottom = '12px';
  summaryTitle.style.transition = 'color 0.3s ease';

  const summaryText = document.createElement('p');
  summaryText.textContent = t.summary;
  summaryText.style.fontSize = '0.95rem';
  summaryText.style.color = 'var(--text-secondary)';
  summaryText.style.lineHeight = '1.6';
  summaryText.style.textAlign = 'justify';
  summaryText.style.marginBottom = '24px';

  const downloadLink = document.createElement('a');
  downloadLink.className = 'project-link-indicator';
  const resumeFile = lang === 'pt' ? 'cv_pedro_augusto_ribeiro_pt-br.pdf' : 'cv_pedro_augusto_ribeiro_en-us.pdf';
  downloadLink.href = `./${resumeFile}`;
  downloadLink.target = '_blank';
  downloadLink.innerHTML = `${t.downloadResume} &rarr;`;
  downloadLink.style.marginTop = 'auto';
  downloadLink.style.color = 'var(--text-primary)';
  downloadLink.style.fontSize = '0.9rem';
  downloadLink.style.fontWeight = 'bold';
  downloadLink.style.display = 'inline-block';
  downloadLink.style.width = 'fit-content';
  downloadLink.style.paddingBottom = '4px';
  downloadLink.style.transition = 'all 0.3s ease';
  downloadLink.style.textDecoration = 'none';

  summaryBox.appendChild(summaryTitle);
  summaryBox.appendChild(summaryText);
  summaryBox.appendChild(downloadLink);
  summaryBox.onmouseenter = () => { /* Handled by CSS */ };
  summaryBox.onmouseleave = () => { /* Handled by CSS */ };
  content.appendChild(summaryBox);

  const grid = document.createElement('div');
  grid.className = 'resume-grid';

  const leftCol = document.createElement('div');
  leftCol.className = 'resume-col';

  const expSection = document.createElement('div');
  expSection.innerHTML = `<h3 style="margin-bottom: 24px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">${t.experienceTitle}</h3>`;
  expSection.style.textAlign = 'left';

  t.experiences.forEach(job => {
    const item = document.createElement('div');
    item.className = 'resume-item';
    item.style.textAlign = 'left';
    const descriptionHTML = Array.isArray(job.description) 
      ? `<ul style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 10px; padding-left: 18px; text-align: justify;">${job.description.map(point => `<li style="margin-bottom: 6px; line-height: 1.5;">${point}</li>`).join('')}</ul>` 
      : `<p style="color: var(--text-secondary); font-size: 0.95rem; margin-top: 8px; text-align: justify;">${job.description}</p>`;
    item.innerHTML = `<h4>${job.role}</h4><span class="company">${job.company} | ${job.period}</span>${descriptionHTML}`;
    expSection.appendChild(item);
  });
  leftCol.appendChild(expSection);

  const rightCol = document.createElement('div');
  rightCol.className = 'resume-col';
  rightCol.style.display = 'flex';
  rightCol.style.flexDirection = 'column';
  rightCol.style.justifyContent = 'space-between';
  
  const skillsWrap = document.createElement('div');
  skillsWrap.style.textAlign = 'left';
  skillsWrap.innerHTML = `<h3 style="margin-bottom: 24px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">${t.skillsTitle}</h3>`;
  
  t.skillCategories.forEach(skillSet => {
    const group = document.createElement('div');
    group.className = 'skill-group';
    group.innerHTML = `<h4 style="font-size: 1rem; color: var(--text-primary); margin-bottom: 8px;">${skillSet.name}</h4>`;
    
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'tags';
    tagsContainer.style.justifyContent = 'flex-start';
    tagsContainer.style.display = 'flex';
    tagsContainer.style.flexWrap = 'wrap';
    tagsContainer.style.gap = '8px';
    tagsContainer.style.marginBottom = '16px';

    skillSet.items.forEach(skill => {
      const span = document.createElement('span');
      span.textContent = skill;
      const style = getTagStyle(skill);
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
      tagsContainer.appendChild(span);
    });

    group.appendChild(tagsContainer);
    skillsWrap.appendChild(group);
  });
  rightCol.appendChild(skillsWrap);

  const certSection = document.createElement('div');
  certSection.style.textAlign = 'left';
  certSection.innerHTML = `<h3 style="margin-bottom: 24px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">${t.certificationsTitle}</h3>`;
  const certList = document.createElement('ul');
  certList.style.listStyle = 'none';
  certList.style.padding = '0';

  t.certifications.forEach(cert => {
    const li = document.createElement('li');
    li.style.cssText = 'margin-bottom:12px;font-size:0.9rem;color:var(--text-secondary);display:flex;justify-content:flex-start;align-items:start;';
    li.innerHTML = `<span style="display: flex; align-items: center; margin-right: 10px; margin-top: 4px; color: var(--text-primary);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span><span style="line-height: 1.6; text-align: justify;">${cert}</span>`;
    certList.appendChild(li);
  });
  certSection.appendChild(certList);
  rightCol.appendChild(certSection);

  const eduSection = document.createElement('div');
  eduSection.style.textAlign = 'left';
  eduSection.innerHTML = `<h3 style="margin-bottom: 24px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">${t.educationTitle}</h3>`;
  
  t.education.forEach(edu => {
    const item = document.createElement('div');
    item.className = 'resume-item';
    item.style.textAlign = 'left';
    item.innerHTML = `<h4>${edu.degree}</h4><span class="company">${edu.school} | ${edu.period}</span>`;
    eduSection.appendChild(item);
  });
  rightCol.appendChild(eduSection);

  const langSection = document.createElement('div');
  langSection.style.textAlign = 'left';
  langSection.innerHTML = `<h3 style="margin-bottom: 24px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">${t.languagesTitle}</h3>`;
  const langList = document.createElement('ul');
  langList.style.listStyle = 'none';
  langList.style.padding = '0';

  t.languages.forEach(lang => {
    const parts = lang.split('|');
    const li = document.createElement('li');
    li.style.cssText = 'margin-bottom:12px;font-size:0.9rem;display:flex;justify-content:space-between;border-bottom:1px dashed var(--border-color);padding-bottom:4px;';
    li.innerHTML = `<span style="color: var(--text-primary); font-weight: 500;">${parts[0].trim()}</span><span style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-secondary);">${parts[1] ? parts[1].trim() : ''}</span>`;
    langList.appendChild(li);
  });
  langSection.appendChild(langList);
  rightCol.appendChild(langSection);

  grid.appendChild(leftCol);
  grid.appendChild(rightCol);
  content.appendChild(grid);
  section.appendChild(h2);
  section.appendChild(content);

  return section;
}
