/* ==========================================================
 * view.dicts.js — Экран «Словари»
 * Группировка по языкам в табах, таблица словарей.
 * НЕТ побочных эффектов: только чтение App.Decks.
 * ========================================================== */

(function () {
  'use strict';
  const A = (window.App = window.App || {});
  const VIEWS = (A.Views = A.Views || {});

  /** Получить все словари из App.Decks. Возвращает
   * [{ key, lang, name, flag, count }, ...]  */
  function collectDecks() {
    const out = [];

    // 1) Нормальный путь: через registry / list / keys
    const registry = (A.Decks && (A.Decks.registry || A.Decks._registry)) || null;
    const keys = (A.Decks?.list?.() || A.Decks?.keys?.() || (registry && Object.keys(registry)) || []);

    keys.forEach((key) => {
      try {
        const items = A.Decks.resolveDeckByKey ? (A.Decks.resolveDeckByKey(key) || []) : (registry?.[key]?.items || []);
        const name  = A.Decks.resolveNameByKey ? A.Decks.resolveNameByKey(key) : (registry?.[key]?.name || key);
        const flag  = A.Decks.flagForKey ? A.Decks.flagForKey(key) : (registry?.[key]?.flag || '🏳️');
        const lang  = (registry?.[key]?.lang) || key.split('_')[0]; // fallback: префикс до "_"
        out.push({ key, lang, name, flag, count: items.length|0 });
      } catch(_){}
    });

    // 2) Фоллбек: если ничего не нашли
    if (!out.length) {
      // попробуем самые известные ключи
      ['de_verbs','de_nouns','en_verbs','en_nouns'].forEach((key)=>{
        try {
          const items = (A.Decks?.resolveDeckByKey?.(key) || []);
          if (items.length) {
            out.push({
              key,
              lang: key.split('_')[0],
              name: A.Decks?.resolveNameByKey?.(key) || key,
              flag: A.Decks?.flagForKey?.(key) || (key.startsWith('de') ? '🇩🇪' : '🏳️'),
              count: items.length
            });
          }
        } catch(_){}
      });
    }

    return out;
  }

  /** Группировка по языку */
  function groupByLang(rows) {
    const m = new Map();
    rows.forEach(r => {
      if (!m.has(r.lang)) m.set(r.lang, []);
      m.get(r.lang).push(r);
    });
    // сортировка по имени словаря внутри вкладки
    for (const arr of m.values()) arr.sort((a,b)=>a.name.localeCompare(b.name, 'ru'));
    return m;
  }

  /** Отрисовать вкладки языков */
  function renderTabs(root, langs, activeLang, onPick) {
    const wrap = document.createElement('div');
    wrap.className = 'dicts-tabs';

    langs.forEach(lang => {
      const meta = langMeta(lang);
      const btn = document.createElement('button');
      btn.className = 'dicts-tab' + (lang === activeLang ? ' active' : '');
      btn.innerHTML = `<span class="flag">${meta.flag}</span><span>${meta.title}</span>`;
      btn.addEventListener('click', () => onPick(lang), { passive: true });
      wrap.appendChild(btn);
    });

    root.appendChild(wrap);
  }

  /** Таблица словарей по языку */
  function renderTable(root, rows) {
    const card = document.createElement('div');
    card.className = 'dicts-card';

    if (!rows.length) {
      const empty = document.createElement('div');
      empty.className = 'dicts-empty';
      empty.textContent = 'Словари не найдены.';
      card.appendChild(empty);
      root.appendChild(card);
      return;
    }

    const table = document.createElement('table');
    table.className = 'dicts-table';

    table.innerHTML = `
      <thead>
        <tr>
          <th>Словарь</th>
          <th>Слов</th>
          <th></th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    rows.forEach(r => {
      const tr = document.createElement('tr');

      // Имя словаря + флаг
      const tdName = document.createElement('td');
      tdName.className = 'dicts-name';
      tdName.innerHTML = `<span class="flag">${r.flag}</span><span>${r.name}</span>`;
      tr.appendChild(tdName);

      // Кол-во слов
      const tdCount = document.createElement('td');
      tdCount.className = 'dicts-count';
      tdCount.textContent = String(r.count);
      tr.appendChild(tdCount);

      // Предпросмотр
      const tdAct = document.createElement('td');
      tdAct.style.textAlign = 'right';

      const btn = document.createElement('button');
      btn.className = 'dicts-preview-btn';
      btn.textContent = 'Предпросмотр';
      btn.addEventListener('click', () => {
        // Плейсхолдер: вешаем позже реальный превью
        alert(`Предпросмотр: ${r.name} (${r.count} слов)`);
      });
      tdAct.appendChild(btn);

      tr.appendChild(tdAct);
      tbody.appendChild(tr);
    });

    card.appendChild(table);
    root.appendChild(card);
  }

  /** Метаданные языка для таба (RU интерфейс) */
  function langMeta(code) {
    switch (code) {
      case 'de': return { title: 'Немецкий', flag: '🇩🇪' };
      case 'en': return { title: 'Английский', flag: '🇬🇧' };
      case 'uk': return { title: 'Украинский', flag: '🇺🇦' };
      case 'ru': return { title: 'Русский',   flag: '🇷🇺' };
      case 'es': return { title: 'Испанский', flag: '🇪🇸' };
      case 'fr': return { title: 'Французский', flag: '🇫🇷' };
      case 'it': return { title: 'Итальянский', flag: '🇮🇹' };
      default:   return { title: code.toUpperCase(), flag: '🏳️' };
    }
  }

  /** Публичный API экрана */
  VIEWS.DictList = {
    /** Рендерит экран «Словари» в #app */
    init() {
      const app = document.getElementById('app');
      if (!app) return;

      // собираем данные
      const decks = collectDecks();
      const byLang = groupByLang(decks);
      const langs = Array.from(byLang.keys());
      if (!langs.length) {
        app.innerHTML = `<div class="dicts"><div class="dicts-card"><div class="dicts-empty">Словари не найдены.</div></div></div>`;
        return;
      }

      // активная вкладка — первая по списку
      let activeLang = langs[0];

      // корневой контейнер
      const root = document.createElement('div');
      root.className = 'dicts';

      // функции отрисовки
      const render = () => {
        root.innerHTML = '';
        renderTabs(root, langs, activeLang, (lang) => { activeLang = lang; render(); });
        renderTable(root, byLang.get(activeLang) || []);
      };

      // первый проход
      render();

      // монтируем
      app.innerHTML = '';
      app.appendChild(root);
    }
  };
})();
