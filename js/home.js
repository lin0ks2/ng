/* ==========================================================
 * home.js — Главная: Сеты + Подсказки + Тренер (lang sync + stars/heart swap)
 * ========================================================== */
(function(){
  'use strict';
  const A = (window.App = window.App || {});

  // какой словарь показываем на главной
  const ACTIVE_KEY = 'de_verbs';
  const SET_SIZE   = (A.Config && A.Config.setSizeDefault) || 40;

  // ---------- utils ----------
  function getUiLang(){
    const htmlLang = document.documentElement?.dataset?.lang;
    if (htmlLang === 'ru' || htmlLang === 'uk') return htmlLang;
    const s = (A.settings && (A.settings.uiLang || A.settings.lang)) || 'ru';
    return (s === 'uk') ? 'uk' : 'ru';
  }
  function tWord(w){
    const lang = getUiLang();
    if (!w) return '';
    return (lang === 'uk'
      ? (w.uk || w.translation_uk || w.trans_uk || w.ua)
      : (w.ru || w.translation_ru || w.trans_ru))
      || w.translation || w.trans || w.meaning || '';
  }
  function shuffle(arr){
    for (let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; }
    return arr;
  }
  function uniqueById(arr){
    const seen=new Set();
    return arr.filter(x=>{ const id=String(x.id); if(seen.has(id)) return false; seen.add(id); return true; });
  }
  const starKey = (typeof A.starKey === 'function')
    ? A.starKey
    : (id, key)=> `${key}:${id}`;

  function getDeckTitleByLang(key){
    const lang = getUiLang();
    try {
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
    } catch(_){}
    return (lang === 'uk') ? 'Дієслова' : 'Глаголы';
  }

  // ---------- markup ----------
  function mountMarkup(){
    const app = document.getElementById('app');
    if (!app) return;
    const flag  = (A.Decks && A.Decks.flagForKey && A.Decks.flagForKey(ACTIVE_KEY)) || '🇩🇪';
    const title = getDeckTitleByLang(ACTIVE_KEY);

    const t = (k)=>({
      hints  : getUiLang()==='uk' ? 'Підказки' : 'Подсказки',
      choose : getUiLang()==='uk' ? 'Оберіть переклад' : 'Выберите перевод',
      idk    : getUiLang()==='uk' ? 'Не знаю' : 'Не знаю',
      fav    : getUiLang()==='uk' ? 'У вибране' : 'В избранное'
    })[k];

    app.innerHTML = `
      <div class="home">
        <!-- ЗОНА 1: Сеты -->
        <section class="card home-sets">
          <header class="sets-header">
            <span class="flag" aria-hidden="true">${flag}</span>
            <h2 class="sets-title">${title}</h2>
          </header>
          <div class="sets-grid" id="setsBar"></div>
          <p class="sets-stats" id="setStats"></p>
        </section>

        <!-- ЗОНА 2: Подсказки -->
        <section class="card home-hints">
          <h4 class="hints-title">${t('hints')}</h4>
          <div class="hints-body" id="hintsBody"></div>
        </section>

        <!-- ЗОНА 3: Тренер -->
        <section class="card home-trainer">
          <div class="trainer-header">
            <h3 class="trainer-word"></h3>
            <div class="trainer-stars" aria-hidden="true"></div>
            <button class="fav-toggle" title="${t('fav')}" aria-label="${t('fav')}">🤍</button>
          </div>
          <p class="trainer-subtitle">${t('choose')}</p>
          <div class="answers-grid"></div>
          <button class="btn-ghost idk-btn">${t('idk')}</button>
          <p class="dict-stats" id="dictStats"></p>
        </section>
      </div>`;
  }

  // ---------- Зона 1: Сеты ----------
  function getActiveBatchIndex(){
    try { return A.Trainer?.getBatchIndex ? A.Trainer.getBatchIndex(ACTIVE_KEY) : 0; }
    catch(_) { return 0; }
  }
  function renderSets(){
    const deck = A.Decks?.resolveDeckByKey?.(ACTIVE_KEY) || [];
    const grid = document.getElementById('setsBar');
    const statsEl = document.getElementById('setStats');
    if (!grid) return;

    const totalSets = Math.ceil(deck.length / SET_SIZE);
    const activeIdx = getActiveBatchIndex();
    grid.innerHTML = '';

    const starsMax = A.Trainer?.starsMax?.() || 5;

    for (let i=0;i<totalSets;i++){
      const from = i*SET_SIZE;
      const to   = Math.min(deck.length, (i+1)*SET_SIZE);
      const sub  = deck.slice(from,to);
      const done = sub.length>0 && sub.every(w => ((A.state?.stars?.[starKey(w.id,ACTIVE_KEY)])||0) >= starsMax);

      const btn = document.createElement('button');
      btn.className = 'set-pill' + (i===activeIdx?' is-active':'') + (done?' is-done':'');
      btn.textContent = i+1;
      btn.setAttribute('data-set-index', String(i)); // для ui.sets.done.js
      btn.onclick = ()=>{
        A.Trainer?.setBatchIndex?.(i,ACTIVE_KEY);
        renderSets(); renderTrainer();
        try { A.Stats?.recomputeAndRender?.(); } catch(_){}
      };
      grid.appendChild(btn);
    }

    const i = getActiveBatchIndex();
    const from = i*SET_SIZE, to = Math.min(deck.length,(i+1)*SET_SIZE);
    const words = deck.slice(from,to);
    const learned = words.filter(w => ((A.state?.stars?.[starKey(w.id,ACTIVE_KEY)])||0) >= starsMax).length;
    if (statsEl) {
      statsEl.textContent = (getUiLang()==='uk')
        ? `Слів у наборі: ${words.length} / Вивчено: ${learned}`
        : `Слов в наборе: ${words.length} / Выучено: ${learned}`;
    }
  }

  // ---------- Зона 2: Подсказки ----------
  function renderHints(text){
    const el = document.getElementById('hintsBody');
    if (!el) return;
    el.textContent = text || ' ';
  }

  // ---------- Зона 3: Тренер ----------
  // звёзды
  function getStars(wordId){
    const val = (A.state && A.state.stars && A.state.stars[starKey(wordId, ACTIVE_KEY)]) || 0;
    return Number(val) || 0;
  }
  function renderStarsFor(word){
    const box = document.querySelector('.trainer-stars');
    if (!box || !word) return;
    const max  = A.Trainer?.starsMax?.() || 5;
    const have = getStars(word.id);
    let html = '';
    for (let i = 1; i <= max; i++){
      html += `<span class="star ${i <= have ? 'on' : ''}" aria-hidden="true">★</span>`;
    }
    box.innerHTML = html;
  }

  function buildOptions(word){
    // если есть безопасный генератор — используем
    if (A.UI && typeof A.UI.safeOptions === 'function') {
      return A.UI.safeOptions(word, { key: ACTIVE_KEY, size: 4, t: tWord });
    }
    // локальный надёжный генератор
    const deck = A.Decks?.resolveDeckByKey?.(ACTIVE_KEY) || [];
    let pool = [];
    try { if (A.Mistakes?.getDistractors) pool = A.Mistakes.getDistractors(ACTIVE_KEY, word.id) || []; } catch(_){}
    if (pool.length < 3) pool = pool.concat(deck.filter(w => String(w.id)!==String(word.id)));
    const wrongs = shuffle(pool).filter(w => String(w.id)!==String(word.id)).slice(0,3);
    const opts = shuffle(uniqueById([word, ...wrongs])).slice(0,4);
    while (opts.length < 4 && deck.length) {
      const r = deck[Math.floor(Math.random()*deck.length)];
      if (String(r.id)!==String(word.id) && !opts.some(o=>String(o.id)===String(r.id))) opts.push(r);
    }
    return shuffle(opts);
  }

  function renderTrainer(){
    const slice = A.Trainer?.getDeckSlice?.(ACTIVE_KEY) || [];
    if (!slice.length) return;

    const idx = (typeof A.Trainer?.sampleNextIndexWeighted === 'function')
      ? A.Trainer.sampleNextIndexWeighted(slice)
      : Math.floor(Math.random()*slice.length);
    const word = slice[idx];

    const answers = document.querySelector('.answers-grid');
    const wordEl  = document.querySelector('.trainer-word');
    const favBtn  = document.querySelector('.fav-toggle');
    const stats   = document.getElementById('dictStats');
    const idkBtn  = document.querySelector('.idk-btn');

    wordEl.textContent = word.word || word.term || '';
    renderStarsFor(word);

    const opts = buildOptions(word);
    answers.innerHTML = '';
    opts.forEach(opt=>{
      const b = document.createElement('button');
      b.className = 'answer-btn';
      b.textContent = tWord(opt);
      b.onclick = ()=>{
        const ok = String(opt.id) === String(word.id);
        try {
          A.Trainer?.handleAnswer?.(ACTIVE_KEY, word.id, ok);
          if (!ok) A.Mistakes?.push?.(ACTIVE_KEY, word.id);
        } catch(_){}
        renderHints(ok
          ? (getUiLang()==='uk' ? '✅ Чудово!' : '✅ Отлично!')
          : (getUiLang()==='uk' ? `❌ Правильний переклад — “${tWord(word)}”.` : `❌ Правильный перевод — “${tWord(word)}”.`));
        renderSets(); renderTrainer();
        try { A.Stats?.recomputeAndRender?.(); } catch(_){}
      };
      answers.appendChild(b);
    });

    if (idkBtn) {
      idkBtn.textContent = (getUiLang()==='uk' ? 'Не знаю' : 'Не знаю');
      idkBtn.onclick = ()=>{
        try {
          A.Trainer?.handleAnswer?.(ACTIVE_KEY, word.id, false);
          A.Mistakes?.push?.(ACTIVE_KEY, word.id);
        } catch(_){}
        renderHints(getUiLang()==='uk'
          ? `ℹ️ Правильний переклад — “${tWord(word)}”.`
          : `ℹ️ Правильный перевод — “${tWord(word)}”.`);
        renderSets(); renderTrainer();
        try { A.Stats?.recomputeAndRender?.(); } catch(_){}
      };
    }

    try {
      const has = A.Favorites?.has?.(ACTIVE_KEY, word.id);
      if (favBtn) {
        const favTitle = (getUiLang()==='uk' ? 'У вибране' : 'В избранное');
        favBtn.title = favTitle; favBtn.ariaLabel = favTitle;
        favBtn.classList.toggle('is-fav', !!has);
        favBtn.onclick = ()=>{
          try { A.Favorites?.toggle?.(ACTIVE_KEY, word.id); } catch(_){}
          favBtn.classList.toggle('is-fav');
        };
      }
    } catch(_){}

    const full = A.Decks?.resolveDeckByKey?.(ACTIVE_KEY) || [];
    const starsMax = A.Trainer?.starsMax?.() || 5;
    const learned = full.filter(w => ((A.state?.stars?.[starKey(w.id,ACTIVE_KEY)])||0) >= starsMax).length;
    if (stats) {
      stats.textContent = (getUiLang()==='uk')
        ? `Всього слів: ${full.length} / Вивчено: ${learned}`
        : `Всего слов: ${full.length} / Выучено: ${learned}`;
    }
  }

  // ---------- мосты для ui.lifecycle/ui.stats.core ----------
  function renderSetStats(){ renderSets(); }
  function updateStats(){ /* нижняя статистика обновляется в renderTrainer() */ }

  // ---------- синхронизация языка с тогглом ----------
  function normalizeLangFromToggle(){
    const toggle = document.getElementById('langToggle');
    if (!toggle) return;
    // checked => RU, unchecked => UK (как в твоём index.html)
    document.documentElement.dataset.lang = toggle.checked ? 'ru' : 'uk';
  }
  function bindLangToggle(){
    const toggle = document.getElementById('langToggle');
    if (!toggle) return;
    // синхронизируем чекбокс с текущим состоянием
    toggle.checked = (getUiLang()==='ru');
    // на старте нормализуем dataset.lang под положение тоггла (исправляет рассинхрон)
    normalizeLangFromToggle();
    // реакция на изменение
    toggle.addEventListener('change', ()=>{
      normalizeLangFromToggle();
      try { A.Home.mount(); } catch(_){}
    });
  }

  // ---------- экспорт и init ----------
  function mount(){
    mountMarkup();
    renderSets();
    renderTrainer();
    renderHints(' ');
    bindLangToggle();
  }

  A.Home = { mount, renderSetStats, updateStats };
  window.renderSetStats = window.renderSetStats || renderSetStats;
  window.updateStats    = window.updateStats    || updateStats;

  if (document.readyState !== 'loading') mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
