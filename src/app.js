import { products } from './products.js';
import { STORAGE_KEY, loadCart, saveCart, updateCart, orderSnapshot } from './cart.js';
import { money, productCount, icon, productImage, quantityControls, productCard } from './ui.js';

const basePath = new URL('../', import.meta.url).pathname;
const cartPath = `${basePath}cart/`;
const app = document.querySelector('#app');
const cartLink = document.querySelector('#cart-link');
document.querySelector('.brand').href = basePath;
cartLink.href = cartPath;
let storage;
try { storage = window.localStorage; } catch {}
let cart = loadCart(storage);
let toastTimer;

function toast(message) {
  const el = document.querySelector('#toast');
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), 4500);
}

function render({ focusHeading = false } = {}) {
  const order = orderSnapshot(cart);
  cartLink.innerHTML = `${icon('cart')}<span>Корзина</span>${order.itemCount ? `<span class="cart-count">${order.itemCount}</span>` : ''}`;
  cartLink.setAttribute('aria-label', `Корзина: ${productCount(order.itemCount)}`);
  const pathname = location.pathname.replace(/index\.html$/, '').replace(/\/$/, '');
  const isCart = pathname === cartPath.replace(/\/$/, '');
  document.title = isCart ? 'Корзина — Демо-магазин' : 'Демо-магазин — CloudPayments';
  if (isCart) cartLink.setAttribute('aria-current', 'page');
  else cartLink.removeAttribute('aria-current');

  if (!isCart) {
    app.innerHTML = `<section class="promo" aria-labelledby="promo-title">
      <div class="promo-copy"><span class="eyebrow">ДЕМО-МАГАЗИН</span><h1 id="promo-title" tabindex="-1">Приятные покупки.<br>Простая оплата.</h1><p>Выбирайте то, что нравится.<br class="mobile-break"> Всё остальное — с CloudPayments.</p></div>
      <div class="promo-art" aria-hidden="true"><div class="promo-orbit"></div><div class="demo-card"><span>ПОКУПКИ В УДОВОЛЬСТВИЕ</span><strong>Всё начинается<br>с одного выбора.</strong><div class="demo-card-bottom"><span>Добавьте в корзину</span>${icon('cart')}</div></div></div>
    </section>
    <div class="section-heading"><div><span class="eyebrow section-eyebrow">ДЛЯ РАБОТЫ И ОТДЫХА</span><h2>Выберите своё</h2></div><span class="catalog-count">${productCount(products.length)}</span></div>
    <section class="catalog" aria-label="Каталог товаров">${products.map(p => productCard(p, cart.find(i => i.id === p.id)?.quantity || 0)).join('')}</section>
    <p class="catalog-note">Демонстрационный каталог. Цены приведены для примера.</p>`;
  } else {
    app.innerHTML = `<a class="back" href="${basePath}" data-nav>${icon('arrow')}Продолжить покупки</a><h1 class="cart-title" tabindex="-1">Корзина <span>${productCount(order.itemCount)}</span></h1>` + (order.items.length ? `<div class="cart-layout">
      <section class="cart-items" aria-label="Выбранные товары">${order.items.map(p => `<article class="cart-row" data-product-id="${p.id}">
        ${productImage(p, 'cart-image')}
        <div class="item-details"><h2>${p.name}</h2><p>${money(p.price)} за шт.</p><button type="button" class="remove" data-action="remove" data-id="${p.id}" aria-label="Удалить из корзины: ${p.name}">${icon('trash')}Удалить</button></div>
        ${quantityControls(p, p.quantity)}<strong class="subtotal">${money(p.subtotal)}</strong>
      </article>`).join('')}</section>
      <aside class="summary" aria-labelledby="summary-title"><h2 id="summary-title">Ваш заказ</h2><p class="summary-line"><span>Товары</span><span>${order.itemCount} шт.</span></p><div class="total"><span>Итого</span><strong>${money(order.totalAmount)}</strong></div><button type="button" class="button pay" data-pay>Оплатить</button><p class="summary-note">Демо-режим: деньги не списываются</p></aside>
    </div>` : `<section class="empty"><span class="empty-icon">${icon('cart')}</span><h2>Ваша корзина пуста</h2><p>Добавьте понравившиеся товары из каталога</p><a href="${basePath}" data-nav class="button">Перейти в каталог</a></section>`);
  }
  if (focusHeading) app.querySelector('h1')?.focus({ preventScroll: true });
}

document.addEventListener('click', event => {
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
    window.dispatchEvent(new CustomEvent('demo-store:checkout', { detail: orderSnapshot(cart) }));
    toast('Оплата будет доступна на следующем этапе. Сейчас деньги не списываются.');
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
