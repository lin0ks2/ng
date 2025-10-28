import { pageTemplate } from './page-template.js';

export const Donate = {
  open() {
    const content = `
      <p class="note-top">💡 Поддержка проекта помогает нам развиваться, улучшать качество обучения и оставаться без рекламы.</p>

      <div class="donate-blocks">
        <button class="donate-btn mono" onclick="window.open('https://send.monobank.ua/jar/XXXXXXX')">💳 Поддержать через Monobank</button>
        <button class="donate-btn paypal" onclick="window.open('https://paypal.me/yourpaypal')">🌍 Поддержать через PayPal</button>
      </div>

      <hr class="donate-sep">
      <p class="note-bottom">⚠️ Донаты не являются покупкой и не дают дополнительных функций. Это добровольная поддержка проекта ❤️</p>
    `;

    const app = document.getElementById('app');
    app.innerHTML = '';
    app.appendChild(pageTemplate({
      title: 'Поддержите проект',
      content,
      backAction: () => app.innerHTML = ''
    }));
  }
};
