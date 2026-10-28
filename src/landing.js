import { productCard } from './ui.js?v=20261028-merch';

const asset = name => new URL(`../public/landing/${name}`, import.meta.url).pathname;
export const landingLogo = asset('rec5121425401-Logo.svg');
export const applicationUrl = 'https://cloudpayments.ru/payments/?utm_source=demoshop&utm_medium=vidget&utm_campaign=retail';

const benefits = [
  ['Привычные способы оплаты', 'Российские и международные банковские карты, СБП, T-Pay, Долями и другие методы в одном платёжном виджете'],
  ['Минимум лишних действий', 'Простой и понятный путь от оформления заказа до оплаты без редиректа на сторонний ресурс'],
  ['Удобно на любом устройстве', 'Виджет адаптируется под разные экраны и сохраняет удобство оплаты'],
  ['В стиле вашего бизнеса', 'Настройте оформление платёжной формы под фирменный стиль вашего бренда']
];

export function landingPage(products, cart, basePath) {
  return `<div class="landing">
    <section class="landing-intro" aria-labelledby="landing-title">
      <div class="landing-container">
        <div class="landing-hero">
          <img class="landing-badge" src="${asset('rec5120465801-Bage.svg')}" width="106" height="24" alt="Демомагазин">
          <h1 id="landing-title" tabindex="-1" data-reveal="zoom">Хороший платёжный опыт превращает интерес<br class="hero-desktop-break"> в покупку</h1>
          <p class="landing-hero-description" data-reveal="zoom">Узнайте, как выглядит удобный платёжный сценарий глазами покупателей. Выбирайте товары, оформляйте заказ и знакомьтесь с CloudPayments в демо-магазине</p>
          <a class="landing-button landing-hero-button" href="#demo-shop">Перейти к магазину</a>
          <div class="landing-phone-panel" aria-hidden="true"><img class="landing-phone" src="${asset('rec5120465801-Phone_1.png')}" width="744" height="928" alt="" fetchpriority="high" data-reveal="up"></div>
        </div>
        <div class="landing-benefits">${benefits.map(([title,description],i) => `<article class="landing-benefit" data-reveal="zoom">
          <img src="${asset(`rec5120465801-${i+1}.svg`)}" width="40" height="40" alt="">
          <h2>${title}</h2><p>${description}</p>
        </article>`).join('')}</div>
      </div>
    </section>
    <section id="demo-shop" class="landing-shop" aria-labelledby="landing-catalog-title">
      <div class="landing-container">
        <div class="landing-catalog-intro" data-reveal="zoom"><h2 id="landing-catalog-title">От выбора до оплаты — попробуйте сами</h2><p>Выберите товар, добавьте в корзину и оформите заказ — как в настоящем магазине, но без реальных списаний.</p></div>
        <div class="catalog" aria-label="Каталог товаров">${products.map(p=> productCard(p,cart.find(i=>i.id===p.id)?.quantity||0)).join('')}</div>
        <p class="landing-catalog-note" data-reveal="zoom">*Данные позиции являются демонстрационными и продаже не подлежат</p>
      </div>
    </section>
    <section id="about" class="landing-about" aria-labelledby="landing-about-title">
      <div class="landing-container"><div class="landing-about-card">
        <img class="landing-about-art" src="${asset('rec5120995901-Frame_2136138483.svg')}" width="567" height="282" alt="" loading="lazy">
        <img class="landing-about-badge" src="${asset('rec5120995901-Bage.svg')}" width="58" height="24" alt="О нас" loading="lazy">
        <h2 id="landing-about-title" data-reveal="zoom">CloudPayments — технологии,<br>которые помогают бизнесу <span class="landing-typed" aria-hidden="true">расти</span><span class="visually-hidden">расти, оптимизироваться и зарабатывать</span></h2>
        <p data-reveal="zoom">Мы создаём платёжные решения, которые делают онлайн-покупки удобнее, а управление платежами — проще. От небольших интернет-магазинов до крупных цифровых сервисов.</p>
        <a class="landing-button landing-about-button" href="${applicationUrl}" target="_blank" rel="noopener">Оставить заявку</a>
        <img class="landing-money" src="${asset('rec5120995901-money_1.png')}" width="492" height="544" alt="" loading="lazy" data-reveal="up">
      </div></div>
    </section>
    <footer class="landing-footer landing-container"><a href="${basePath}" data-nav aria-label="CloudPayments — на главную"><img src="${landingLogo}" width="174" height="28" alt="CloudPayments"></a><span>© ${new Date().getFullYear()}</span></footer>
  </div>`;
}

// Each mounted page owns its observers/timer, including navigation back from Checkout.
export function mountLanding(root) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const targets = root.querySelectorAll('[data-reveal], .product');
  let observer;
  let timer;
  let stopped = false;
  if (!reduced.matches && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.08 });
    targets.forEach((el, i) => {
      el.classList.add('reveal-ready');
      if (el.classList.contains('product')) el.style.setProperty('--reveal-delay', `${i % 4 * 80}ms`);
      observer.observe(el);
    });
  }
  const text = root.querySelector('.landing-typed');
  const words = ['расти', 'оптимизироваться', 'зарабатывать'];
  let word = 0, length = words[0].length, deleting = true;
  function type() {
    if (stopped || reduced.matches) return;
    length += deleting ? -1 : 1;
    text.textContent = words[word].slice(0, length);
    let delay = deleting ? 55 : 100;
    if (length === 0) { deleting = false; word = (word + 1) % words.length; delay = 250; }
    else if (length === words[word].length) { deleting = true; delay = 1800; }
    timer = setTimeout(type, delay);
  }
  if (!reduced.matches) timer = setTimeout(type, 2200);
  function stopMotion() {
    if (!reduced.matches) return;
    clearTimeout(timer);
    observer?.disconnect();
    targets.forEach(el => el.classList.add('is-visible'));
    text.textContent = words[0];
  }
  reduced.addEventListener('change', stopMotion);
  return () => { stopped = true; observer?.disconnect(); clearTimeout(timer); reduced.removeEventListener('change', stopMotion); };
}
