export function renderHero(lang, translations) {
  const section = document.createElement('section');
  section.className = 'section container reveal';
  section.id = 'hero';
  section.style.textAlign = 'center';
  section.style.height = '100vh';
  section.style.display = 'flex';
  section.style.flexDirection = 'column';
  section.style.justifyContent = 'center';
  section.style.alignItems = 'center';

  const content = document.createElement('div');
  content.className = 'stagger-reveal';

  const h1 = document.createElement('h1');
  h1.innerHTML = `${translations[lang].hero.titlePre}<br>${translations[lang].hero.titleHighlight}`;
  h1.style.fontSize = 'clamp(2rem, 6vw, 3.5rem)';
  h1.style.lineHeight = '1.1';
  h1.style.marginBottom = '24px';

  const p = document.createElement('p');
  p.innerHTML = translations[lang].hero.description;
  p.style.fontSize = '1.2rem';
  p.style.color = 'var(--text-secondary)';
  p.style.maxWidth = '700px';
  p.style.margin = '0 auto 40px auto';

  // Contact Content embedded in Hero
  const contactContainer = document.createElement('div');
  contactContainer.id = 'contact';
  contactContainer.style.marginTop = 'auto'; // Push to bottom
  contactContainer.style.paddingBottom = '40px';
  contactContainer.style.width = '100%';

  const contactTitle = document.createElement('p');
  contactTitle.textContent = translations[lang].hero.contactTitle;
  contactTitle.style.fontSize = '1.1rem';
  contactTitle.style.fontWeight = 'bold';
  contactTitle.style.marginBottom = '16px';
  contactTitle.style.color = 'var(--text-primary)';

  const btnContainer = document.createElement('div');
  btnContainer.style.display = 'flex';
  btnContainer.style.justifyContent = 'center';
  btnContainer.style.gap = '20px';
  btnContainer.style.flexWrap = 'wrap';

  const contacts = [
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/pedro-augusto-ribeiro',
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"></path><circle cx="4" cy="4" r="2"></circle></svg>'
    },
    {
      label: 'GitHub',
      href: 'https://github.com/ribeiroaugustopedro',
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>'
    },
    {
      label: 'Email',
      href: 'mailto:ribeiroaugustopedro@gmail.com',
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>'
    }
  ];

  contacts.forEach(contact => {
    const btn = document.createElement('a');
    btn.href = contact.href;
    btn.target = '_blank';
    btn.className = 'rainbow-border';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.gap = '12px';
    btn.style.padding = '10px 20px';
    btn.style.color = 'var(--text-primary)';
    btn.style.textDecoration = 'none';
    btn.style.borderRadius = '4px';
    btn.style.fontSize = '0.9rem';
    btn.style.transition = 'all 0.3s ease';
    btn.style.backgroundColor = 'rgba(255, 255, 255, 0.03)'; // Slight background for visibility

    btn.innerHTML = `${contact.icon} <span>${contact.label}</span>`;

    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'linear-gradient(90deg, rgba(255, 0, 0, 0.1), rgba(0, 255, 0, 0.1), rgba(0, 0, 255, 0.1))';
      btn.style.backgroundSize = '200% 200%';
      btn.style.animation = 'rainbowSlide 2s linear infinite';
      btn.style.transform = 'translateY(-2px)';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'rgba(255, 255, 255, 0.03)';
      btn.style.transform = 'translateY(0)';
    });

    btnContainer.appendChild(btn);
  });

  contactContainer.appendChild(contactTitle);
  contactContainer.appendChild(btnContainer);

  // Layout logic
  section.style.justifyContent = 'center'; 
  section.style.padding = '0'; // Let spacers handle it

  content.appendChild(h1);
  content.appendChild(p);

  // Grouped CTA Cluster
  const ctaCluster = document.createElement('div');
  ctaCluster.className = 'stagger-reveal';
  ctaCluster.style.display = 'flex';
  ctaCluster.style.flexDirection = 'column';
  ctaCluster.style.alignItems = 'center';
  ctaCluster.style.gap = '100px'; // Even more gap as requested
  ctaCluster.style.marginTop = '40px';

  // Primary Buttons Row (Restored to boxed btn-rainbow style)
  const primaryRow = document.createElement('div');
  primaryRow.style.display = 'flex';
  primaryRow.style.gap = '20px';
  primaryRow.style.justifyContent = 'center';

  const cta = document.createElement('a');
  cta.href = '#highlights';
  cta.textContent = translations[lang].hero.ctaWork;
  cta.className = 'btn-rainbow';
  cta.style.zIndex = '1';

  const ctaNetwork = document.createElement('a');
  ctaNetwork.href = 'https://networkplanner-fb6fzcdfuz9nvicgfinfj2.streamlit.app/';
  ctaNetwork.target = '_blank';
  ctaNetwork.textContent = translations[lang].hero.ctaNetwork;
  ctaNetwork.className = 'btn-rainbow';
  ctaNetwork.style.filter = 'hue-rotate(90deg)'; 
  ctaNetwork.style.zIndex = '1';

  primaryRow.appendChild(cta);
  primaryRow.appendChild(ctaPlayground);
  primaryRow.appendChild(ctaNetwork);

  // Secondary Resume Button
  const resumeBtn = document.createElement('a');
  resumeBtn.href = 'cv_pedro_augusto_ribeiro_en-us.pdf';
  resumeBtn.download = 'cv_pedro_augusto_ribeiro_en-us.pdf';
  resumeBtn.className = 'btn-outline';
  resumeBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 12px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
    <span>${translations[lang].resume.downloadResume}</span>
  `;

  ctaCluster.appendChild(primaryRow);
  ctaCluster.appendChild(resumeBtn);
  content.appendChild(ctaCluster);

  // Spacers for balanced diagramming
  const spacerTop = document.createElement('div');
  spacerTop.style.flex = '1.5'; // More weight on top to push content lower
  section.appendChild(spacerTop);

  section.appendChild(content);

  const spacerBottom = document.createElement('div');
  spacerBottom.style.flex = '0.5'; // Significantly less weight to pull contact UP
  section.appendChild(spacerBottom);

  section.appendChild(contactContainer);

  return section;
}
