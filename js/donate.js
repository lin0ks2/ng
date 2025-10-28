// js/donate.js — Экран «Поддержать проект» с iOS slide-up + fade и мягкими CTA

(function (root) {
  const MONO_JAR_ID = '56HNLifwyr';
  const PAYPAL_BUTTON_ID = 'KFBR8BW5ZZTQ4';

  const URL_MONO   = `https://send.monobank.ua/jar/${MONO_JAR_ID}`;
  const URL_PAYPAL = `https://www.paypal.com/donate/?hosted_button_id=${PAYPAL_BUTTON_ID}`;

  let sheet, scroller, styleTag;

  function gaEvent(action, label){
    try { window.gtag && window.gtag('event', action, { event_category:'donate', event_label: label }); } catch(_){}
  }

  function ensureSheet(){
    if (sheet) return;

    const css = `
      .donate-sheet{
        position:fixed; left:0; right:0;
        top:var(--header-h-actual); bottom:var(--footer-h-actual);
        background:#fff; z-index:1200;
        display:flex; flex-direction:column;
        font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;
      }
      /* mm-sheet — анимация (см. tokens.css) */

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
        display:flex; flex-direction:column;
      }

      .donate-note{
        flex:0 0 auto;
        border-bottom:1px solid #e5e7eb;
        padding:12px 10px;
        color:#555; line-height:1.5; font-size:13px; font-weight:500; opacity:.95;
        display:flex; align-items:center; justify-content:center; gap:8px;
        text-align:center; background:#fff;
        max-width:480px; margin:0 auto 14px;
      }
      .donate-note .emoji{ font-size:18px; line-height:1; }

      .donate-section{
        background:#fafbfc; border:1px solid #eef1f4;
        border-radius:12px;
        padding:16px;
        margin:16px 0;
      }
      .donate-section h3{
        margin:0 0 12px; font-size:16px; line-height:1.35; text-align:center; font-weight:700;
      }

      .donate-cta-wrap{ text-align:center; }
      .donate-cta{
        display:inline-flex; align-items:center; justify-content:center;
        padding:12px 16px; border-radius:12px; font-weight:600; cursor:pointer;
        background:#fff; color:#111; text-decoration:none; border:2px solid;
        min-width:240px;
        transform:translateZ(0); transition:transform 120ms var(--ease-ios), filter 200ms ease, box-shadow 160ms var(--ease-ios);
      }
      .donate-cta:active{ transform:scale(.98); }
      .donate-cta--mono   { border-color:#f7c948; }
      .donate-cta--paypal { border-color:#0b57d0; }
      @media (hover:hover){
        .donate-cta:hover{ filter:brightness(1.02); box-shadow:0 2px 10px rgba(31,42,55,.06); }
      }

      .donate-message{
        background:#f9fcff; border:1px solid #e2f2ff;
        border-radius:10px;
        padding:14px 16px;
        margin:20px auto 0;
        max-width:520px;
        text-align:center;
        color:#333; font-size:14px; line-height:1.5;
      }
      .donate-message::before{
        content:"✨"; display:block; font-size:20px; margin-bottom:6px;
      }
    `;
    styleTag = document.createElement('style');
    styleTag.id = 'donate-sheet-styles';
    styleTag.textContent = css;
    document.head.appendChild(styleTag);

    sheet = document.createElement('section');
    sheet.className = 'donate-sheet mm-sheet';          // ← общий класс анимации
    sheet.setAttribute('role','dialog');
    sheet.setAttribute('aria-label','Поддержать проект');
    sheet.style.display = 'none';

    const top = document.createElement('div');
    top.className = 'donate-top';
    top.innerHTML = `
      <div class="donate-title">Поддержать проект</div>
      <button class="donate-close" aria-label="Закрыть">✕</button>
    `;
    const closeBtn = top.querySelector('.donate-close');

    scroller = document.createElement('div');
    scroller.className = 'donate-content';
    scroller.innerHTML = `
      <div class="donate-note">
        <div class="emoji">⚖️</div>
        <div>Ваше пожертвование является добровольным и не является оплатой товаров или услуг.</div>
      </div>

      <section class="donate-section">
        <h3>Поддержать через Monobank</h3>
        <div class="donate-cta-wrap">
          <a class="donate-cta donate-cta--mono" href="${URL_MONO}" target="_blank" rel="noopener" data-dc="mono">Открыть Monobank</a>
        </div>
      </section>

      <section class="donate-section">
        <h3>Поддержать через PayPal</h3>
        <div class="donate-cta-wrap">
          <a class="donate-cta donate-cta--paypal" href="${URL_PAYPAL}" target="_blank" rel="noopener" data-dc="paypal">Открыть PayPal</a>
        </div>
      </section>

      <div class="donate-message">
        Каждый донат помогает нам развивать MOYAMOVA — добавлять новые функции и словари,
        улучшать обучение и сохранять приложение свободным от рекламы. Спасибо за вашу поддержку!
      </div>
    `;

    sheet.appendChild(top);
    sheet.appendChild(scroller);
    document.body.appendChild(sheet);

    // GA4 клики
    scroller.addEventListener('click', (e)=>{
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

    // закрыть бургер, если он открыт
    if (document.body.classList.contains('menu-open')) {
      document.body.classList.remove('menu-open');
      document.querySelector('.oc-root')?.setAttribute('aria-hidden','true');
    }

    sheet.style.display = 'flex';
    requestAnimationFrame(()=>{
      sheet.classList.add('is-open');   // плавное появление
    });

    gaEvent('open','sheet');
  }

  function close(){
    if (!sheet || sheet.style.display === 'none') return;
    sheet.classList.remove('is-open');
    const onEnd = (e)=>{
      if (e && e.target !== sheet) return;
      sheet.style.display = 'none';
      sheet.removeEventListener('transitionend', onEnd);
    };
    sheet.addEventListener('transitionend', onEnd);
    setTimeout(onEnd, 260); // фолбек
    gaEvent('close','sheet');
  }

  root.Donate = { open, close };

})(window);
