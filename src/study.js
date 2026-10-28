const eye = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
const arrow = '<svg class="study-arrow" viewBox="0 0 80 56" fill="none" aria-hidden="true"><path pathLength="1" d="M55 53C55 28 24 35 25 5M17 14l8-10 8 9"/></svg>';
const descriptions = [
  { title: 'Платёжный виджет', tag: 'Поверх сайта', lead: 'Готовая форма поверх вашего сайта', text: '', points: ['Оплата проводится во всплывающем окне iframe', 'Настройка цветов платёжной формы', 'Выбор и порядок способов оплаты', 'Поддержка отправки чеков'] },
  { title: 'Платёжные блоки', tag: 'Внутри страницы', lead: 'Готовые элементы, встраиваемые прямо в ваш сайт', text: '', points: ['Способы оплаты встроены в страницу оформления заказа', 'Настройка цветов платёжных блоков', 'Выбор и порядок способов оплаты', 'Поддержка отправки чеков'] },
  { title: 'Checkout', tag: 'Ваш дизайн', lead: 'Полный контроль над формой', text: 'Вы создаёте поля, оформление и логику оплаты. CloudPayments помогает безопасно передать данные карты.', points: ['Максимальная свобода оформления', 'Свой backend для проведения платежа', 'Для интеграции нужен разработчик'] },
];
export function mountStudy(header, scenarios) {
  if (!scenarios) return () => {};
  const button = document.createElement('button');
  button.className = 'study-toggle';
  button.type = 'button';
  button.innerHTML = eye + '<span>Режим изучения</span>';
  button.setAttribute('aria-haspopup', 'dialog');
  button.setAttribute('aria-expanded', 'false');
  header.append(button);
  let dialog;
  let previousOverflow;
  function close() {
    if (!dialog) return;
    dialog.close();
  }
  function open() {
    if (dialog) return;
    dialog = document.createElement('dialog');
    dialog.className = 'study-dialog';
    dialog.setAttribute('aria-labelledby', 'study-title');
    const navigation = scenarios.cloneNode(true);
    navigation.removeAttribute('aria-label');
    navigation.querySelector('h2').remove();
    navigation.className = 'study-scenarios';
    navigation.querySelectorAll('a').forEach(link => {
      const label = document.createElement('span');
      label.className = 'study-scenario-label';
      label.textContent = link.textContent;
      link.replaceWith(label);
    });
    dialog.innerHTML = `<div class="study-shell"><div class="study-top"><div><h2 id="study-title">Рассмотрим разные платежные сценарии</h2><p>Выберите, как оплата будет выглядеть на вашем сайте</p></div><button type="button" class="study-toggle is-active" aria-label="Закрыть режим изучения">${eye}<span>Режим изучения</span><span aria-hidden="true">×</span></button></div><div class="study-navigation"></div><div class="study-grid">${descriptions.map((d, i) => `<section class="study-card" style="--study-order:${i}">${arrow}<div class="study-card-content"><h3 class="study-mobile-title">${d.title}</h3><h4>${d.lead}</h4>${d.text ? `<p>${d.text}</p>` : ''}<ul>${d.points.map(p => `<li>${p}</li>`).join('')}</ul></div></section>`).join('')}</div><div class="study-more"><a href="https://cloudpayments.ru/help/payments/bills/" target="_blank" rel="noopener noreferrer">Узнать подробнее <span aria-hidden="true">↗</span></a></div></div>`;
    dialog.querySelector('.study-navigation').append(navigation);
    dialog.querySelector('.is-active').addEventListener('click', close);
    dialog.addEventListener('click', event => {
      if (event.target === dialog) close();
    });
    const openedDialog = dialog;
    dialog.addEventListener('close', () => {
      if (dialog !== openedDialog) return;
      dialog.remove(); dialog = null;
      document.body.style.overflow = previousOverflow;
      button.setAttribute('aria-expanded', 'false');
      button.focus({ preventScroll: true });
    }, { once: true });
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.append(dialog);
    button.setAttribute('aria-expanded', 'true');
    dialog.showModal();
  }
  button.addEventListener('click', open);
  return () => {
    if (dialog) { dialog.remove(); dialog = null; document.body.style.overflow = previousOverflow; }
    button.remove();
  };
}
