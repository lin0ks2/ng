/* ==========================================================
 * home.js — главная: сеты, тренер, статистика, избранное
 * Визуал + базовая логика. Источник данных — window.App.*
 * ========================================================== */
(function(){
  'use strict';
  const App = window.App || (window.App = {});
  const SET_SIZE = 40;               // размер набора (как в старой версии)
  const START_KEY = 'de_verbs';      // стартуем с немецких глаголов

  // --- утилиты ---
  const starsMax = ()=> { try{ return App.Trainer && App.Trainer.starsMax ? App.Trainer.starsMax() : 5; }catch(_){ return 5; } };
  const uiLang   = ()=> { try{ return (App.settings && (App.settings.uiLang || App.settings.lang)) || 'ru'; }catch(_){ return 'ru'; } };
  const activeKey = ()=> (App.dictRegistry && App.dictRegistry.activeKey) || START_KEY;

  function setActiveKey(key){
    App.dictRegistry = App.dictRegistry || {};
    App.dictRegistry.activeKey = key;
    try{ App.saveDictRegistry && App.saveDictRegistry(); }catch(_){}
  }

  function resolveDeckByKey(key){
    try { return (App.Decks && App.Decks.resolveDeckByKey) ? (App.Decks.resolveDeckByKey(key) || []) : []; }
    catch(_){ return []; }
  }

  function starOf(dictKey, id){
    try{
      App.state = App.state || {};
      const K = App.starKey ? App.starKey(id, dictKey) : (dictKey + '#' + id);
      return (App.state.stars && App.state.stars[K])|0 || 0;
    }catch(_){ return 0; }
  }

  function isFav(dictKey, id){
    try{ return !!(App.Favorites && App.Favorites.isFav && App.Favorites.isFav(uiLang(), dictKey, id)); }
    catch(_){ return false; }
  }
  function toggleFav(dictKey, id){
    try{
      if (App.Favorites && App.Favorites.toggle) App.Favorites.toggle(uiLang(), dictKey, id);
      else if (App.Favorites && App.Favorites.set) App.Favorites.set(uiLang(), dictKey, id, !isFav(dictKey,id));
    }catch(_){}
  }

  // --- разметка каркаса (если не вставлен вручную) ---
  function ensureMarkup(){
    const app = document.getElementById('app');
    if (!app) return null;
    if (!app.querySelector('.home')){
      app.innerHTML = `
      <div class="home" aria-label="Главная страница">
        <section class="card home-sets" aria-labelledby="setsTitle">
          <header class="sets-header">
            <span class="flag" aria-hidden="true">🇩🇪</span>
            <h2 class="sets-title" id="setsTitle">Глаголы</h2>
          </header>
          <div class="sets-grid" role="list"></div>
          <p class="sets-stats" aria-live="polite"></p>
        </section>

        <section class="card home-trainer" aria-labelledby="trainerTitle">
          <div class="trainer-top">
            <div class="stars" aria-label="Прогресс"></div>
            <button class="fav-btn" id="favToggle" aria-label="Добавить в избранное" aria-pressed="false">
              <span class="fav-icon" aria-hidden="true">♡</span>
            </button>
          </div>
          <h3 class="trainer-word" id="trainerTitle"></h3>
          <p class="trainer-subtitle">Выберите перевод</p>
          <div class="answers-grid" role="group" aria-label="Варианты ответа"></div>
          <button class="btn-ghost idk-btn">Не знаю</button>
          <p class="dict-stats" aria-live="polite"></p>
        </section>

        <section class="card home-hints" aria-labelledby="hintsTitle">
          <h4 class="hints-title" id="hintsTitle">Подсказки</h4>
        </section>
      </div>`;
    }
    return app.querySelector('.home');
  }

  // --- рендер звёзд ---
  function renderStars(el, value){
    const max = starsMax();
    const on = Math.min(value|0, max);
    el.innerHTML = '';
    for (let i=0;i<max;i++){
      const span = document.createElement('span');
      span.className = 'star' + (i<on ? ' is-on' : '');
      span.textContent = '★';
      el.appendChild(span);
    }
  }

  // --- построение сетов и верхней статистики ---
  function renderSets(dictKey){
    const deck = resolveDeckByKey(dictKey);
    const grid = document.querySelector('.home-sets .sets-grid');
    const statsEl = document.querySelector('.home-sets .sets-stats');
    if (!grid || !deck) return;

    // сколько сетов
    const setsCount = Math.max(1, Math.ceil(deck.length / SET_SIZE));
    grid.innerHTML = '';
    let activeIdx = Number(App.state && App.state.setByDeck && App.state.setByDeck[dictKey] || 0);
    if (activeIdx >= setsCount) activeIdx = 0;

    for (let i=0;i<setsCount;i++){
      const b = document.createElement('button');
      b.className = 'set-pill' + (i===activeIdx ? ' is-active' : '');
      b.textContent = String(i+1);
      // простой "готово": если все слова в сете со звёздами макс
      const from = i*SET_SIZE, to = Math.min(deck.length, (i+1)*SET_SIZE);
      const inSet = deck.slice(from, to);
      const learned = inSet.filter(w => starOf(dictKey, w.id) >= starsMax()).length;
      if (learned && learned === inSet.length) b.classList.add('is-done');
      b.addEventListener('click', ()=>{
        if (i===activeIdx) return;
        App.state = App.state || {};
        App.state.setByDeck = App.state.setByDeck || {};
        App.state.setByDeck[dictKey] = i;
        try{ App.saveState && App.saveState(); }catch(_){}
        renderSets(dictKey);
        renderTrainer(dictKey);
      });
      grid.appendChild(b);
    }

    // верхняя статистика по активному сету
    const from = activeIdx*SET_SIZE, to = Math.min(deck.length, (activeIdx+1)*SET_SIZE);
    const inSet = deck.slice(from, to);
    const learned = inSet.filter(w => starOf(dictKey, w.id) >= starsMax()).length;
    statsEl.textContent = `Слов в наборе: ${inSet.length} / Выучено: ${learned}`;
  }

  // --- тренер: выбор слова + ответы ---
  function pickWord(dictKey){
    const deck = resolveDeckByKey(dictKey);
    let setIdx = Number(App.state && App.state.setByDeck && App.state.setByDeck[dictKey] || 0);
    const from = setIdx*SET_SIZE, to = Math.min(deck.length, (setIdx+1)*SET_SIZE);
    const inSet = deck.slice(from, to);
    if (!inSet.length) return null;

    // выбираем сначала невыученные
    const notLearned = inSet.filter(w => starOf(dictKey, w.id) < starsMax());
    const pool = notLearned.length ? notLearned : inSet;
    return pool[(Math.random()*pool.length)|0];
  }
  function pickDistractors(dictKey, correctId, count=3){
    const deck = resolveDeckByKey(dictKey);
    const ids = new Set([String(correctId)]);
    const out = [];
    while (out.length < count){
      const w = deck[(Math.random()*deck.length)|0];
      if (!w || ids.has(String(w.id))) continue;
      ids.add(String(w.id)); out.push(w);
    }
    return out;
  }

  function renderTrainer(dictKey){
    const word = pickWord(dictKey);
    const wordEl = document.querySelector('.home-trainer .trainer-word');
    const starsEl = document.querySelector('.home-trainer .stars');
    const answers = document.querySelector('.home-trainer .answers-grid');
    const statsEl = document.querySelector('.home-trainer .dict-stats');
    const favBtn  = document.getElementById('favToggle');
    if (!word || !wordEl || !answers) return;

    wordEl.textContent = word.word || word.term || String(word.id);

    // звёзды
    renderStars(starsEl, starOf(dictKey, word.id));

    // варианты (1 правильный + 3 отвлекающих)
    const distractors = pickDistractors(dictKey, word.id, 3);
    const options = [word, ...distractors].sort(()=>Math.random()-0.5);
    answers.innerHTML = '';
    options.forEach(opt=>{
      const b = document.createElement('button');
      b.className = 'answer-btn';
      b.textContent = opt.translation || opt.trans || opt.meaning || opt.word || '';
      b.addEventListener('click', ()=>{
        const ok = String(opt.id) === String(word.id);
        try{
          // простая фиксация «успеха»
          App.state = App.state || {};
          App.state.successes = App.state.successes || {};
          const K = App.starKey ? App.starKey(word.id, dictKey) : (dictKey + '#' + word.id);
          App.state.successes[K] = (App.state.successes[K]|0) + (ok ? 1 : 0);
          // наращиваем звёзды на правильном
          App.state.stars = App.state.stars || {};
          if (ok) App.state.stars[K] = Math.min((App.state.stars[K]|0)+1, starsMax());
          try{ App.saveState && App.saveState(); }catch(_){}
        }catch(_){}
        renderSets(dictKey);
        renderTrainer(dictKey);
      });
      answers.appendChild(b);
    });

    // «Не знаю»
    const idk = document.querySelector('.home-trainer .idk-btn');
    if (idk){
      idk.onclick = ()=>{
        try{
          if (App.Mistakes && App.Mistakes.push){ App.Mistakes.push(dictKey, word.id); }
        }catch(_){}
        renderTrainer(dictKey);
      };
    }

    // избранное (сердечко)
    if (favBtn){
      favBtn.setAttribute('aria-pressed', isFav(dictKey, word.id) ? 'true' : 'false');
      favBtn.onclick = ()=>{
        toggleFav(dictKey, word.id);
        favBtn.setAttribute('aria-pressed', isFav(dictKey, word.id) ? 'true' : 'false');
      };
    }

    // нижняя статистика: по всему словарю
    const deck = resolveDeckByKey(dictKey);
    const learnedAll = deck.filter(w => starOf(dictKey, w.id) >= starsMax()).length;
    statsEl.textContent = `Всего слов в словаре: ${deck.length} / Выучено: ${learnedAll}`;
  }

  // --- init ---
  function init(){
    // стартуем с де-глаголов, если ещё не выбран словарь
    if (!App.dictRegistry || !App.dictRegistry.activeKey){
      setActiveKey(START_KEY);
    }
    ensureMarkup();
    renderSets(activeKey());
    renderTrainer(activeKey());
  }

  // дождёмся onload (где высоты хедера/футера уже посчитаны)
  if (document.readyState === 'complete' || document.readyState === 'interactive'){
    setTimeout(init, 0);
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
