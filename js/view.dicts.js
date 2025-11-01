/* ==========================================================
 * view.dicts.js — Экран "Словари" (обновлён: кнопка → эмодзи 🔍)
 * ========================================================== */
(function(){
  'use strict';
  const A = (window.App = window.App || {});

  /* ---------------------- helpers ---------------------- */
  function getUiLang(){
    const s = (A.settings && (A.settings.lang || A.settings.uiLang)) || 'ru';
    return (String(s).toLowerCase() === 'uk') ? 'uk' : 'ru';
  }

  function t(){
    const uk = getUiLang() === 'uk';
    return {
      title: uk ? 'Словники' : 'Словари',
      lang: uk ? 'Мова словника' : 'Язык словаря',
      name: uk ? 'Назва словника' : 'Название словаря',
      words: uk ? 'Слів' : 'Слов',
      preview: uk ? 'Переглянути' : 'Предпросмотр',
      empty: uk ? 'Словників не знайдено' : 'Словари не найдены',
      word: uk ? 'Слово' : 'Слово',
      trans: uk ? 'Переклад' : 'Перевод',
      close: uk ? 'Закрити' : 'Закрыть',
    };
  }

  /* ---------------------- render list ---------------------- */
  function renderDictList(){
    const app = document.getElementById('app');
    if (!app) return;
    const T = t();

    const keys = (A.Decks?.builtinKeys?.() || []);
    if (!keys.length){
      app.innerHTML = `
        <div class="home">
          <section class="card"><h3>${T.title}</h3><p>${T.empty}</p></section>
        </div>`;
      return;
    }

    const rows = keys.map(key=>{
      const deck = A.Decks.resolveDeckByKey(key) || [];
      const flag = A.Decks.flagForKey(key);
      const name = A.Decks.resolveNameByKey(key);
      return `
        <tr>
          <td class="t-center">${flag}</td>
          <td>${name}</td>
          <td class="t-center">${deck.length}</td>
          <td class="t-center">
            <span class="dicts-preview" title="${T.preview}" data-key="${key}" role="button" aria-label="${T.preview}">👁‍🗨</span>
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
                <th>${T.words}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </section>
      </div>`;

    app.querySelectorAll('.dicts-preview').forEach(btn=>{
      btn.addEventListener('click',()=>openPreview(btn.dataset.key));
    });
  }

  /* ---------------------- modal preview ---------------------- */
  function openPreview(key){
    const T = t();
    const deck = A.Decks.resolveDeckByKey(key) || [];
    const name = A.Decks.resolveNameByKey(key);
    const flag = A.Decks.flagForKey(key);
    const lang = getUiLang();

    const rows = deck.map((w,i)=>`
      <tr>
        <td>${i+1}</td>
        <td>${w.word || w.term || ''}</td>
        <td>${lang === 'uk' ? (w.uk || w.translation_uk || '') 
                             : (w.ru || w.translation_ru || '')}</td>
      </tr>`).join('');

    const wrap = document.createElement('div');
    wrap.className = 'mmodal is-open';
    wrap.innerHTML = `
      <div class="mmodal__overlay"></div>
      <div class="mmodal__panel" role="dialog" aria-modal="true">
        <div class="mmodal__header">
          <h3>${flag} ${name}</h3>
          <button class="mmodal__close" aria-label="${T.close}">✕</button>
        </div>
        <div class="mmodal__body">
          <table class="dict-table">
            <thead><tr><th>#</th><th>${T.word}</th><th>${T.trans}</th></tr></thead>
            <tbody>${rows || `<tr><td colspan="3" style="opacity:.6">${T.empty}</td></tr>`}</tbody>
          </table>
        </div>
      </div>`;
    document.body.appendChild(wrap);

    const close = ()=>wrap.remove();
    wrap.querySelector('.mmodal__overlay').onclick = close;
    wrap.querySelector('.mmodal__close').onclick = close;
  }

  /* ---------------------- export ---------------------- */
  A.ViewDicts = { mount: renderDictList };

})();
