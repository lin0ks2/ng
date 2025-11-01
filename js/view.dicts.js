/* ==========================================================
 * view.dicts.js — Экран "Словари" (точно под твою сборку)
 * ========================================================== */
(function(){
  'use strict';
  const A = (window.App = window.App || {});

  function uiLang(){
    const s = (A.settings && (A.settings.lang || A.settings.uiLang)) || 'ru';
    return (String(s).toLowerCase() === 'uk') ? 'uk' : 'ru';
  }

  function t(){
    const uk = uiLang() === 'uk';
    return {
      title: uk ? 'Словники' : 'Словари',
      lang: uk ? 'Мова' : 'Язык',
      name: uk ? 'Словник' : 'Словарь',
      count: uk ? 'Слів' : 'Слов',
      preview: uk ? 'Переглянути' : 'Предпросмотр',
      empty: uk ? 'Словників не знайдено' : 'Словари не найдены',
      word: uk ? 'Слово' : 'Слово',
      trans: uk ? 'Переклад' : 'Перевод',
      close: uk ? 'Закрити' : 'Закрыть'
    };
  }

  /* ---------- Таблица ---------- */
  function renderDicts(){
    const app = document.getElementById('app');
    if (!app) return;
    const T = t();
    const keys = (A.Decks?.builtinKeys?.() || []);
    if (!keys.length){
      app.innerHTML = `<div class="home"><section class="card"><h3>${T.title}</h3><p>${T.empty}</p></section></div>`;
      return;
    }

    const rows = keys.map(key=>{
      const deck = A.Decks.resolveDeckByKey(key) || [];
      const name = A.Decks.resolveNameByKey(key);
      const flag = A.Decks.flagForKey(key);
      const count = deck.length;
      return `
        <tr>
          <td class="t-center">${flag}</td>
          <td>${name}</td>
          <td class="t-center">${count}</td>
          <td class="t-right">
            <button class="btn btn-preview" data-key="${key}">${T.preview}</button>
          </td>
        </tr>`;
    }).join('');

    app.innerHTML = `
      <div class="home">
        <section class="card dicts-card">
          <h3>${T.title}</h3>
          <table class="dicts-table">
            <thead>
              <tr>
                <th>${T.lang}</th>
                <th>${T.name}</th>
                <th>${T.count}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </section>
      </div>`;

    app.querySelectorAll('.btn-preview').forEach(btn=>{
      btn.addEventListener('click',()=>openPreview(btn.dataset.key));
    });
  }

  /* ---------- Модалка ---------- */
  function openPreview(key){
    const T = t();
    const deck = A.Decks.resolveDeckByKey(key) || [];
    const name = A.Decks.resolveNameByKey(key);
    const flag = A.Decks.flagForKey(key);
    const lang = uiLang();
    const rows = deck.map((w,i)=>`
      <tr>
        <td>${i+1}</td>
        <td>${w.word || ''}</td>
        <td>${lang==='uk' ? (w.uk||'') : (w.ru||'')}</td>
      </tr>`).join('');

    const wrap = document.createElement('div');
    wrap.className = 'mmodal is-open';
    wrap.innerHTML = `
      <div class="mmodal__overlay"></div>
      <div class="mmodal__panel">
        <div class="mmodal__header">
          <h3>${flag} ${name}</h3>
          <button class="mmodal__close" aria-label="${T.close}">✕</button>
        </div>
        <div class="mmodal__body">
          <table class="dict-table">
            <thead><tr><th>#</th><th>${T.word}</th><th>${T.trans}</th></tr></thead>
            <tbody>${rows || `<tr><td colspan="3" style="opacity:.7">${T.empty}</td></tr>`}</tbody>
          </table>
        </div>
      </div>`;
    document.body.appendChild(wrap);

    wrap.querySelector('.mmodal__overlay').onclick = ()=>wrap.remove();
    wrap.querySelector('.mmodal__close').onclick = ()=>wrap.remove();
  }

  /* ---------- Экспорт ---------- */
  A.ViewDicts = { mount: renderDicts };

})();
