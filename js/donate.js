// js/donate.js
// Экран «Поддержать проект» — лист между шапкой и футером (как legal).

(function (root) {
  const MONO_JAR_ID = '56HNLifwyr';                // Monobank Jar
  const PAYPAL_BUTTON_ID = 'KFBR8BW5ZZTQ4';        // PayPal hosted button

  const URL_MONO   = `https://send.monobank.ua/jar/${MONO_JAR_ID}`;
  const URL_PAYPAL = `https://www.paypal.com/donate/?hosted_button_id=${PAYPAL_BUTTON_ID}`;

  let sheet, content, closeBtn, styleTag;

  function gaEvent(action, label){
    try { window.gtag && window.gtag('event', action, { event_category:'donate', event_label: label }); } catch(_){}
  }

  function ensureSheet(){
    if (sheet) return;

    const css = `
      .donate-sheet{
        position:fixed; left:0; right:0;
        top:var(--header-h-actual); bottom:var(--footer-h-actual);
        background:#fff; z-index:1200; display:none;
        box-shadow:none; border:0; display:flex; flex-direction:column;
        font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;
      }
      .donate-top{
        display:flex; align-items:center; justify-content:space-between;
        padding:10px 12px; border-bottom:1px solid #e5e7eb;
      }
      .donate-title{ font-weight:700; font-size:18px; }
      .donate-close{
        background:transparent; border:0; font-size:20px; cursor:pointer; color:#333;
        -webkit-appearance:none; appearance:none; outline:none;
      }
      .donate-content{
        position:relative; flex:1 1 auto; overflow:auto; -webkit-overflow-scrolling:touch;
        padding:14px 12px 20px; color:#111;
      }
      .donate-card{
        border:1px solid #eef1f4; border-radius:14px; padding:16px; background:#fff;
        margin:0 0 14px;
      }
      .donate-card h3{ margin:0 0 10px; font-size:16px; line-height:1.35; }
      .donate-cta{
        display:inline-flex; align-items:center; justify-content:center;
        padding:12px 16px; border-radius:12px; font-weight:600; cursor:pointer;
        background:#fff; color:#111; text-decoration:none; border:2px solid;
      }
      .donate-cta--mono   { border-color:#f7c948; }     /* жёлтая обводка как на старом скрине */
      .donate-cta--paypal { border-color:#0b57d0; }     /* синий PayPal */
      .donate-cta:active{ transform:scale(.98); }
      .donate-cta span{ white-space:nowrap; }

      .donate-note{
        display:flex; gap:10px; align-items:flex-start;
        border-top:1px solid #e5e7eb; margin-top:10px; padding-top:12px;
        color:#374151; line-height:1.5;
      }
      .donate-note .emoji{ font-size:20px; line-height:1; }
    `;
    styleTag = document.createElement('style');
    styleTag.id = 'donate-sheet-styles';
    styleTag.textContent = css;
    document.head.appendChild(styleTag);

    sheet = document.createElement('section');
    sheet.className = 'donate-sheet';
    sheet.setAttribute('role','dialog');
    sheet.setAttribute('aria-label','Поддержать проект');

    const top = document.createElement('div');
    top.className = 'donate-top';
    top.innerHTML = `
      <div class="donate-title">Поддержать проект</div>
      <button class="donate-close" aria-label="Закрыть">✕</button>
    `;
    closeBtn = top.querySelector('.donate-close');

    content = document.createElement('div');
    content.className = 'donate-content';
    content.innerHTML = `
      <div class="donate-card">
        <h3>Поддержать через Monobank</h3>
        <a class="donate-cta donate-cta--mono" href="${URL_MONO}" target="_blank" rel="noopener" data-dc="mono">
          <span>Открыть Monobank</span>
        </a>
      </div>

      <div class="donate-card">
        <h3>Поддержать через PayPal</h3>
        <a class="donate-cta donate-cta--paypal" href="${URL_PAYPAL}" target="_blank" rel="noopener" data-dc="paypal">
          <span>Открыть PayPal</span>
        </a>
      </div>

      <div class="donate-note">
        <div class="emoji">⚖️</div>
        <div>Донат является добровольным пожертвованием и не является оплатой товаров или услуг.</div>
      </div>
    `;

    sheet.appendChild(top);
    sheet.appendChild(content);
    document.body.appendChild(sheet);

    // GA4 трекинг кликов
    content.addEventListener('click', (e)=>{
      const link = e.target.closest('[data-dc]');
      if (link){
        const kind = link.getAttribute('data-dc');
        gaEvent('click', kind);
      }
    });

    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', (e)=>{
      if (sheet.style.display !== 'none' && e.key === 'Escape') close();
    }, {capture:true});
  }

  function open(){
    ensureSheet();
    // если бургер открыт — закрываем, чтобы не перекрывал клики
    if (document.body.classList.contains('menu-open')) {
      document.body.classList.remove('menu-open');
      document.querySelector('.oc-root')?.setAttribute('aria-hidden','true');
    }
    sheet.style.display = 'flex';
    gaEvent('open','sheet');
  }

  function close(){
    if (!sheet) return;
    sheet.style.display = 'none';
    gaEvent('close','sheet');
  }

  // Экспорт в глобал, чтобы можно было вызвать без импортов
  root.Donate = { open, close };

})(window);
