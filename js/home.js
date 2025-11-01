/* ==========================================================
 * home.js — Главная: Сеты + Подсказки + Тренер
 * ========================================================== */
(function(){
  'use strict';
  const A = (window.App = window.App || {});

  // какой словарь показываем на главной
  const ACTIVE_KEY = 'de_verbs';
  const SET_SIZE   = (A.Config && A.Config.setSizeDefault) || 40;

  // --- utils ------------------------------------------------
  function currentUiLang(){
    try { return (A.settings && (A.settings.uiLang || A.settings.lang)) || 'ru'; }
    catch(_) { return 'ru'; }
  }
  function tr(w){
    const lang = currentUiLang();
    return (lang === 'uk' ? w.uk : w.ru) || w.translation || w.trans || w.meaning || '';
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

  // --- markup -----------------------------------------------
  function mountMarkup(){
    const app = document.getElementById('app');
    if (!app) return;
    const flag = (A.Decks && A.Decks.flagForKey && A.Decks.flagForKey(ACTIVE_KEY)) || '🇩🇪';
    const title = (A.Decks && A.Decks.resolveNameByKey && A.Decks.resolveNameByKey(ACTIVE_KEY)) || 'Глаголы';

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
          <h4 class="hints-title">Подсказки</h4>
          <div class="hints-body" id="hintsBody"></div>
        </section>

        <!-- ЗОНА 3: Тренер -->
        <section class="card home-trainer">
          <div class="trainer-header">
            <button class="fav-toggle" title="В избранное" aria-label="Добавить в избранное">🤍</button>
            <h3 class="trainer-word"></h3>
          </div>
          <p class="trainer-subtitle">Выберите перевод</p>
          <div class="answers-grid"></div>
          <button class="btn-ghost idk-btn">Не знаю</button>
          <p class="dict-stats" id="dictStats"></p>
        </section>
      </div>`;
  }

  // --- Зона 1: Сеты -----------------------------------------
  function getActiveBatchIndex(){
    try { return A.Trainer && A.Trainer.getBatchIndex ? A.Trainer.getBatchIndex(ACTIVE_KEY) : 0; }
    catch(_) { return 0; }
  }
  function renderSets(){
    const deck = (A.Decks && A.Decks.resolveDeckByKey && A.Decks.resolveDeckByKey(ACTIVE_KEY)) || [];
    const grid = document.getElementById('setsBar');
    const statsEl = document.getElementById('setStats');
    if (!grid) return;

    const totalSets = Math.ceil(deck.length / SET_SIZE);
    const activeIdx = getActiveBatchIndex();
    grid.innerHTML = '';

    const starsMax = (A.Trainer && A.Trainer.starsMax && A.Trainer.starsMax()) || 5;

    for (let i=0;i<totalSets;i++){
      const from = i*SET_SIZE;
      const to   = Math.min(deck.length, (i+1)*SET_SIZE);
      const sub  = deck.slice(from,to);
      const done = sub.length>0 && sub.every(w => ((A.state && A.state.stars && A.state.stars[starKey(w.id,ACTIVE_KEY)])||0) >= starsMax);

      const btn = document.createElement('button');
      btn.className = 'set-pill' + (i===activeIdx?' is-active':'') + (done?' is-done':'');
      btn.textContent = i+1;
      btn.setAttribute('data-set-index', String(i)); // для ui.sets.done.js
      btn.onclick = ()=>{
        if (A.Trainer && A.Trainer.setBatchIndex) A.Trainer.setBatchIndex(i,ACTIVE_KEY);
        renderSets(); renderTrainer();
        try { A.Stats && A.Stats.recomputeAndRender && A.Stats.recomputeAndRender(); } catch(_){}
      };
      grid.appendChild(btn);
    }

    // верхняя статистика по текущему сету
    const i = getActiveBatchIndex();
    const from = i*SET_SIZE, to = Math.min(deck.length,(i+1)*SET_SIZE);
    const words = deck.slice(from,to);
    const learned = words.filter(w => ((A.state && A.state.stars && A.state.stars[starKey(w.id,ACTIVE_KEY)])||0) >= starsMax).length;
    if (statsEl) statsEl.textContent = `Слов в наборе: ${words.length} / Выучено: ${learned}`;
  }

  // --- Зона 2: Подсказки ------------------------------------
  function renderHints(text){
    const el = document.getElementById('hintsBody');
    if (!el) return;
    el.textContent = text || ' ';
  }

  // --- Зона 3: Тренер ---------------------------------------
  function buildOptions(word){
    // 1) если есть безопасный генератор — используем
    if (A.UI && typeof A.UI.safeOptions === 'function') {
      return A.UI.safeOptions(word, { key: ACTIVE_KEY, size: 4, t: tr });
    }

    // 2) локальный надёжный генератор без A.Decks.sampleWrongAnswers
    const deck = (A.Decks && A.Decks.resolveDeckByKey && A.Decks.resolveDeckByKey(ACTIVE_KEY)) || [];
    let pool = [];

    // подсосать отвлекающие из "Мои ошибки", если доступно
    try {
      if (A.Mistakes && typeof A.Mistakes.getDistractors === 'function') {
        pool = A.Mistakes.getDistractors(ACTIVE_KEY, word.id) || [];
      }
    } catch(_){}

    if (pool.length < 3) {
      const more = deck.filter(w => String(w.id) !== String(word.id));
      pool = pool.concat(more);
    }

    const wrongs = shuffle(pool).filter(w => String(w.id)!==String(word.id)).slice(0,3);
    const opts = shuffle(uniqueById([word, ...wrongs])).slice(0,4);

    while (opts.length < 4 && deck.length) {
      const r = deck[Math.floor(Math.random()*deck.length)];
      if (String(r.id)!==String(word.id) && !opts.some(o=>String(o.id)===String(r.id))) opts.push(r);
    }
    return shuffle(opts);
  }

  function renderTrainer(){
    const slice = (A.Trainer && A.Trainer.getDeckSlice && A.Trainer.getDeckSlice(ACTIVE_KEY)) || [];
    if (!slice.length) return;

    const idx = (A.Trainer && typeof A.Trainer.sampleNextIndexWeighted === 'function')
      ? A.Trainer.sampleNextIndexWeighted(slice)
      : Math.floor(Math.random()*slice.length);
    const word = slice[idx];

    const answers = document.querySelector('.answers-grid');
    const wordEl  = document.querySelector('.trainer-word');
    const favBtn  = document.querySelector('.fav-toggle');
    const stats   = document.getElementById('dictStats');
    const idkBtn  = document.querySelector('.idk-btn');

    wordEl.textContent = word.word || word.term || '';

    // варианты
    const opts = buildOptions(word);
    answers.innerHTML = '';
    opts.forEach(opt=>{
      const b = document.createElement('button');
      b.className = 'answer-btn';
      b.textContent = tr(opt);
      b.onclick = ()=>{
        const ok = String(opt.id) === String(word.id);
        try {
          if (A.Trainer && A.Trainer.handleAnswer) A.Trainer.handleAnswer(ACTIVE_KEY, word.id, ok);
          if (!ok && A.Mistakes && A.Mistakes.push) A.Mistakes.push(ACTIVE_KEY, word.id);
        } catch(_){}
        renderHints(ok ? '✅ Отлично!' : `❌ Правильный перевод — “${tr(word)}”.`);
        renderSets(); renderTrainer();
        try { A.Stats && A.Stats.recomputeAndRender && A.Stats.recomputeAndRender(); } catch(_){}
      };
      answers.appendChild(b);
    });

    // "Не знаю"
    if (idkBtn) {
      idkBtn.onclick = ()=>{
        try {
          if (A.Trainer && A.Trainer.handleAnswer) A.Trainer.handleAnswer(ACTIVE_KEY, word.id, false);
          if (A.Mistakes && A.Mistakes.push) A.Mistakes.push(ACTIVE_KEY, word.id);
        } catch(_){}
        renderHints(`ℹ️ Правильный перевод — “${tr(word)}”.`);
        renderSets(); renderTrainer();
        try { A.Stats && A.Stats.recomputeAndRender && A.Stats.recomputeAndRender(); } catch(_){}
      };
    }

    // избранное
    try {
      const has = A.Favorites && A.Favorites.has && A.Favorites.has(ACTIVE_KEY, word.id);
      if (favBtn) {
        favBtn.classList.toggle('is-fav', !!has);
        favBtn.onclick = ()=>{
          try { A.Favorites && A.Favorites.toggle && A.Favorites.toggle(ACTIVE_KEY, word.id); } catch(_){}
          favBtn.classList.toggle('is-fav');
        };
      }
    } catch(_){}

    // нижняя статистика по всему словарю
    const full = (A.Decks && A.Decks.resolveDeckByKey && A.Decks.resolveDeckByKey(ACTIVE_KEY)) || [];
    const starsMax = (A.Trainer && A.Trainer.starsMax && A.Trainer.starsMax()) || 5;
    const learned = full.filter(w => ((A.state && A.state.stars && A.state.stars[starKey(w.id,ACTIVE_KEY)])||0) >= starsMax).length;
    if (stats) stats.textContent = `Всего слов: ${full.length} / Выучено: ${learned}`;
  }

  // --- мосты для ui.lifecycle/ui.stats.core -----------------
  function renderSetStats(){ renderSets(); }
  function updateStats(){ /* нижняя статистика обновляется в renderTrainer() */ }

  // --- экспорт и init ---------------------------------------
  function mount(){
    mountMarkup();
    renderSets();
    renderTrainer();
    renderHints(' ');
  }

  A.Home = { mount, renderSetStats, updateStats };

  // отдаём глобальные имена, если их ждут хуки
  window.renderSetStats = window.renderSetStats || renderSetStats;
  window.updateStats    = window.updateStats    || updateStats;

  if (document.readyState !== 'loading') mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
