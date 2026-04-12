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

      // Swap content
      app.innerHTML = '';
      app.appendChild(fragment);

      // Instantly restore scroll position
      window.scrollTo(0, scrollPos);

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
