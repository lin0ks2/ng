// js/legal.js
// Лист юридической информации между шапкой и футером.

export const Legal = (() => {
  const MAP = {
    terms:     './terms.ru.html',
    privacy:   './privacy.ru.html',
    impressum: './impressum.ru.html'
  };

  let sheet, content, tabs, closeBtn, styleTag;

  function ensureSheet(){
    if (sheet) return;

    const css = `
      .legal-sheet{
        position:fixed; left:0; right:0;
        top:var(--header-h-actual); bottom:var(--footer-h-actual);
        background:#fff; z-index:1200; display:none;
        box-shadow:none; border:0;
        display:flex; flex-direction:column; 
      }
      .legal-top{
        display:flex; align-items:center; justify-content:space-between;
        padding:10px 12px; border-bottom:1px solid #e5e7eb;
        font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;
      }
      .legal-tabs{
        display:flex; gap:8px; align-items:center;
      }
      .legal-tab{
        padding:8px 10px; border:1px solid #e5e7eb; border-radius:8px;
        background:#fff; cursor:pointer; font-size:14px;
      }
      .legal-tab[aria-selected="true"]{
        border-color: var(--burger); 
        outline: 0; box-shadow: 0 0 0 3px color-mix(in srgb, var(--burger) 20%, transparent);
      }
      .legal-close{
        background:transparent; border:0; font-size:20px; cursor:pointer; color:#333;
        -webkit-appearance:none; appearance:none; outline:none;
      }
      .legal-content{
        position:relative; flex:1 1 auto; overflow:auto; -webkit-overflow-scrolling:touch;
        padding:12px;
        font:16px/1.6 system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif; color:#111;
      }
      .legal-content h1{ margin:0 0 12px; font-size:22px; }
      .legal-content h2{ margin:20px 0 8px; font-size:18px; }
      .legal-content a{ color:#0b57d0; text-decoration:none; }
      .legal-content a:hover{ text-decoration:underline; }
      .legal-content :target{ scroll-margin-top: 72px; }
    `;
    styleTag = document.createElement('style');
    styleTag.id = 'legal-sheet-styles';
    styleTag.textContent = css;
    document.head.appendChild(styleTag);

    sheet = document.createElement('section');
    sheet.className = 'legal-sheet';
    sheet.setAttribute('role','dialog');
    sheet.setAttribute('aria-label','Юридическая информация');

    const top = document.createElement('div');
    top.className = 'legal-top';

    tabs = document.createElement('div');
    tabs.className = 'legal-tabs';
    tabs.innerHTML = `
      <button class="legal-tab" data-section="terms" aria-label="Условия">Условия</button>
      <button class="legal-tab" data-section="privacy" aria-label="Конфиденциальность">Конфиденциальность</button>
      <button class="legal-tab" data-section="impressum" aria-label="Impressum">Impressum</button>
    `;

    closeBtn = document.createElement('button');
    closeBtn.className = 'legal-close';
    closeBtn.setAttribute('aria-label','Закрыть');
    closeBtn.textContent = '✕';

    top.appendChild(tabs);
    top.appendChild(closeBtn);

    content = document.createElement('div');
    content.className = 'legal-content';

    sheet.appendChild(top);
    sheet.appendChild(content);
    document.body.appendChild(sheet);

    sheet.addEventListener('click', (e)=>{
      const btn = e.target.closest('.legal-tab');
      if (btn) open(btn.dataset.section);
    });
    closeBtn.addEventListener('click', close);

    document.addEventListener('keydown', (e)=>{
      if (sheet.style.display !== 'none' && e.key === 'Escape') close();
    }, {capture:true});
  }

  function setActiveTab(section){
    sheet.querySelectorAll('.legal-tab').forEach(b=>{
      b.setAttribute('aria-selected', String(b.dataset.section === section));
    });
  }

  function extractMain(html){
    try{
      const el = document.createElement('div');
      el.innerHTML = html;
      const main = el.querySelector('main');
      return main ? main.innerHTML : html;
    }catch{
      return html;
    }
  }

  async function load(section){
    const url = MAP[section] || MAP.impressum;
    const res = await fetch(url, { credentials: 'same-origin' });
    const text = await res.text();
    content.innerHTML = extractMain(text) + 
      `<div style="margin:24px 0 0; padding-top:16px; border-top:1px solid #eee; text-align:center">
         <button class="legal-tab" data-section="terms">Условия</button>
         <button class="legal-tab" data-section="privacy">Конфиденциальность</button>
         <button class="legal-tab" data-section="impressum">Impressum</button>
       </div>`;
  }

  function open(section='impressum'){
    ensureSheet();
    if (document.body.classList.contains('menu-open')) {
      document.body.classList.remove('menu-open');
      document.querySelector('.oc-root')?.setAttribute('aria-hidden','true');
    }
    setActiveTab(section);
    sheet.style.display = 'flex';
    document.body.classList.add('legal-open');
    load(section).catch(console.warn);
  }

  function close(){
    if (!sheet) return;
    sheet.style.display = 'none';
    document.body.classList.remove('legal-open');
  }

  return { open, close };
})();
