/* ==========================================================
 * home.js — Главная: Сеты + Подсказки + Тренер (боевой)
 * ========================================================== */
(function () {
  'use strict';
  const A = (window.App = window.App || {});

  // ——— Константы проекта
  const ACTIVE_KEY = 'de_verbs';                         // стартуем с немецких глаголов
  const SET_SIZE   = (A.Config && A.Config.setSizeDefault) || 40;
  const STARS_MAX  = (A.Trainer && A.Trainer.starsMax && A.Trainer.starsMax()) || 5;

  // ——— Утилиты
  const getDeck = () => {
    try { return A.Decks.resolveDeckByKey(ACTIVE_KEY) || []; }
    catch { return []; }
  };
  const starKey = (id) => {
    try { return A.starKey(id, ACTIVE_KEY); }
    catch { return `${ACTIVE_KEY}#${id}`; }
  };
  const starsOf = (id) => {
    try { return Math.max(0, Math.min(STARS_MAX, (A.state?.stars?.[starKey(id)] || 0))); }
    catch { return 0; }
  };

  function isFav(id){
    try {
      if (A.Favorites?.isFav) return !!A.Favorites.isFav(ACTIVE_KEY, id);
      const map = A.state?.favorites_v2?.[ACTIVE_KEY] || {};
      return !!map[String(id)];
    } catch { return false; }
  }
  function toggleFav(id){
    try {
      if (A.Favorites?.toggle) { A.Favorites.toggle(ACTIVE_KEY, id); return; }
    } catch {}
    // fallback на state.favorites_v2
    A.state = A.state || {};
    A.state.favorites_v2 = A.state.favorites_v2 || {};
    const map = A.state.favorites_v2[ACTIVE_KEY] || (A.state.favorites_v2[ACTIVE_KEY] = {});
    const k = String(id);
    map[k] = !map[k];
    A.saveState && A.saveState();
  }

  function sampleWrongAnswers(correctId, n){
    const deck = getDeck();
    const out = [];
    const used = new Set([String(correctId)]);
    while (out.length < n && out.length < deck.length - 1){
      const w = deck[(Math.random()*deck.length)|0];
      if (!w || used.has(String(w.id))) continue;
      used.add(String(w.id));
      out.push(w);
    }
    return out;
  }

  // ——— Разметка (три зоны)
  function mountMarkup(){
    const app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = `
      <div class="home">
        <!-- ЗОНА 1: Сеты -->
        <section class="card home-sets">
          <header class="sets-header">
            <span class="flag" aria-hidden="true">${A.Decks?.flagForKey?.(ACTIVE_KEY) || '🇩🇪'}</span>
            <h2 class="sets-title">${A.Decks?.resolveNameByKey?.(ACTIVE_KEY) || 'Глаголы'}</h2>
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

  // ——— Зона 1: Сеты
  function renderSets(){
    const deck = getDeck();
    const grid  = document.querySelector('.sets-grid');
    const stats = document.querySelector('.sets-stats');
    if (!grid) return;

    const totalSets = Math.max(1, Math.ceil(deck.length / SET_SIZE));
    const activeIdx = A.Trainer?.getBatchIndex?.(ACTIVE_KEY) || 0;

    grid.innerHTML = '';
    for (let i=0;i<totalSets;i++){
      const from = i*SET_SIZE, to = Math.min(deck.length, (i+1)*SET_SIZE);
      const sub = deck.slice(from, to);
      const allLearned = sub.length>0 && sub.every(w => starsOf(w.id) >= STARS_MAX);

      const btn = document.createElement('button');
      btn.className = 'set-pill' + (i===activeIdx ? ' is-active' : '') + (allLearned ? ' is-done' : '');
      btn.textContent = String(i+1);
      btn.addEventListener('click', ()=>{
        A.Trainer?.setBatchIndex?.(i, ACTIVE_KEY);
        renderSets(); renderTrainer();
      });
      grid.appendChild(btn);
    }

    // верхняя статистика по активному сету
    const from = activeIdx*SET_SIZE, to = Math.min(deck.length, (activeIdx+1)*SET_SIZE);
    const sub = deck.slice(from, to);
    const learned = sub.filter(w => starsOf(w.id) >= STARS_MAX).length;
    stats.textContent = `Слов в наборе: ${sub.length} / Выучено: ${learned}`;
  }

  // ——— Зона 2: Подсказки
  function renderHints(text){
    const el = document.getElementById('hintsBody');
    if (el) el.textContent = text || ' ';
  }

  // ——— Зона 3: Тренер
  function renderTrainer(){
    const slice = A.Trainer?.getDeckSlice?.(ACTIVE_KEY) || [];
    const wordEl  = document.querySelector('.trainer-word');
    const answers = document.querySelector('.answers-grid');
    const statsEl = document.querySelector('.dict-stats');
    const favBtn  = document.querySelector('.fav-toggle');
    const idkBtn  = document.querySelector('.idk-btn');
    const starsEl = document.querySelector('.stars');

    if (!slice.length){
      if (wordEl)   wordEl.textContent = '';
      if (answers)  answers.innerHTML = '';
      if (statsEl)  statsEl.textContent = '';
      if (starsEl)  starsEl.innerHTML = '';
      renderHints(' ');
      return;
    }

    const idx  = A.Trainer.sampleNextIndexWeighted(slice);
    const word = slice[idx];

    // слово+звёзды+избранное
    wordEl.textContent = word.word || String(word.id);
    renderStars(starsEl, starsOf(word.id));
    favBtn.classList.toggle('is-fav', isFav(word.id));
    favBtn.onclick = () => {
      toggleFav(word.id);
      favBtn.classList.toggle('is-fav', isFav(word.id));
    };

    // варианты ответов: RU-жёстко
    const wrongs = sampleWrongAnswers(word.id, 3);
    const opts = [word, ...wrongs].sort(() => Math.random() - 0.5);
    answers.innerHTML = '';
    opts.forEach(opt => {
      const b = document.createElement('button');
      b.className = 'answer-btn';
      b.textContent = opt.ru || '';
      b.onclick = () => {
        const ok = String(opt.id) === String(word.id);
        if (A.Trainer?.handleAnswer) {
          A.Trainer.handleAnswer(ACTIVE_KEY, word.id, ok);
        } else if (ok) {
          // минимальный фоллбек на случай отсутствия handleAnswer
          A.state = A.state || {};
          A.state.stars = A.state.stars || {};
          A.state.stars[starKey(word.id)] = Math.min(STARS_MAX, starsOf(word.id) + 1);
          A.saveState && A.saveState();
        }
        if (ok) renderHints('✅ Отлично!');
        else {
          try { A.Mistakes?.push?.(ACTIVE_KEY, word.id); } catch {}
          renderHints(`❌ Правильно: “${word.ru || ''}”`);
        }
        renderSets(); renderTrainer();
      };
      answers.appendChild(b);
    });

    // «Не знаю»
    idkBtn.onclick = () => {
      try { A.Mistakes?.push?.(ACTIVE_KEY, word.id); } catch {}
      renderHints(`Пропущено слово: “${word.word}”`);
      renderTrainer();
    };

    // нижняя статистика по всему словарю
    const all = getDeck();
    const learnedAll = all.filter(w => starsOf(w.id) >= STARS_MAX).length;
    statsEl.textContent = `Всего слов: ${all.length} / Выучено: ${learnedAll}`;
  }

  // ——— Звёзды (отрисовка)
  function renderStars(el, value){
    const max = STARS_MAX;
    el.innerHTML = '';
    for (let i = 0; i < max; i++){
      const s = document.createElement('span');
      s.className = 'star' + (i < (value|0) ? ' is-on' : '');
      s.textContent = '★';
      el.appendChild(s);
    }
  }

  // ——— Инициализация
  function init(){
    // фиксируем активный словарь (важно для ключей прогресса)
    A.dictRegistry = A.dictRegistry || { activeKey: null, user: {} };
    A.dictRegistry.activeKey = ACTIVE_KEY;
    A.saveDictRegistry && A.saveDictRegistry();

    // если тренер не знает текущий сет — выставим 0
    try {
      if ((A.Trainer.getBatchIndex?.(ACTIVE_KEY) ?? -1) < 0){
        A.Trainer.setBatchIndex?.(0, ACTIVE_KEY);
      }
    } catch {}

    mountMarkup();
    renderSets();
    renderTrainer();
    renderHints(' ');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
