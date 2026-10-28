import { mountStudy } from './study.js?v=20261028-study-v5';
import { checkoutForm, mountCheckout } from './checkout.js?v=20261028-clean';
import { handlePaymentReturn } from './payment-result.js?v=20261028-cart-clear';
import { mountBlocks } from './blocks.js';
import { openPayment } from './payment.js?v=20261028-classic';
import { products } from './products.js?v=20261028-merch';
import { landingPage, mountLanding, landingLogo, applicationUrl } from './landing.js?v=20261028-merch';
import { STORAGE_KEY, loadCart, saveCart, updateCart, orderSnapshot } from './cart.js?v=20261028-merch';
import { money, productCount, icon, productImage, quantityControls, productCard } from './ui.js?v=20261028-merch';

const basePath = new URL('../', import.meta.url).pathname;
const cartPath = `${basePath}cart/`;
const checkoutPath = `${basePath}checkout/`;
const blocksPath = `${basePath}payment-blocks/`;
let disposeBlocks = () => {};
let disposeLanding = () => {};
let disposeStudy = () => {};
const app = document.querySelector('#app');
const cartLink = document.querySelector('#cart-link');
document.querySelector('.brand').href = basePath;
cartLink.href = cartPath;
const brandLogo = document.querySelector('.brand-logo');
const originalLogo = brandLogo.src;
document.querySelector('.site-header').insertAdjacentHTML('beforeend', `<button class="landing-menu-toggle" type="button" aria-label="Навигационное меню" aria-expanded="false" aria-controls="landing-navigation"><span></span><span></span><span></span></button><nav id="landing-navigation" class="landing-navigation" aria-label="Навигация по лендингу"><a href="${basePath}#demo-shop">Демомагазин</a><a href="${basePath}#about">О нас</a><a class="landing-apply" href="${applicationUrl}" target="_blank" rel="noopener">Оставить заявку</a></nav>`);
let storage;
try { storage = window.localStorage; } catch {}
let cart = loadCart(storage);
let toastTimer;
let paymentPending = false;

function clearCart() {
  cart = [];
  saveCart(storage, cart);
}

function updateCartLink(order) {
  cartLink.innerHTML = `${icon('cart')}<span>Купить</span>${order.itemCount ? `<span class="cart-count">${order.itemCount}</span>` : ''}`;
  cartLink.setAttribute('aria-label', `Купить — корзина: ${productCount(order.itemCount)}`);
}

function toast(message) {
  const el = document.querySelector('#toast');
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), 4500);
}

function render({ focusHeading = false } = {}) {
  disposeStudy();
  disposeStudy = () => {};
  disposeLanding();
  disposeLanding = () => {};
  disposeBlocks();
  disposeBlocks = () => {};
  const order = orderSnapshot(cart);
  updateCartLink(order);
  const pathname = location.pathname.replace(/index\.html$/, '').replace(/\/$/, '');
  const isBlocks = pathname === blocksPath.replace(/\/$/, '');
  const isCheckout = pathname === checkoutPath.replace(/\/$/, '');
  const isCart = isCheckout || isBlocks || pathname === cartPath.replace(/\/$/, '');
  document.body.classList.toggle('is-landing', !isCart);
  // A backdrop-filter on the header creates a containing block for fixed children.
  // Keep the floating cart at body level so it stays anchored to the viewport.
  (isCart ? document.querySelector('.site-header') : document.body).append(cartLink);
  brandLogo.src = isCart ? originalLogo : landingLogo;
  document.querySelector('.landing-navigation').classList.remove('is-open');
  document.querySelector('.landing-menu-toggle').setAttribute('aria-expanded', 'false');
  document.title = isCart ? `${isCheckout ? 'Checkout' : isBlocks ? 'Платежные блоки' : 'Виджет'} — Демо-магазин` : 'Демо-магазин — CloudPayments';
  if (isCart) cartLink.setAttribute('aria-current', 'page');
  else cartLink.removeAttribute('aria-current');

  if (!isCart) {
    app.innerHTML = landingPage(products, cart, basePath);
    disposeLanding = mountLanding(app);
  } else {
    app.innerHTML = `<a class="back" href="${basePath}" data-nav>${icon('arrow')}Продолжить покупки</a><h1 class="cart-title" tabindex="-1">${isCheckout ? 'Checkout' : isBlocks ? 'Платежные блоки' : 'Виджет'} <span>${productCount(order.itemCount)}</span></h1>` + (order.items.length ? `<div class="cart-layout">
      <section class="cart-items" aria-label="Выбранные товары">${order.items.map(p => `<article class="cart-row" data-product-id="${p.id}">
        ${productImage(p, 'cart-image')}
        <div class="item-details"><h2>${p.name}</h2><p>${money(p.price)} за шт.</p><button type="button" class="remove" data-action="remove" data-id="${p.id}" aria-label="Удалить из корзины: ${p.name}">${icon('trash')}Удалить</button></div>
        ${quantityControls(p, p.quantity)}<strong class="subtotal">${money(p.subtotal)}</strong>
      </article>`).join('')}</section>
      <aside class="summary" aria-labelledby="summary-title"><h2 id="summary-title">Ваш заказ</h2><p class="summary-line"><span>Товары</span><span>${order.itemCount} шт.</span></p><div class="total"><span>Итого</span><strong>${money(order.totalAmount)}</strong></div>${isCheckout ? checkoutForm(order) : isBlocks ? '<div id="payment-blocks" class="payment-blocks"><p role="status">Загружаем способы оплаты…</p></div>' : '<button type="button" class="button pay" data-pay>Оплатить</button>'}<p class="summary-note">Оплата через CloudPayments</p></aside>
    </div>` : `<section class="empty"><span class="empty-icon">${icon('cart')}</span><h2>Ваша корзина пуста</h2><p>Добавьте понравившиеся товары из каталога</p><a href="${basePath}" data-nav class="button">Перейти в каталог</a></section>`);
  }
  if (isCart) app.insertAdjacentHTML('beforeend', `<nav class="payment-scenarios" aria-label="Платежные сценарии"><h2>Платежные сценарии</h2><div class="scenario-buttons"><a class="button scenario-button" href="${cartPath}" data-nav ${!isBlocks && !isCheckout ? 'aria-current="page"' : ''}>Виджет</a><a class="button scenario-button" href="${blocksPath}" data-nav ${isBlocks ? 'aria-current="page"' : ''}>Платежные блоки</a><a class="button scenario-button" href="${checkoutPath}" data-nav ${isCheckout ? 'aria-current="page"' : ''}>Checkout</a></div></nav>`);
  if (isCart) app.querySelector('.cart-title').before(app.querySelector('.payment-scenarios'));
  if (isCart) disposeStudy = mountStudy(document.querySelector('.site-header'), app.querySelector('.payment-scenarios'));
  if (isBlocks && order.items.length) {
    disposeBlocks = mountBlocks(document.querySelector('#payment-blocks'), order, (snapshot, result) => {
      window.dispatchEvent(new CustomEvent('demo-store:payment-result', { detail: { order: snapshot, result } }));
      toast(result.status === 'success' ? 'CloudPayments сообщает об успешной оплате.' : 'Оплата не завершена. Попробуйте ещё раз.');
      if (result.status === 'success') {
        clearCart();
        render();
      }
    });
  }
  if (isCheckout && order.items.length) disposeBlocks = mountCheckout(document.querySelector('#checkout-form'), order);
  if (focusHeading) app.querySelector('h1')?.focus({ preventScroll: true });
}

document.addEventListener('click', async event => {
  const menuToggle = event.target.closest('.landing-menu-toggle');
  if (menuToggle) {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open));
    document.querySelector('.landing-navigation').classList.toggle('is-open', open);
    return;
  }
  if (event.target.closest('.landing-navigation a')) {
    document.querySelector('.landing-navigation').classList.remove('is-open');
    document.querySelector('.landing-menu-toggle').setAttribute('aria-expanded', 'false');
  }
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
    if (document.body.classList.contains('is-landing')) {
      // Keep the existing artwork mounted so adding an item cannot flash or reload it.
      const card = app.querySelector(`.product[data-product-id="${id}"]`);
      const template = document.createElement('template');
      template.innerHTML = productCard(product, quantity);
      card.querySelector('.product-controls').replaceWith(template.content.querySelector('.product-controls'));
      updateCartLink(orderSnapshot(cart));
    } else render();
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
      if (result?.status === 'success') {
        clearCart();
        render();
        toast('CloudPayments сообщает об успешной оплате.');
      }
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
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && document.querySelector('.landing-navigation.is-open')) {
    document.querySelector('.landing-navigation').classList.remove('is-open');
    const toggle = document.querySelector('.landing-menu-toggle');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.focus();
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
if (location.hash === '#demo-shop' || location.hash === '#about') {
  requestAnimationFrame(() => document.querySelector(location.hash)?.scrollIntoView());
}
if (handlePaymentReturn() === 'success') {
  clearCart();
  render();
}
