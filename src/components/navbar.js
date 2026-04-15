import { renderDynamicName } from './dynamicName.js';

export function renderNavbar(lang, translations, customLinks = null, onLangChange = null) {
  const nav = document.createElement('nav');
  nav.style.position = 'fixed';
  nav.style.top = '0';
  nav.style.width = '100%';
  nav.style.display = 'flex';
  nav.style.justifyContent = 'space-between';
  nav.style.alignItems = 'center';
  nav.style.zIndex = '100';
  nav.style.backgroundColor = 'var(--nav-bg)';
  nav.style.backdropFilter = 'blur(10px)';

  const leftContainer = document.createElement('div');
  leftContainer.style.display = 'flex';
  leftContainer.style.alignItems = 'center';
  leftContainer.style.gap = '20px';

  const logoContainer = renderDynamicName('PEDRO AUGUSTO RIBEIRO', '1.2rem');
  leftContainer.appendChild(logoContainer);


  // Theme Toggle Button
  const themeToggle = document.createElement('button');
  themeToggle.id = 'theme-toggle';
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme === 'light' ? 'light' : 'dark');
  if (savedTheme === 'dark') document.documentElement.removeAttribute('data-theme');

  const sunIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
  const moonIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
  
  const currentTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  themeToggle.innerHTML = currentTheme === 'light' ? sunIcon : moonIcon;
  
  themeToggle.style.color = 'var(--text-primary)';
  themeToggle.style.width = '40px';
  themeToggle.style.height = '40px';
  themeToggle.style.display = 'flex';
  themeToggle.style.alignItems = 'center';
  themeToggle.style.justifyContent = 'center';
  themeToggle.style.borderRadius = '50%';
  themeToggle.style.backgroundColor = 'transparent';
  themeToggle.style.border = 'none';
  themeToggle.style.cursor = 'pointer';
  themeToggle.style.transition = 'all 0.3s ease';
  themeToggle.title = translations[lang].navbar.themeTooltip;

  themeToggle.addEventListener('mouseenter', () => {
    themeToggle.style.background = 'linear-gradient(90deg, rgba(255, 0, 0, 0.1), rgba(0, 255, 0, 0.1), rgba(0, 0, 255, 0.1))';
    themeToggle.style.backgroundSize = '200% 200%';
    themeToggle.style.animation = 'rainbowSlide 2s linear infinite';
    themeToggle.style.transform = 'scale(1.1)';
  });
  themeToggle.addEventListener('mouseleave', () => {
    themeToggle.style.background = 'transparent';
    themeToggle.style.transform = 'scale(1)';
  });

  themeToggle.addEventListener('click', () => {
    // Disable transitions temporarily for instant theme switch
    document.documentElement.classList.add('no-transition');
    
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (isLight) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'dark');
      themeToggle.innerHTML = moonIcon;
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
      themeToggle.innerHTML = sunIcon;
    }

    // Force a reflow to ensure the theme change is applied without transition
    window.getComputedStyle(document.documentElement).opacity;

    // Re-enable transitions after a tiny delay
    setTimeout(() => {
      document.documentElement.classList.remove('no-transition');
    }, 10);
  });

  leftContainer.appendChild(themeToggle);

  // Language Toggle Button (Stylized like the previous theme button)
  const langToggle = document.createElement('button');
  const currentLang = localStorage.getItem('lang') || 'pt';
  langToggle.id = 'lang-toggle';
  langToggle.innerHTML = currentLang === 'pt' ? '<span style="font-weight:800; font-size: 0.85rem;">PT</span>' : '<span style="font-weight:800; font-size: 0.85rem;">EN</span>';
  
  langToggle.style.color = 'var(--text-primary)';
  langToggle.style.width = '40px';
  langToggle.style.height = '40px';
  langToggle.style.display = 'flex';
  langToggle.style.alignItems = 'center';
  langToggle.style.justifyContent = 'center';
  langToggle.style.borderRadius = '50%';
  langToggle.style.backgroundColor = 'transparent';
  langToggle.style.border = 'none';
  langToggle.style.cursor = 'pointer';
  langToggle.style.transition = 'all 0.3s ease';
  langToggle.style.fontFamily = 'var(--font-mono)';
  langToggle.title = translations[lang].navbar.langTooltip;

  langToggle.addEventListener('mouseenter', () => {
    langToggle.style.background = 'linear-gradient(90deg, rgba(255, 0, 0, 0.1), rgba(0, 255, 0, 0.1), rgba(0, 0, 255, 0.1))';
    langToggle.style.backgroundSize = '200% 200%';
    langToggle.style.animation = 'rainbowSlide 2s linear infinite';
    langToggle.style.transform = 'scale(1.1)';
  });
  langToggle.addEventListener('mouseleave', () => {
    langToggle.style.background = 'transparent';
    langToggle.style.transform = 'scale(1)';
  });

  langToggle.addEventListener('click', (e) => {
    e.preventDefault();
    const curLang = localStorage.getItem('lang') || 'pt';
    const newLang = curLang === 'pt' ? 'en' : 'pt';
    if (onLangChange) onLangChange(newLang);
    else {
      localStorage.setItem('lang', newLang);
      window.location.reload();
    }
  });

  leftContainer.appendChild(langToggle);

  nav.appendChild(leftContainer);

  const ul = document.createElement('ul');
  ul.className = 'nav-menu'; // Added class for mobile styles
  ul.style.display = 'flex';
  ul.style.gap = '30px';
  ul.style.listStyle = 'none';

  const links = customLinks || [
    { name: translations[lang].navbar.home || 'Home', id: 'hero' },
    { name: translations[lang].navbar.projects, id: 'projects' },
    { name: translations[lang].navbar.about, id: 'resume' },
    { name: translations[lang].navbar.playground, id: 'playground' },
  ];

  links.forEach(link => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#${link.id}`;
    a.textContent = link.name;
    a.style.color = 'var(--text-primary)';
    a.style.fontSize = '0.9rem';
    a.style.fontFamily = 'var(--font-mono)';

    // Close menu on link click (for mobile)
    a.addEventListener('click', () => {
      ul.classList.remove('active');
      hamburger.classList.remove('active');
    });

    li.appendChild(a);
    ul.appendChild(li);
  });

  // Hamburger Button for Mobile
  const hamburger = document.createElement('button');
  hamburger.className = 'hamburger';
  hamburger.innerHTML = '<span></span><span></span><span></span>';
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    ul.classList.toggle('active');
  });

  nav.appendChild(ul);
  nav.appendChild(hamburger);

  // Static padding to prevent resizing annoyance
  const getNavPadding = () => window.innerWidth <= 768 ? '15px 20px' : '15px 40px';
  nav.style.padding = getNavPadding();

  // Scroll Dynamics - Background only, no size change
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      nav.style.backgroundColor = 'var(--nav-bg-scroll)';
      nav.style.boxShadow = '0 10px 30px -10px rgba(0,0,0,0.3)';
      nav.style.backdropFilter = 'blur(15px)';
    } else {
      nav.style.backgroundColor = 'var(--nav-bg)';
      nav.style.boxShadow = 'none';
      nav.style.backdropFilter = 'blur(10px)';
    }
  });

  const updateNavLayout = () => {
    nav.style.padding = getNavPadding();
  };
  window.addEventListener('resize', updateNavLayout);

  return nav;
}
