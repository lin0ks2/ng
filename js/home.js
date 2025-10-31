/* ==========================================================
 * home.js — главная: сеты, тренер, статистика, избранное, ошибки
 * Источник данных — window.App.*   (core, decks, trainer, favorites, mistakes)
 * Никаких дублей ключей: используем существующие методы/хранилища
 * ========================================================== */
(function(){
  'use strict';
  const A = (window.App = window.App || {});
  const SET_SIZE = 40;

  // ---------- helpers ----------
  const starsMax = ()=> { try{ return A.Trainer && A.Trainer.starsMax ? A.Trainer.starsMax() : 5; }catch(_){ return 5; } };
  const uiLang   = ()=> { try{ return (A.settings && (A.settings.uiLang || A.settings.lang)) || 'ru'; }catch(_){ return 'ru'; } };

  function saveState(){ try{ A.saveState && A.saveState(); }catch(_){} }
  function saveFavorites(){ try{ A.Favorites && A.Favorites.save && A.Favorites.save(); }catch(_){} }

  function starKey(dictKey, id){
    try{ return A.starKey ? A.starKey(id, dictKey) : (dictKey + '#' + id); }
    catch(_){ return dictKey + '#' + id; }
  }
  function starOf(dictKey, id){
    try{ return (A.state && A.state.stars && (A.state.stars[starKey(dictKey,id)]|0)) || 0; } catch(_){ return 0; }
  }
  function incStar(dictKey, id){
    try{
      A.state = A.state || {};
      A.state.stars = A.state.stars || {};
      const k = starKey(dictKey,id);
      A.state.stars[k] = Math.min((A.state.stars[k]|0)+1, starsMax());
      saveState();
    }catch(_){}
  }

  function isFav(dictKey, id){
    try{ return !!(A.Favorites && A.Favorites.isFav && A.Favorites.isFav(uiLang(), dictKey, id)); }catch(_){ return false; }
  }
  function toggleFav(dictKey, id){
    try{
      if (A.Favorites && A.Favorites.toggle) A.Favorites.toggle(uiLang(), dictKey, id);
      else if (A.Favorites && A.Favorites.set) A.Favorites.set(uiLang(), dictKey, id, !isFav(dictKey,id));
      saveFavorites();
    }catch(_){}
  }
  function pushMistake(dictKey, id){
    try{ if (A.Mistakes && A.Mistakes.push) A.Mistakes.push(dictKey, id); }catch(_){}
  }

  // ---------- decks ----------
  function resolveDeckByKey(key){
    try{
      if (A.Decks && A.Decks.resolveDeckByKey) return A.Decks.resolveDeckByKey(key) || [];
      return [];
    }catch(_){ return []; }
  }
  function findGermanVerbsKey(){
    // Пытаемся умно найти ключ «немецкие глаголы» по доступным реестрам
    try{
      const keys = (A.Decks && A.Decks.keys) ? A.Decks.keys() : Object.keys(A.Decks || {});
      // приоритетные кандидаты по шаблонам
      const candidates = ['de_verbs','de.verbs','verbs.de','de:verbs','de-verbs','de/verbs','de'];
      for (const c of candidates){ if (resolveDeckByKey(c).length) return c; }
      // fallback: первый ключ, где lang de и в title встречается «глагол»
      for (const k of keys){
        const deck = resolveDeckByKey(k);
        if (!deck.length) continue;
        const meta = (A.Decks.meta && A.Decks.meta(k)) || {};
        const lang = meta.lang || (k.includes('de') ? 'de' : '');
        const name = (meta.title || meta.name || '').toLowerCase();
        if (lang==='de' && /глагол|verb/i.test(name)) return k;
      }
      // последний запас — первый непустой
      for (const k of keys){ if (resolveDeckByKey(k).length) return k; }
    }catch(_){}
    return 'de'; // совсем крайний случай
  }

  function getActiveKey(){
    if (A.dictRegistry && A.dictRegistry.activeKey) return A.dictRegistry.activeKey;
    const k = findGermanVerbsKey();
    A.dictRegistry = A.dictRegistry || {};
    A.dictRegistry.activeKey = k;
    try{ A.saveDictRegistry && A.saveDictRegistry(); }catch(_){}
    return k;
  }
  function setActiveKey(k){
    A.dictRegistry = A.dictRegistry || {};
    A.dictRegistry.activeKey = k;
    try{ A.saveDictRegistry && A.saveDictRegistry(); }catch(_){}
  }

  // ---------- UI build ----------
  function mountMarkup(){
    const app = document.getElementById('app');
    if (!app) return null;
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

        <section class="card home-hints" aria-labelledby="hintsTitle">
          <h4 class="hints-title" id="hintsTitle">Подсказки</h4>
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

      </div>`;
    return app.querySelector('.home');
  }

  function renderStars(el, value){
    const max = starsMax();
    el.innerHTML = '';
    for (let i=0;i<max;i++){
      const s = document.createElement('span');
      s.className = 'star' + (i < (value|0) ? ' is-on' : '');
      s.textContent = '★';
      el.appendChild(s);
    }
  }

  function currentSetIndex(dictKey, deckLen){
    const idx = Number(A.state && A.state.setByDeck && A.state.setByDeck[dictKey] || 0);
    const maxIdx = Math.max(0, Math.ceil(deckLen / SET_SIZE) - 1);
    return Math.min(idx, maxIdx);
  }

  function renderSets(dictKey){
    const deck = resolveDeckByKey(dictKey);
    const grid = document.querySelector('.home-sets .sets-grid');
    const statsEl = document.querySelector('.home-sets .sets-stats');
    const titleEl = document.querySelector('.home-sets .sets-title');
    const flagEl  = document.querySelector('.home-sets .flag');

    if (!grid || !deck) return;
    // заголовок/флаг: берём из meta (если есть)
    try{
      if (A.Decks.meta){
        const meta = A.Decks.meta(dictKey) || {};
        if (meta.title) titleEl.textContent = meta.title;
        if (meta.flag)  flagEl.textContent  = meta.flag;
      }
    }catch(_){}

    const setsCount = Math.max(1, Math.ceil(deck.length / SET_SIZE));
    grid.innerHTML = '';
    const activeIdx = currentSetIndex(dictKey, deck.length);

    for (let i=0;i<setsCount;i++){
      const from = i*SET_SIZE, to = Math.min(deck.length, (i+1)*SET_SIZE);
      const inSet = deck.slice(from, to);
      const learned = inSet.filter(w => starOf(dictKey, w.id) >= starsMax()).length;

      const b = document.createElement('button');
      b.className = 'set-pill' + (i===activeIdx ? ' is-active' : '') + (learned && learned===inSet.length ? ' is-done' : '');
      b.textContent = String(i+1);
      b.addEventListener('click', ()=>{
        if (i===activeIdx) return;
        A.state = A.state || {};
        A.state.setByDeck = A.state.setByDeck || {};
        A.state.setByDeck[dictKey] = i;
        saveState();
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

  function pickWord(dictKey){
    const deck = resolveDeckByKey(dictKey);
    const setIdx = currentSetIndex(dictKey, deck.length);
    const from = setIdx*SET_SIZE, to = Math.min(deck.length, (setIdx+1)*SET_SIZE);
    const inSet = deck.slice(from, to);
    if (!inSet.length) return null;
    const notLearned = inSet.filter(w => starOf(dictKey, w.id) < starsMax());
    const pool = notLearned.length ? notLearned : inSet;
    return pool[(Math.random()*pool.length)|0];
  }
  function pickDistractors(dictKey, correctId, count=3){
    const deck = resolveDeckByKey(dictKey);
    const ids = new Set([String(correctId)]);
    const out = [];
    while (out.length < count && deck.length){
      const w = deck[(Math.random()*deck.length)|0];
      if (!w || ids.has(String(w.id))) continue;
      ids.add(String(w.id)); out.push(w);
    }
    return out;
  }

  function renderTrainer(dictKey){
    const word = pickWord(dictKey);
    const wordEl   = document.querySelector('.home-trainer .trainer-word');
    const starsEl  = document.querySelector('.home-trainer .stars');
    const answers  = document.querySelector('.home-trainer .answers-grid');
    const statsEl  = document.querySelector('.home-trainer .dict-stats');
    const favBtn   = document.getElementById('favToggle');
    const idkBtn   = document.querySelector('.home-trainer .idk-btn');

    if (!word || !wordEl || !answers) return;

    // слово
    wordEl.textContent = word.word || word.term || String(word.id);
    renderStars(starsEl, starOf(dictKey, word.id));

    // варианты ответа
    const distractors = pickDistractors(dictKey, word.id, 3);
    const opts = [word, ...distractors].sort(()=>Math.random()-0.5);
    answers.innerHTML = '';
    opts.forEach(opt=>{
      const b = document.createElement('button');
      b.className = 'answer-btn';
      b.textContent = opt.translation || opt.trans || opt.meaning || opt.word || '';
      b.addEventListener('click', ()=>{
        const ok = String(opt.id) === String(word.id);
        if (ok) incStar(dictKey, word.id); else pushMistake(dictKey, word.id);
        renderSets(dictKey);
        renderTrainer(dictKey);
      });
      answers.appendChild(b);
    });

    // фаворит
    if (favBtn){
      favBtn.setAttribute('aria-pressed', isFav(dictKey, word.id) ? 'true' : 'false');
      favBtn.onclick = ()=>{
        toggleFav(dictKey, word.id);
        favBtn.setAttribute('aria-pressed', isFav(dictKey, word.id) ? 'true' : 'false');
      };
    }

    // «Не знаю»
    if (idkBtn){
      idkBtn.onclick = ()=>{
        pushMistake(dictKey, word.id);
        renderTrainer(dictKey);
      };
    }

    // нижняя статистика
    const deck = resolveDeckByKey(dictKey);
    const learnedAll = deck.filter(w => starOf(dictKey, w.id) >= starsMax()).length;
    statsEl.textContent = `Всего слов в словаре: ${deck.length} / Выучено: ${learnedAll}`;
  }

  // ---------- публичное API главной ----------
  A.Home = A.Home || {};
  A.Home.mount = function(){
    mountMarkup();
    const k = getActiveKey(); // стартуем с «немецких глаголов» (ищем умно)
    renderSets(k);
    renderTrainer(k);
  };

  // ---------- привязка к кнопке «Дом» ----------
  function bindHomeNav(){
    try{
      document.querySelectorAll('.app-footer .nav-btn').forEach(btn=>{
        if (btn.getAttribute('data-action') === 'home'){
          btn.addEventListener('click', ()=>{
            // вместо перезагрузки — отрисовать главную
            A.Home.mount();
          }, { passive:true });
        }
      });
    }catch(_){}
  }

  // init
  if (document.readyState === 'complete' || document.readyState === 'interactive'){
    A.Home.mount(); bindHomeNav();
  } else {
    document.addEventListener('DOMContentLoaded', function(){ A.Home.mount(); bindHomeNav(); });
  }
})();
