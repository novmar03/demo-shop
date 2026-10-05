import { checkoutForm, mountCheckout } from './checkout.js?v=20261005-1340';
import { handlePaymentReturn } from './payment-result.js?v=20261005-1039';
import { mountBlocks } from './blocks.js';
import { openPayment } from './payment.js';
import { products } from './products.js';
import { STORAGE_KEY, loadCart, saveCart, updateCart, orderSnapshot } from './cart.js';
import { money, productCount, icon, productImage, quantityControls, productCard } from './ui.js?v=20261005-1';

const basePath = new URL('../', import.meta.url).pathname;
const cartPath = `${basePath}cart/`;
const checkoutPath = `${basePath}checkout/`;
const blocksPath = `${basePath}payment-blocks/`;
let disposeBlocks = () => {};
const app = document.querySelector('#app');
const cartLink = document.querySelector('#cart-link');
document.querySelector('.brand').href = basePath;
cartLink.href = cartPath;
let storage;
try { storage = window.localStorage; } catch {}
let cart = loadCart(storage);
let toastTimer;
let paymentPending = false;

function toast(message) {
  const el = document.querySelector('#toast');
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), 4500);
}

function render({ focusHeading = false } = {}) {
  disposeBlocks();
  disposeBlocks = () => {};
  const order = orderSnapshot(cart);
  cartLink.innerHTML = `${icon('cart')}<span>Купить</span>${order.itemCount ? `<span class="cart-count">${order.itemCount}</span>` : ''}`;
  cartLink.setAttribute('aria-label', `Купить — корзина: ${productCount(order.itemCount)}`);
  const pathname = location.pathname.replace(/index\.html$/, '').replace(/\/$/, '');
  const isBlocks = pathname === blocksPath.replace(/\/$/, '');
  const isCheckout = pathname === checkoutPath.replace(/\/$/, '');
  const isCart = isCheckout || isBlocks || pathname === cartPath.replace(/\/$/, '');
  document.title = isCart ? `${isCheckout ? 'Check-out' : isBlocks ? 'Платежные блоки' : 'Виджет'} — Демо-магазин` : 'Демо-магазин — CloudPayments';
  if (isCart) cartLink.setAttribute('aria-current', 'page');
  else cartLink.removeAttribute('aria-current');

  if (!isCart) {
    app.innerHTML = `<section class="promo" aria-labelledby="promo-title">
      <h1 id="promo-title" class="promo-mobile-title" tabindex="-1">Прием платежей для цифровых товаров и услуг</h1>
      <p class="promo-mobile-details">Быстрое подключение за 1 ₽ · Прием платежей и фискализация по 54-ФЗ · Платежи по подписке, в том числе через СБП</p>
      <a class="promo-connect" href="https://cloudpayments.ru/" aria-label="Подключить CloudPayments"><span>Подключить</span></a>
    </section>
    <div class="section-heading"><div><h2>Каталог</h2></div><span class="catalog-count">${productCount(products.length)}</span></div>
    <section class="catalog" aria-label="Каталог товаров">${products.map(p => productCard(p, cart.find(i => i.id === p.id)?.quantity || 0)).join('')}</section>
    <p class="catalog-note">Демонстрационный каталог. Цены приведены для примера.</p>`;
  } else {
    app.innerHTML = `<a class="back" href="${basePath}" data-nav>${icon('arrow')}Продолжить покупки</a><h1 class="cart-title" tabindex="-1">${isCheckout ? 'Check-out' : isBlocks ? 'Платежные блоки' : 'Виджет'} <span>${productCount(order.itemCount)}</span></h1>` + (order.items.length ? `<div class="cart-layout">
      <section class="cart-items" aria-label="Выбранные товары">${order.items.map(p => `<article class="cart-row" data-product-id="${p.id}">
        ${productImage(p, 'cart-image')}
        <div class="item-details"><h2>${p.name}</h2><p>${money(p.price)} за шт.</p><button type="button" class="remove" data-action="remove" data-id="${p.id}" aria-label="Удалить из корзины: ${p.name}">${icon('trash')}Удалить</button></div>
        ${quantityControls(p, p.quantity)}<strong class="subtotal">${money(p.subtotal)}</strong>
      </article>`).join('')}</section>
      <aside class="summary" aria-labelledby="summary-title"><h2 id="summary-title">Ваш заказ</h2><p class="summary-line"><span>Товары</span><span>${order.itemCount} шт.</span></p><div class="total"><span>Итого</span><strong>${money(order.totalAmount)}</strong></div>${isCheckout ? checkoutForm(order) : isBlocks ? '<div id="payment-blocks" class="payment-blocks"><p role="status">Загружаем способы оплаты…</p></div>' : '<button type="button" class="button pay" data-pay>Оплатить</button>'}<p class="summary-note">Оплата через CloudPayments</p></aside>
    </div>` : `<section class="empty"><span class="empty-icon">${icon('cart')}</span><h2>Ваша корзина пуста</h2><p>Добавьте понравившиеся товары из каталога</p><a href="${basePath}" data-nav class="button">Перейти в каталог</a></section>`);
  }
  if (isCart) app.insertAdjacentHTML('beforeend', `<nav class="payment-scenarios" aria-label="Платежные сценарии"><h2>Платежные сценарии</h2><div class="scenario-buttons"><a class="button scenario-button" href="${cartPath}" data-nav ${!isBlocks && !isCheckout ? 'aria-current="page"' : ''}>Виджет</a><a class="button scenario-button" href="${blocksPath}" data-nav ${isBlocks ? 'aria-current="page"' : ''}>Платежные блоки</a><a class="button scenario-button" href="${checkoutPath}" data-nav ${isCheckout ? 'aria-current="page"' : ''}>Check-out</a></div></nav>`);
  if (isCart) app.querySelector('.cart-title').before(app.querySelector('.payment-scenarios'));
  if (isBlocks && order.items.length) {
    disposeBlocks = mountBlocks(document.querySelector('#payment-blocks'), order, (snapshot, result) => {
      window.dispatchEvent(new CustomEvent('demo-store:payment-result', { detail: { order: snapshot, result } }));
      toast(result.status === 'success' ? 'CloudPayments сообщает об успешной оплате.' : 'Оплата не завершена. Попробуйте ещё раз.');
    });
  }
  if (isCheckout && order.items.length) disposeBlocks = mountCheckout(document.querySelector('#checkout-form'), order);
  if (focusHeading) app.querySelector('h1')?.focus({ preventScroll: true });
}

document.addEventListener('click', async event => {
  if (event.target.closest('[data-retry-blocks]')) { render(); return; }
  const nav = event.target.closest('[data-nav]');
  if (nav && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0) {
    event.preventDefault();
    history.pushState({}, '', nav.getAttribute('href'));
    render({ focusHeading: true });
    window.scrollTo(0, 0);
    return;
  }
  const action = event.target.closest('[data-action]');
  if (action && !action.disabled) {
    const id = Number(action.dataset.id);
    const kind = action.dataset.action;
    cart = updateCart(cart, id, kind);
    const persisted = saveCart(storage, cart);
    const product = products.find(p => p.id === id);
    const quantity = cart.find(p => p.id === id)?.quantity || 0;
    render();
    const target = app.querySelector(`[data-action="${kind}"][data-id="${id}"]:not(:disabled)`)
      || app.querySelector(`[data-action="add"][data-id="${id}"]:not(:disabled)`)
      || app.querySelector('.back');
    target?.focus({ preventScroll: true });
    toast(persisted ? (quantity ? `${product.name}. В корзине: ${quantity} шт.` : `${product.name}: товар удалён из корзины.`) : 'Корзина обновлена. Браузер не разрешает сохранить её после закрытия страницы.');
    return;
  }
  if (event.target.closest('[data-pay]')) {
    if (paymentPending) return;
    paymentPending = true;
    const button = event.target.closest('[data-pay]');
    button.disabled = true;
    button.textContent = 'Открываем оплату…';
    const order = orderSnapshot(cart);
    window.dispatchEvent(new CustomEvent('demo-store:checkout', { detail: order }));
    try {
      const result = await openPayment(order);
      window.dispatchEvent(new CustomEvent('demo-store:payment-result', { detail: { order, result } }));
      if (result?.status === 'success') toast('CloudPayments сообщает об успешной оплате.');
      else if (result?.type === 'cancel') toast('Форма оплаты закрыта. Корзина сохранена.');
      else if (result?.type === 'error' || result?.status === 'fail') toast('Оплата не завершена. Попробуйте ещё раз.');
    } catch {
      toast('Не удалось открыть оплату. Проверьте соединение и попробуйте ещё раз.');
    } finally {
      paymentPending = false;
      const currentButton = app.querySelector('[data-pay]');
      if (currentButton) {
        currentButton.disabled = false;
        currentButton.textContent = 'Оплатить';
      }
    }
  }
});
window.addEventListener('popstate', () => render({ focusHeading: true }));
window.addEventListener('storage', event => {
  if (event.key === STORAGE_KEY || event.key === null) {
    cart = loadCart(storage);
    render();
  }
});
render();
handlePaymentReturn();
