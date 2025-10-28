export function pageTemplate({ title, content, backAction }) {
  const container = document.createElement('div');
  container.className = 'page-screen';

  container.innerHTML = `
    <header class="page-header">
      <button class="page-back" aria-label="Назад">←</button>
      <h2 class="page-title">${title}</h2>
    </header>

    <div class="page-content">${content}</div>

    <footer class="page-footer">
      <button class="page-close" aria-label="Закрыть">Закрыть</button>
    </footer>
  `;

  const backBtn = container.querySelector('.page-back');
  const closeBtn = container.querySelector('.page-close');
  const closeAction = () => {
    if (backAction) backAction();
    else document.getElementById('app').innerHTML = '';
  };
  backBtn.addEventListener('click', closeAction);
  closeBtn.addEventListener('click', closeAction);

  return container;
}
