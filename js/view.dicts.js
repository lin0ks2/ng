/* ==========================================================
 * view.dicts.js — Экран "Словари" (robust keys discovery)
 * ========================================================== */
(function(){
  'use strict';
  const A = (window.App = window.App || {});

  /* ---------- helpers ---------- */
  function getUiLang(){
    const s = (A.settings && (A.settings.lang || A.settings.uiLang)) || 'ru';
    return (String(s).toLowerCase() === 'uk') ? 'uk' : 'ru';
  }
  function deckLangOfKey(key){
    const m = /^([a-z]{2})[_-]/i.exec(key || '');
    return m ? m[1].toLowerCase() : '';
  }
  function deckFlag(key){
    try{ return A.Decks?.flagForKey?.(key) || '🏳️'; } catch(_){ return '🏳️'; }
  }
  function tDeckName(key){
    const lang = getUiLang();
    try{
      if (A.Decks?.resolveNameByKeyLang) return A.Decks.resolveNameByKeyLang(key, lang);
      if (A.Decks?.resolveNameByKey){
        const n = A.Decks.resolveNameByKey(key);
        if (n && typeof n === 'object'){
          return (lang === 'uk')
            ? (n.uk || n.name_uk || n.title_uk || n.name || n.title)
            : (n.ru || n.name_ru || n.title_ru || n.name || n.title);
        }
        if (typeof n === 'string') return n;
      }
      if (A.Dicts && A.Dicts[key]){
        const d = A.Dicts[key];
        return (lang === 'uk')
          ? (d.name_uk || d.title_uk || d.uk || d.name || d.title)
          : (d.name_ru || d.title_ru || d.ru || d.name || d.title);
      }
    }catch(_){}
    return (lang === 'uk') ? 'Словник' : 'Словарь';
  }
  function tWordByUiLang(w){
    const ui = getUiLang();
    if (!w) return '';
    return (ui === 'uk'
      ? (w.uk || w.translation_uk || w.trans_uk || w.ua)
      : (w.ru || w.translation_ru || w.trans_ru))
      || w.translation || w.trans || w.meaning || '';
  }

  /* ---------- robust: собрать ВСЕ ключи словарей ---------- */
  function discoverDeckKeys(){
    const set = new Set();

    // 1) Явный реестр словарей
    try { Object.keys(A.Dicts || {}).forEach(k => set.add(k)); } catch(_){}

    // 2) Возможные внутренние структуры App.Decks
    const candidates = [
      A.Decks && A.Decks.dicts,
      A.Decks && A.Decks.registry,
      A.Decks && A.Decks._dicts,
      A.Decks && A.Decks._registry,
      A.Decks && A.Decks.store,
      A.Decks && A.Decks._store
    ];
    candidates.forEach(obj=>{
      try {
        if (obj && typeof obj === 'object') {
          Object.keys(obj).forEach(k=> set.add(k));
        }
      } catch(_){}
    });

    // 3) Методы-помощники, если есть
    try {
      if (typeof A.Decks?.keys === 'function') {
        (A.Decks.keys() || []).forEach(k=> set.add(k));
      }
    } catch(_){}
    try {
      if (typeof A.Decks?.allKeys === 'function') {
        (A.Decks.allKeys() || []).forEach(k=> set.add(k));
      }
    } catch(_){}

    // 4) Фолбэк: если активный ключ явно существует — включим его
    try {
      if (A.Trainer?.getActiveKey && A.Trainer.getActiveKey()) set.add(A.Trainer.getActiveKey());
    } catch(_){}

    return Array.from(set);
  }

  /* ---------- данные для таблицы ---------- */
  function getAllDecks(){
    const keys = discoverDeckKeys();
    return keys.map(key=>{
      let items = [];
      try { items = A.Decks?.resolveDeckByKey?.(key) || []; } catch(_){}
      return {
        key,
        lang: deckLangOfKey(key),
        flag: deckFlag(key),
        name: tDeckName(key),
        count: items.length
      };
    }).filter(d => d.count >= 0); // показываем и пустые, если надо
  }

  /* ---------- модалка предпросмотра ---------- */
  function openPreview(key){
    const ui = getUiLang();
    const items = A.Decks?.resolveDeckByKey?.(key) || [];
    const name  = tDeckName(key);

    const wrap = document.createElement('div');
    wrap.className = 'mmodal is-open';
    wrap.innerHTML = `
      <div class="mmodal__overlay"></div>
      <div class="mmodal__panel" role="dialog" aria-label="Preview">
        <div class="mmodal__header">
          <div class="mmodal__title">${deckFlag(key)} ${name}</div>
          <button class="mmodal__close" aria-label="${ui==='uk'?'Закрити':'Закрыть'}">✕</button>
        </div>
        <div class="mmodal__body">
          <table class="dict-table">
            <thead>
              <tr>
                <th>#</th>
                <th>${ui==='uk'?'Слово':'Слово'}</th>
                <th>${ui==='uk'?'Переклад':'Перевод'}</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>`;
    document.body.appendChild(wrap);

    const tb = wrap.querySelector('tbody');
    tb.innerHTML = items.map((w, i)=>`
      <tr>
        <td>${i+1}</td>
        <td>${w.word || w.term || ''}</td>
        <td>${tWordByUiLang(w)}</td>
      </tr>`).join('') || `<tr><td colspan="3" style="opacity:.7;text-align:center">${ui==='uk'?'Порожньо':'Пусто'}</td></tr>`;

    function close(){ wrap.remove(); }
    wrap.querySelector('.mmodal__close').onclick = close;
    wrap.querySelector('.mmodal__overlay').onclick = close;
    document.addEventListener('keydown', function esc(e){ if(e.key==='Escape'){ close(); document.removeEventListener('keydown', esc);} });
  }

  /* ---------- рендер списка ---------- */
  function renderList(into){
    const ui = getUiLang();
    const decks = getAllDecks();

    decks.sort((a,b)=>{
      if (a.lang === b.lang) return a.name.localeCompare(b.name, ui==='uk'?'uk':'ru');
      return a.lang.localeCompare(b.lang);
    });

    into.innerHTML = `
      <section class="card dicts-card">
        <div class="dicts-header">
          <h3>${ui==='uk'?'Словники':'Словари'}</h3>
          <div class="dicts-note">${ui==='uk'?'Сортування: мова словника → назва':'Сортировка: язык словаря → название'}</div>
        </div>

        <div class="dicts-table-wrap">
          <table class="dicts-table">
            <thead>
              <tr>
                <th style="width:70px">${ui==='uk'?'Мова':'Язык'}</th>
                <th>${ui==='uk'?'Словник':'Словарь'}</th>
                <th style="width:120px">${ui==='uk'?'Слів':'Слов'}</th>
                <th style="width:140px"></th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </section>`;

    const tbody = into.querySelector('tbody');
    tbody.innerHTML = decks.map(d=>`
      <tr>
        <td class="t-center">${d.flag}</td>
        <td>${d.name}</td>
        <td class="t-center">${d.count}</td>
        <td class="t-right">
          <button class="btn btn-preview" data-key="${d.key}">
            ${ui==='uk'?'Переглянути':'Предпросмотр'}
          </button>
        </td>
      </tr>`).join('') || `<tr><td colspan="4" style="opacity:.7;padding:10px 8px">${ui==='uk'?'Словників не знайдено':'Словари не найдены'}</td></tr>`;

    tbody.querySelectorAll('.btn-preview').forEach(b=>{
      b.addEventListener('click', ()=> openPreview(b.dataset.key));
    });
  }

  function mountInto(appRoot){
    if (!appRoot) return;
    appRoot.innerHTML = `<div class="home" id="dictsView"></div>`;
    renderList(appRoot.querySelector('#dictsView'));
  }

  A.ViewDicts = { mountInto };
})();
