import './style.css';
import './ide.css';
import { initBackground } from './three/backgroundScene.js';
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
  try {
    const app = document.getElementById('app');
    let lang = localStorage.getItem('lang') || 'en';
    const links = [
      { name: translations[lang].navbar.home || 'Home', id: 'hero' },
      { name: translations[lang].navbar.projects, id: 'projects' },
      { name: translations[lang].navbar.about, id: 'resume' },
      { name: translations[lang].navbar.playground, id: 'playground' },
    ];
    app.appendChild(renderNavbar(lang, translations, links));
    const main = document.createElement('main');
    main.appendChild(renderHero(lang, translations));
    main.appendChild(renderProjects(projectsData, lang, translations));
    main.appendChild(renderResume(lang, translations));
    main.appendChild(renderIDE(lang, translations));
    app.appendChild(main);
    app.appendChild(renderFooter(lang, translations));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
        } else {
          entry.target.classList.remove('reveal-visible');
        }
      });
    }, { threshold: 0.05, rootMargin: '0px' });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  } catch (e) {
    document.body.innerHTML = `<div style="color:red;padding:20px;font-family:monospace;white-space:pre-wrap;background:#fff;"><h1>Error</h1><p>${e.toString()}</p></div>`;
  }
});
