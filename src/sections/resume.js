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
  summaryBox.style.marginBottom = '48px'; // Back to original
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
  summaryText.style.height = 'auto';
  summaryText.style.minHeight = '145px'; // Standardized based on Portuguese content length
  summaryText.style.marginBottom = '24px';

  const downloadLink = document.createElement('a');
  downloadLink.className = 'project-link-indicator'; // Restored original class for hover effects
  const resumeFile = lang === 'pt' ? 'cv_pedro_augusto_ribeiro_pt-br.pdf' : 'cv_pedro_augusto_ribeiro_en-us.pdf';
  downloadLink.href = `./${resumeFile}`;
  downloadLink.target = '_blank';
  downloadLink.innerHTML = `${t.downloadResume} &rarr;`;
  
  // Reverting downloadLink styles to original state
  Object.assign(downloadLink.style, {
    marginTop: 'auto', color: 'var(--text-primary)', fontSize: '0.9rem',
    fontWeight: 'bold', display: 'inline-block', width: 'fit-content',
    paddingBottom: '4px', transition: 'all 0.3s ease', textDecoration: 'none'
  });

  summaryBox.appendChild(summaryTitle);
  summaryBox.appendChild(summaryText);
  summaryBox.appendChild(downloadLink);
  content.appendChild(summaryBox);

  const grid = document.createElement('div');
  grid.className = 'resume-grid';
  grid.style.alignItems = 'stretch';

  // --- Left Column (Experience) ---
  const leftCol = document.createElement('div');
  leftCol.className = 'resume-col';
  leftCol.style.display = 'flex';
  leftCol.style.flexDirection = 'column';

  const expHeader = document.createElement('h3');
  expHeader.innerHTML = t.experienceTitle;
  expHeader.style.cssText = 'margin-bottom: 24px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;';
  leftCol.appendChild(expHeader);

  const expList = document.createElement('div');
  expList.style.display = 'flex';
  expList.style.flexDirection = 'column';
  expList.style.justifyContent = 'flex-start';
  expList.style.gap = '40px'; // Compact standardized gap between jobs
  expList.style.flexGrow = '1';

  t.experiences.forEach((job) => {
    const item = document.createElement('div');
    item.className = 'resume-item';
    item.style.marginBottom = '0';
    
    const role = document.createElement('h4');
    role.textContent = job.role;
    role.style.marginBottom = '4px'; // Tightened
    role.style.color = 'var(--text-primary)';

    const company = document.createElement('span');
    company.className = 'company';
    company.textContent = `${job.company} | ${job.period}`;
    company.style.display = 'block';
    company.style.marginBottom = '12px'; // Tightened

    const descHTML = Array.isArray(job.description)
      ? `<ul style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 10px; padding-left: 18px; text-align: justify;">${job.description.map(p => `<li style="margin-bottom: 6px; line-height: 1.5;">${p}</li>`).join('')}</ul>`
      : `<p style="color: var(--text-secondary); font-size: 0.95rem; margin-top: 8px; text-align: justify;">${job.description}</p>`;
    
    item.innerHTML = role.outerHTML + company.outerHTML + descHTML;
    expList.appendChild(item);
  });
  leftCol.appendChild(expList);

  // --- Right Column (Distributed) ---
  const rightCol = document.createElement('div');
  rightCol.className = 'resume-col';
  rightCol.style.display = 'flex';
  rightCol.style.flexDirection = 'column';

  const rightHeader = document.createElement('h3');
  // Matching the Experience Title for total symmetry
  rightHeader.innerHTML = t.skillsTitle;
  rightHeader.style.cssText = 'margin-bottom: 24px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;';
  rightCol.appendChild(rightHeader);

  const rightItems = document.createElement('div');
  rightItems.style.display = 'flex';
  rightItems.style.flexDirection = 'column';
  rightItems.style.justifyContent = 'space-between';
  rightItems.style.flexGrow = '1';

  // 1. Skills
  const skillsWrap = document.createElement('div');
  t.skillCategories.forEach(cat => {
    const group = document.createElement('div');
    group.className = 'skill-group';
    group.style.marginBottom = '20px';
    group.innerHTML = `<h4 style="font-size: 1rem; color: var(--text-primary); margin-bottom: 8px;">${cat.name}</h4>`;
    const tagBox = document.createElement('div');
    tagBox.className = 'tags';
    tagBox.style.cssText = 'display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-start;';
    cat.items.forEach(skill => {
      const span = document.createElement('span');
      span.textContent = skill;
      const s = getTagStyle(skill);
      Object.assign(span.style, {
        fontSize: s.fontSize, padding: s.padding, borderRadius: s.borderRadius,
        border: s.border, color: s.color, background: s.background,
        fontFamily: s.fontFamily, fontWeight: s.fontWeight
      });
      tagBox.appendChild(span);
    });
    group.appendChild(tagBox);
    skillsWrap.appendChild(group);
  });

  // 2. Certifications
  const certSection = document.createElement('div');
  certSection.style.marginBottom = '32px';
  certSection.innerHTML = `<h4 style="margin-bottom: 16px; color: var(--text-primary); border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">${t.certificationsTitle}</h4>`;
  const cList = document.createElement('ul');
  cList.style.cssText = 'list-style: none; padding: 0;';
  t.certifications.forEach(c => {
    const li = document.createElement('li');
    li.style.cssText = 'margin-bottom: 12px; font-size: 0.9rem; color: var(--text-secondary); display: flex; align-items: start;';
    li.innerHTML = `<span style="color: var(--text-primary); margin-right: 10px; margin-top: 4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span><span style="line-height: 1.6; text-align: justify;">${c}</span>`;
    cList.appendChild(li);
  });
  certSection.appendChild(cList);

  // 3. Education
  const eduSection = document.createElement('div');
  eduSection.style.marginBottom = '32px';
  eduSection.innerHTML = `<h4 style="margin-bottom: 16px; color: var(--text-primary); border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">${t.educationTitle}</h4>`;
  
  t.education.forEach(e => {
    const item = document.createElement('div');
    item.className = 'resume-item';
    item.style.marginBottom = '16px';
    
    const degree = document.createElement('h4');
    degree.textContent = e.degree;
    degree.style.marginBottom = '4px';
    degree.style.color = 'var(--text-primary)';

    const school = document.createElement('span');
    school.className = 'company';
    school.textContent = `${e.school} | ${e.period}`;
    school.style.display = 'block';

    item.appendChild(degree);
    item.appendChild(school);
    eduSection.appendChild(item);
  });

  // 4. Languages
  const langSection = document.createElement('div');
  langSection.innerHTML = `<h4 style="margin-bottom: 16px; color: var(--text-primary); border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">${t.languagesTitle}</h4>`;
  
  const lList = document.createElement('ul');
  lList.style.cssText = 'list-style: none; padding: 0;';
  t.languages.forEach((l, idx) => {
    const pts = l.split('|');
    const li = document.createElement('li');
    const isL = idx === t.languages.length - 1;
    li.style.cssText = `margin-bottom:${isL ? '0' : '15px'}; font-size: 0.9rem; display: flex; justify-content: space-between; border-bottom: ${isL ? 'none' : '1px dashed var(--border-color)'}; padding-bottom: 4px;`;
    li.innerHTML = `<span style="color: var(--text-primary); font-weight: 800;">${pts[0].trim()}</span><span style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-secondary);">${pts[1] ? pts[1].trim() : ''}</span>`;
    lList.appendChild(li);
  });
  langSection.appendChild(lList);

  rightItems.appendChild(skillsWrap);
  rightItems.appendChild(certSection);
  rightItems.appendChild(eduSection);
  rightItems.appendChild(langSection);
  rightCol.appendChild(rightItems);

  grid.appendChild(leftCol);
  grid.appendChild(rightCol);
  content.appendChild(grid);
  section.appendChild(h2);
  section.appendChild(content);

  return section;
}
