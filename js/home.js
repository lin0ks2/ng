/* ==========================================================
 * home.js — главная страница MOYAMOVA
 * ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  if (!app) return;

  const home = document.createElement('div');
  home.className = 'home';

  // === ЗОНА 1: Сеты ===
  renderSetsZone(home);

  // === ЗОНА 2: Подсказки ===
  renderHintsZone(home);

  // === ЗОНА 3: Тренер ===
  renderTrainerZone(home);

  app.innerHTML = '';
  app.appendChild(home);
});

/* === ЗОНА 1: Сеты === */
function renderSetsZone(container){
  const zone = document.createElement('section');
  zone.className = 'home-sets card';

  const header = document.createElement('div');
  header.className = 'sets-header';
  header.innerHTML = `<span class="flag">🇩🇪</span><h2 class="sets-title">Глаголы немецкого языка</h2>`;
  zone.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'sets-grid';

  // получаем сеты из App.Decks
  const sets = (App.Decks && App.Decks.getAllSets) ? App.Decks.getAllSets() : [];
  const totalSets = sets.length || 50;

  for (let i = 1; i <= totalSets; i++) {
    const btn = document.createElement('div');
    btn.className = 'set-pill';
    btn.textContent = i;
    grid.appendChild(btn);
  }

  zone.appendChild(grid);

  const stats = document.createElement('div');
  stats.className = 'sets-stats';
  stats.textContent = '0 / 0 слов изучено';
  zone.appendChild(stats);

  container.appendChild(zone);
}

/* === ЗОНА 2: Подсказки === */
function renderHintsZone(container){
  const zone = document.createElement('section');
  zone.className = 'home-hints card';

  const title = document.createElement('h2');
  title.className = 'hints-title';
  title.textContent = 'Подсказки';
  zone.appendChild(title);

  const body = document.createElement('div');
  body.className = 'hints-body';
  body.textContent = ''; // пока пусто
  zone.appendChild(body);

  container.appendChild(zone);
}

/* === ЗОНА 3: Тренер === */
function renderTrainerZone(container){
  const zone = document.createElement('section');
  zone.className = 'home-trainer card';
  
  // Верхняя панель: звёзды и избранное
  const top = document.createElement('div');
  top.className = 'trainer-top';
  top.innerHTML = `
    <div class="stars"></div>
    <button class="fav-toggle" aria-label="Добавить в избранное">☆</button>
  `;
  zone.appendChild(top);

  // Слово и подпись
  const wordEl = document.createElement('div');
  wordEl.className = 'trainer-word';
  zone.appendChild(wordEl);

  const subEl = document.createElement('div');
  subEl.className = 'trainer-subtitle';
  subEl.textContent = 'Выберите перевод';
  zone.appendChild(subEl);

  // Кнопки ответов
  const answersGrid = document.createElement('div');
  answersGrid.className = 'answers-grid';
  zone.appendChild(answersGrid);

  // Кнопка "Не знаю"
  const idkBtn = document.createElement('button');
  idkBtn.className = 'btn-ghost idk-btn';
  idkBtn.textContent = 'Не знаю';
  zone.appendChild(idkBtn);

  // Нижняя статистика
  const stats = document.createElement('div');
  stats.className = 'dict-stats';
  zone.appendChild(stats);

  container.appendChild(zone);

  /* === ЛОГИКА === */
  function renderWord(){
    const word = App.Trainer.getCurrentWord();
    if(!word) return;

    wordEl.textContent = word.de;
    subEl.textContent = 'Выберите перевод';

    // ответы
    answersGrid.innerHTML = '';
    const options = App.Trainer.getOptions(word);
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'answer-btn';
      btn.textContent = opt.ru;
      btn.dataset.correct = opt.isCorrect ? 'true' : 'false';

      btn.addEventListener('click', (e) => {
        const isCorrect = e.currentTarget.dataset.correct === 'true';

        if(isCorrect){
          e.currentTarget.classList.add('correct');
          App.Trainer.handleAnswer(true);
          setTimeout(() => App.Trainer.nextWord(), 500);
        } else {
          e.currentTarget.classList.add('wrong');
          e.currentTarget.disabled = true;
          App.Trainer.handleAnswer(false);
        }
      });

      answersGrid.appendChild(btn);
    });

    // "Не знаю"
    idkBtn.onclick = () => {
      const correctBtn = answersGrid.querySelector('[data-correct="true"]');
      if(correctBtn) correctBtn.classList.add('correct');
      App.Trainer.handleAnswer(null);
      setTimeout(() => App.Trainer.nextWord(), 600);
    };

    // обновляем статистику и звёзды
    stats.textContent = App.Trainer.renderStats(word);
    renderStars(word);
  }

  function renderStars(word){
    const starsBox = top.querySelector('.stars');
    const score = App.getStars(word.id);
    const max = App.Trainer.starsMax();
    starsBox.innerHTML = '';
    for(let i=0; i<max; i++){
      const star = document.createElement('span');
      star.className = 'star' + (i < score ? ' is-on' : '');
      star.textContent = '★';
      starsBox.appendChild(star);
    }
  }

  // Первичное отображение
  renderWord();
}
