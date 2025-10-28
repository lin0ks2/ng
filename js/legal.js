import { pageTemplate } from './page-template.js';

export const Legal = {
  open(page = 'terms') {
    const app = document.getElementById('app');
    app.innerHTML = '';

    const pages = {
      terms: './terms.ru.html',
      privacy: './privacy.ru.html',
      impressum: './impressum.ru.html'
    };

    fetch(pages[page])
      .then(r => r.text())
      .then(html => {
        const content = `
          <nav class="legal-nav top">
            <button data-page="terms">Условия</button>
            <button data-page="privacy">Конфиденциальность</button>
            <button data-page="impressum">Импрессум</button>
          </nav>

          <div class="legal-content">${html}</div>

          <nav class="legal-nav bottom">
            <button class="page-close-btn">Закрыть</button>
          </nav>
        `;

        app.appendChild(pageTemplate({
          title: 'Юридическая информация',
          content,
          backAction: () => app.innerHTML = ''
        }));

        app.querySelectorAll('.legal-nav.top button[data-page]').forEach(btn => {
          btn.addEventListener('click', () => {
            this.open(btn.dataset.page);
          });
        });

        const closeBtn = app.querySelector('.legal-nav.bottom .page-close-btn');
        if (closeBtn) closeBtn.addEventListener('click', () => app.innerHTML = '');
      });
  }
};
