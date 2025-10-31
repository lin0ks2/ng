/* ==========================================================
 * home.js — Главная: Сеты + Подсказки + Тренер
 * ========================================================== */
(function(){
  'use strict';
  const A = (window.App = window.App || {});
  const ACTIVE_KEY = 'de_verbs';
  const SET_SIZE   = A.Config?.setSizeDefault || 40;

  // перевод для кнопок вариантов (ru/uk или запасные поля)
  function currentUiLang(){
    try { return (A.settings && (A.settings.uiLang || A.settings.lang)) || 'ru'; }
    catch(_) { return 'ru'; }
  }
  function tr(w){
    const lang = currentUiLang();
    return (lang === 'uk' ? w.uk : w.ru) || w.translation || w.trans || w.meaning || '';
  }

  /* ---------- Разметка ---------- */
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
          <div class="trainer-header">
            <button class="fav-toggle" title="В избранное" aria-label="Добавить в избранное">🤍</button>
            <h3 class="trainer-word"></h3>
          </div>
          <p class="trainer-subtitle">Выберите перевод</p>
          <div class="answers-grid"></div>
          <button class="btn-ghost idk-btn">Не знаю</button>
          <p class="dict-stats"></p>
        </section>
      </div>`;
  }

  /* ---------- Зона 1: Сеты ---------- */
  function renderSets(){
    const deck = A.Decks.resolveDeckByKey(ACTIVE_KEY);
    const grid = document.querySelector('.sets-grid');
    const stats = document.querySelector('.sets-stats');
    if (!deck || !grid) return;

    const totalSets = Math.ceil(deck.length / SET_SIZE);
    const activeIdx = A.Trainer?.getBatchIndex?.(ACTIVE_KEY) || 0;
    grid.innerHTML = '';

    for (let i=0;i<totalSets;i++){
      const from = i*SET_SIZE;
      const to = Math.min(deck.length, (i+1)*SET_SIZE);
      const sub = deck.slice(from,to);
      const done = sub.length > 0 && sub.every(
        w => (A.state?.stars?.[A.starKey(w.id,ACTIVE_KEY)]||0) >= (A.Trainer?.starsMax?.() || 5)
      );

      const b = document.createElement('button');
      b.className = 'set-pill' + (i===activeIdx?' is-active':'') + (done?' is-done':'');
      b.textContent = i+1;
      b.onclick = ()=>{ 
        A.Trainer?.setBatchIndex(i,ACTIVE_KEY); 
        renderSets(); 
        renderTrainer(); 
      };
      grid.appendChild(b);
    }

    const meta = A.Trainer?.getBatchesMeta?.(ACTIVE_KEY);
    stats.textContent = `Слов в наборе: ${meta?.totalWords || 0} / Выучено: ${meta?.learnedWords || 0}`;
  }

  /* ---------- Зона 2: Подсказки ---------- */
  function renderHints(text){
    const el = document.getElementById('hintsBody');
    if (!el) return;
    el.textContent = text || ' ';
  }

  /* ---------- Зона 3: Тренер ---------- */
  function renderTrainer(){
    const slice = A.Trainer?.getDeckSlice?.(ACTIVE_KEY) || [];
    if (!slice.length) return;

    const idx = A.Trainer.sampleNextIndexWeighted(slice);
    const word = slice[idx];

    const answers = document.querySelector('.answers-grid');
    const wordEl  = document.querySelector('.trainer-word');
    const favBtn  = document.querySelector('.fav-toggle');
    const stats   = document.querySelector('.dict-stats');
    const idk     = document.querySelector('.idk-btn');

    wordEl.textContent = word.word || word.term;

    // варианты
    const wrongs = A.Decks.sampleWrongAnswers(ACTIVE_KEY, word.id, 3);
    const opts = [word, ...wrongs].sort(()=>Math.random()-0.5);
    answers.innerHTML = '';
    opts.forEach(opt=>{
      const b=document.createElement('button');
      b.className='answer-btn';
      b.textContent=tr(opt);
      b.onclick=()=>{
        const ok=String(opt.id)===String(word.id);
        if(ok) {
          A.Trainer.handleAnswer(ACTIVE_KEY, word.id, true);
          renderHints('✅ Отлично!');
        } else {
          A.Trainer.handleAnswer(ACTIVE_KEY, word.id, false);
          A.Mistakes.push(ACTIVE_KEY, word.id);
          renderHints(`❌ Правильный перевод — “${tr(word)}”.`);
        }
        renderSets(); renderTrainer();
      };
      answers.appendChild(b);
    });

    // избранное
    try {
      const has = A.Favorites.has(ACTIVE_KEY, word.id);
      favBtn.classList.toggle('is-fav', !!has);
      favBtn.onclick = ()=>{
        A.Favorites.toggle(ACTIVE_KEY, word.id);
        favBtn.classList.toggle('is-fav');
      };
    }catch(_){}

    // нижняя статистика
    const full = A.Decks.resolveDeckByKey(ACTIVE_KEY) || [];
    const learned = full.filter(w => (A.state?.stars?.[A.starKey(w.id,ACTIVE_KEY)]||0) >= (A.Trainer?.starsMax?.() || 5)).length;
    stats.textContent = `Всего слов: ${full.length} / Выучено: ${learned}`;
  }

  /* ---------- Инициализация ---------- */
  function init(){
    mountMarkup();
    renderSets();
    renderTrainer();
    renderHints(' ');
  }

  if(document.readyState!=='loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
