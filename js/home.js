/* ==========================================================
 * home.js — Главная: Сеты + Подсказки + Тренер (боевой)
 * ========================================================== */
(function(){
  'use strict';
  const A = (window.App = window.App || {});
  const ACTIVE_KEY = 'de_verbs';
  const UI = (A.settings && A.settings.lang) || 'ru';     // 'ru' | 'uk'
  const SET_SIZE = (A.Config && A.Config.setSizeDefault) || 40;

  // --- утилиты ---
  function starsMax(){ try{ return A.Trainer.starsMax(); }catch(_){ return 5; } }
  function starKey(id){ try{ return A.starKey(id, ACTIVE_KEY); }catch(_){ return ACTIVE_KEY + ':' + id; } }
  function getDeck(){ try{ return A.Decks.resolveDeckByKey(ACTIVE_KEY) || []; } catch(_){ return []; } }

  function learnedStarsOf(id){
    const s = (A.state && A.state.stars && A.state.stars[starKey(id)]) || 0;
    return Math.max(0, Math.min(starsMax(), s));
  }

  function isFav(id){
    try{
      const v2 = (A.state && A.state.favorites_v2) || {};
      const map = v2[ACTIVE_KEY] || {};
      return !!map[String(id)];
    }catch(_){ return false; }
  }
  function toggleFav(id){
    A.state = A.state || {};
    A.state.favorites_v2 = A.state.favorites_v2 || {};
    const map = A.state.favorites_v2[ACTIVE_KEY] || (A.state.favorites_v2[ACTIVE_KEY] = {});
    const k = String(id);
    map[k] = !map[k];
    A.saveState && A.saveState();
  }

  function sampleWrongAnswers(correctId, n){
    const deck = getDeck();
    const ids = new Set([String(correctId)]);
    const out = [];
    while (out.length < n && deck.length > out.length){
      const w = deck[(Math.random()*deck.length)|0];
      if (!w || ids.has(String(w.id))) continue;
      ids.add(String(w.id));
      out.push(w);
    }
    return out;
  }

  // --- разметка ---
  function mountMarkup(){
    const app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = `
      <div class="home">
        <!-- ЗОНА 1: Сеты -->
        <section class="card home-sets">
          <header class="sets-header">
            <span class="flag" aria-hidden="true">${A.Decks.flagForKey(ACTIVE_KEY) || '🇩🇪'}</span>
            <h2 class="sets-title">${A.Decks.resolveNameByKey(ACTIVE_KEY) || 'Глаголы'}</h2>
          </header>
          <div class="sets-grid"></div>
          <p class="sets-stats"></p>
        </section>

        <!-- ЗОНА 2: Подсказки -->
        <section class="card home-hints">
          <h4 class="hints-title">Подсказки</h4>
          <div class="hints-body" id="hintsBody"></div>
        </section>

        <!-- ЗОНА 3: Тренер -->
        <section class="card home-trainer">
          <div class="trainer-top" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <div class="stars" aria-label="Прогресс"></div>
            <button class="fav-toggle" title="В избранное" aria-label="Добавить в избранное">🤍</button>
          </div>
          <h3 class="trainer-word"></h3>
          <p class="trainer-subtitle">Выберите перевод</p>
          <div class="answers-grid"></div>
          <button class="btn-ghost idk-btn">Не знаю</button>
          <p class="dict-stats"></p>
        </section>
      </div>`;
  }

  // --- рендер звёзд ---
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

  // --- Зона 1: Сеты ---
  function renderSets(){
    const deck = getDeck();
    const grid = document.querySelector('.sets-grid');
    const stats = document.querySelector('.sets-stats');
    if (!grid) return;

    const totalSets = Math.max(1, Math.ceil(deck.length / SET_SIZE));
    const activeIdx = (A.Trainer && A.Trainer.getBatchIndex) ? A.Trainer.getBatchIndex(ACTIVE_KEY) : 0;
    grid.innerHTML = '';

    for (let i=0;i<totalSets;i++){
      const from = i*SET_SIZE;
      const to = Math.min(deck.length, (i+1)*SET_SIZE);
      const sub = deck.slice(from,to);
      const allLearned = sub.length>0 && sub.every(w => learnedStarsOf(w.id) >= starsMax());

      const b = document.createElement('button');
      b.className = 'set-pill' + (i===activeIdx?' is-active':'') + (allLearned?' is-done':'');
      b.textContent = String(i+1);
      b.addEventListener('click', ()=>{
        A.Trainer && A.Trainer.setBatchIndex && A.Trainer.setBatchIndex(i, ACTIVE_KEY);
        renderSets(); renderTrainer();
      });
      grid.appendChild(b);
    }

    // верхняя статистика по активному сету
    const from = activeIdx*SET_SIZE;
    const to = Math.min(deck.length, (activeIdx+1)*SET_SIZE);
    const inSet = deck.slice(from,to);
    const learned = inSet.filter(w => learnedStarsOf(w.id) >= starsMax()).length;
    stats.textContent = `Слов в наборе: ${inSet.length} / Выучено: ${learned}`;
  }

  // --- Зона 2: Подсказки ---
  function renderHints(text){
    const el = document.getElementById('hintsBody');
    if (el) el.textContent = text || ' ';
  }

  // --- Зона 3: Тренер ---
  function renderTrainer(){
    const slice = (A.Trainer && A.Trainer.getDeckSlice) ? (A.Trainer.getDeckSlice(ACTIVE_KEY) || []) : [];
    if (!slice.length){
      // нет слов в срезе — покажем только заголовки/кнопку "Не знаю"
      document.querySelector('.trainer-word').textContent = '';
      document.querySelector('.answers-grid').innerHTML = '';
      document.querySelector('.dict-stats').textContent = '';
      renderStars(document.querySelector('.stars'), 0);
      renderHints(' ');
      return;
    }

    const idx = A.Trainer.sampleNextIndexWeighted(slice);
    const word = slice[idx];

    const wordEl  = document.querySelector('.trainer-word');
    const answers = document.querySelector('.answers-grid');
    const statsEl = document.querySelector('.dict-stats');
    const favBtn  = document.querySelector('.fav-toggle');
    const idkBtn  = document.querySelector('.idk-btn');
    const starsEl = document.querySelector('.stars');

    wordEl.textContent = word.word || String(word.id);
    renderStars(starsEl, learnedStarsOf(word.id));
    favBtn.classList.toggle('is-fav', isFav(word.id));

    // варианты: 1 правильный + 3 отвлекающих
    const wrongs = sampleWrongAnswers(word.id, 3);
    const opts = [word, ...wrongs].sort(()=>Math.random()-0.5);

    answers.innerHTML = '';
    opts.forEach(opt=>{
      const b = document.createElement('button');
      b.className = 'answer-btn';
      b.textContent = opt[UI] || opt.ru || opt.uk || '';
      b.addEventListener('click', ()=>{
        const ok = String(opt.id) === String(word.id);
        if (A.Trainer && A.Trainer.handleAnswer){
          A.Trainer.handleAnswer(ACTIVE_KEY, word.id, ok);
        } else if (ok){
          // очень простой инкремент, если тренер отсутствует
          A.state = A.state || {};
          A.state.stars = A.state.stars || {};
          A.state.stars[starKey(word.id)] = Math.min(starsMax(), learnedStarsOf(word.id)+1);
          A.saveState && A.saveState();
        }
        if (!ok){
          try { A.Mistakes && A.Mistakes.push && A.Mistakes.push(ACTIVE_KEY, word.id); } catch(_){}
          renderHints(`❌ Правильно: “${word[UI] || word.ru || word.uk || ''}”`);
        } else {
          renderHints('✅ Отлично!');
        }
        renderSets(); renderTrainer();
      });
      answers.appendChild(b);
    });

    favBtn.onclick = ()=>{
      toggleFav(word.id);
      favBtn.classList.toggle('is-fav', isFav(word.id));
    };

    idkBtn.onclick = ()=>{
      try { A.Mistakes && A.Mistakes.push && A.Mistakes.push(ACTIVE_KEY, word.id); } catch(_){}
      renderHints(`Пропущено слово: “${word.word}”`);
      renderTrainer();
    };

    // нижняя статистика
    const deckAll = getDeck();
    const learnedAll = deckAll.filter(w => learnedStarsOf(w.id) >= starsMax()).length;
    statsEl.textContent = `Всего слов: ${deckAll.length} / Выучено: ${learnedAll}`;
  }

  // --- init ---
  function init(){
    // важное: зафиксировать активный словарь, иначе звёзды считаются по пустому ключу
    A.dictRegistry = A.dictRegistry || { activeKey:null, user:{} };
    A.dictRegistry.activeKey = ACTIVE_KEY;
    A.saveDictRegistry && A.saveDictRegistry();

    mountMarkup();
    renderSets();
    renderTrainer();
    renderHints(' ');
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
