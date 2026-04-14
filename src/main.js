import './style.css';
import './ide.css';
import { renderNavbar } from './components/navbar.js';
import { renderHero } from './sections/hero.js';
import { renderHighlights } from './sections/highlights.js';
import { renderProjects } from './sections/projects.js';
import { renderIDE } from './sections/playground.js';
import { renderResume } from './sections/resume.js';
import { renderFooter } from './components/footer.js';
import { renderBackToTop } from './components/backToTop.js';
import projectsData from './data/projects.json';
import { translations } from './data/translations.js';

document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  
  // Language initialization: respect previous choice or default to 'pt' for this user
  let currentLang = localStorage.getItem('lang') || 'pt';
  localStorage.setItem('lang', currentLang);

  let currentObserver = null;

  function initApp(lang) {
    try {
      // Save current scroll to prevent jump during re-rendering
      const scrollPos = window.scrollY;

      // Disconnect previous observer to prevent memory leaks
      if (currentObserver) currentObserver.disconnect();

      const links = [
        { name: translations[lang].navbar.home || 'Home', id: 'hero' },
        { name: translations[lang].navbar.projects, id: 'projects' },
        { name: translations[lang].navbar.about, id: 'resume' },
        { name: translations[lang].navbar.playground, id: 'playground' },
      ];

      const onLangChange = (newLang) => {
        localStorage.setItem('lang', newLang);
        initApp(newLang);
      };

      // Create a temporary fragment to build the structure offline
      const fragment = document.createDocumentFragment();
      fragment.appendChild(renderNavbar(lang, translations, links, onLangChange));
      
      const main = document.createElement('main');
      main.appendChild(renderHero(lang, translations));
      main.appendChild(renderProjects(projectsData, lang, translations));
      main.appendChild(renderResume(lang, translations));
      main.appendChild(renderIDE(lang, translations));
      fragment.appendChild(main);
      fragment.appendChild(renderFooter(lang, translations));

      // Swap content in-place to prevent scroll jumps (maintaining overall page height)
      const oldNav = app.querySelector('nav');
      const oldMain = app.querySelector('main');
      const oldFooter = app.querySelector('footer');

      const newNav = fragment.querySelector('nav');
      const newMain = fragment.querySelector('main');
      const newFooter = fragment.querySelector('footer');

      if (oldNav && newNav) app.replaceChild(newNav, oldNav);
      else app.appendChild(newNav);

      if (oldMain && newMain) app.replaceChild(newMain, oldMain);
      else app.appendChild(newMain);

      if (oldFooter && newFooter) app.replaceChild(newFooter, oldFooter);
      else app.appendChild(newFooter);

      // Instantly restore scroll position as a safety measure (wrapped in RAF for height stabilization)
      requestAnimationFrame(() => {
        window.scrollTo({ top: scrollPos, behavior: 'instant' });
      });

      // Re-initialize animations
      currentObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add('reveal-visible');
          else entry.target.classList.remove('reveal-visible');
        });
      }, { threshold: 0.1, rootMargin: '0px' });
      document.querySelectorAll('.reveal').forEach(el => currentObserver.observe(el));

    } catch (e) {
      console.error(e);
      app.innerHTML = `<div style="color:red;padding:20px;font-family:monospace;white-space:pre-wrap;background:#fff;"><h1>Error</h1><p>${e.toString()}</p></div>`;
    }
  }

  initApp(currentLang);
});
