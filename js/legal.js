// js/legal.js — Лист «Юридическая информация» со стильным iOS-появлением

(function (root) {
  const PAGES = {
    terms:     './legal/terms.ru.html',
    privacy:   './legal/privacy.ru.html',
    impressum: './legal/impressum.ru.html',
  };

  let sheet, scroller, styleTag, navEl;

  function ensureSheet(){
    if (sheet) return;

    const css = `
      .legal-sheet{
        position:fixed; left:0; right:0;
        top:var(--header-h-actual); bottom:var(--footer-h-actual);
        background:#fff; z-index:1200;
        display:flex; flex-direction:column;
        font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;
      }
      /* iOS slide-up + fade: базовый класс берём из tokens.css */
      .legal-sheet.mm-sheet{ /* просто для ясности, объединяем роли */ }

      .legal-top{
        display:flex; align-items:center; justify-content:space-between;
        padding:10px 12px; border-bottom:1px solid #e5e7eb;
      }
      .legal-title{ font-weight:700; font-size:18px; }
      .legal-close{
        background:transparent; border:0; font-size:20px; cursor:pointer; color:#333;
        -webkit-appearance:none; appearance:none; outline:none;
      }

      .legal-tabs{
        display:flex; gap:10px; align-items:center; justify-content:center;
        padding:10px 12px; border-bottom:1px solid #eef1f4; background:#fafbfc;
        position:sticky; top:0; z-index:1;
      }
      .legal-tab{
        background:#fff; border:1px solid #e5e7eb; border-radius:999px;
        padding:8px 12px; font-size:14px; cursor:pointer;
        -webkit-appearance:none; appearance:none; outline:none;
        transition:background-color .15s ease, border-color .15s ease, transform 120ms var(--ease-ios);
      }
      .legal-tab:active{ transform:scale(.98); }
      .legal-tab.active{ border-color:var(--brand); }

      .legal-content{
        position:relative; flex:1 1 auto; overflow:auto; -webkit-overflow-scrolling:touch;
        padding:12px; color:#111;
      }
      .legal-content > article{
        max-width:720px; margin:0 auto; line-height:1.65; font-size:15px; color:#1f2937;
      }
      .legal-content h1,.legal-content h2{ line-height:1.25; }
      .legal-content h1{ font-size:22px; margin:6px 0 12px; }
      .legal-content h2{ font-size:18px; margin:18px 0 8px; }
      .legal-content p, .legal-content li{ margin:8px 0; }
    `;
    styleTag = document.createElement('style');
    styleTag.id = 'legal-sheet-styles';
    styleTag.textContent = css;
    document.head.appendChild(styleTag);

    sheet = document.createElement('section');
    sheet.className = 'legal-sheet mm-sheet';          // ← общий класс анимации
    sheet.setAttribute('role','dialog');
    sheet.setAttribute('aria-label','Юридическая информация');
    sheet.style.display = 'none';

    const top = document.createElement('div');
    top.className = 'legal-top';
    top.innerHTML = `
      <div class="legal-title">Юридическая информация</div>
      <button class="legal-close" aria-label="Закрыть">✕</button>
    `;
    const closeBtn = top.querySelector('.legal-close');

    navEl = document.createElement('div');
    navEl.className = 'legal-tabs';
    navEl.innerHTML = `
      <button class="legal-tab" data-page="terms">Условия использования</button>
      <button class="legal-tab" data-page="privacy">Политика конфиденциальности</button>
      <button class="legal-tab" data-page="impressum">Юридические сведения</button>
    `;

    const contentWrap = document.createElement('div');
    contentWrap.className = 'legal-content';
    scroller = contentWrap;

    sheet.appendChild(top);
    sheet.appendChild(navEl);
    sheet.appendChild(contentWrap);
    document.body.appendChild(sheet);

    closeBtn.addEventListener('click', close);

    navEl.addEventListener('click', async (e)=>{
      const btn = e.target.closest('.legal-tab');
      if (!btn) return;
      const page = btn.dataset.page;
      await loadPage(page);
      navEl.querySelectorAll('.legal-tab').forEach(b=>b.classList.toggle('active', b===btn));
    });
  }

  async function loadPage(key){
    const url = PAGES[key] || PAGES.terms;
    try{
      const res = await fetch(url, { cache:'no-store' });
      const html = await res.text();
      scroller.innerHTML = `<article>${html}</article>`;
      scroller.scrollTop = 0;
    }catch{
      scroller.innerHTML = `<article><p>Не удалось загрузить страницу. Попробуйте позже.</p></article>`;
    }
  }

  function open(initial='terms'){
    ensureSheet();

    // если бургер открыт — закрываем
    if (document.body.classList.contains('menu-open')) {
      document.body.classList.remove('menu-open');
      document.querySelector('.oc-root')?.setAttribute('aria-hidden','true');
    }

    sheet.style.display = 'flex';
    // плавное открытие
    requestAnimationFrame(()=>{
      sheet.classList.add('is-open');  // ← анимация из tokens.css
    });

    // выбрать вкладку и загрузить контент
    const tabBtn = navEl.querySelector(`[data-page="${initial}"]`) || navEl.querySelector('.legal-tab');
    navEl.querySelectorAll('.legal-tab').forEach(b=>b.classList.toggle('active', b===tabBtn));
    loadPage(initial);
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
    // защитный таймер на случай отсутствия transitionend
    setTimeout(onEnd, 260);
  }

  root.Legal = { open, close };

})(window);
