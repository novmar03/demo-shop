import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { products } from '../src/products.js';
import { updateCart, orderSnapshot } from '../src/cart.js';
import { money, productCount, productCard } from '../src/ui.js';

test('На карточке сразу отображается количество добавленного товара', () => {
  const product = products[0];
  let cart = [];
  assert.match(productCard(product, 0), /В корзину/);
  for (let i = 0; i < 3; i++) cart = updateCart(cart, product.id, 'add');
  const card = productCard(product, cart[0].quantity);
  assert.match(card, /В корзине: 3 шт\./);
  assert.match(card, /data-action="subtract"/);
  assert.equal(orderSnapshot(cart).itemCount, 3);
  cart = updateCart(cart, product.id, 'subtract');
  assert.match(productCard(product, cart[0].quantity), /В корзине: 2 шт\./);
  cart = updateCart(cart, product.id, 'remove');
  assert.match(productCard(product, cart[0]?.quantity || 0), /В корзину/);
});

test('Русское форматирование цен и количества', () => {
  assert.equal(money(24990).replace(/\s/g, ' '), '24 990 ₽');
  assert.deepEqual([1, 2, 5, 11, 21, 22, 111].map(productCount), ['1 товар', '2 товара', '5 товаров', '11 товаров', '21 товар', '22 товара', '111 товаров']);
});

test('Восемь товаров с фотографиями, описанием и ценой', () => {
  assert.equal(products.length, 8);
  assert.equal(new Set(products.map(p => p.id)).size, 8);
  for (const product of products) {
    assert.ok(product.description.length > 30);
    assert.ok(Number.isSafeInteger(product.price) && product.price > 0);
    assert.ok(existsSync(product.image), product.image);
    assert.match(product.image, /\.webp$/);
  }
});

test('Главная и корзина сохраняют пути GitHub Pages и русские метаданные', () => {
  for (const file of ['index.html', 'cart/index.html']) {
    const html = readFileSync(file, 'utf8');
    assert.match(html, /lang="ru"/);
    assert.match(html, /rel="icon"/);
    const base = new URL(file, 'https://novmar03.github.io/demo-shop/');
    for (const [,relative] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const url = new URL(relative, base);
      assert.ok(url.pathname.startsWith('/demo-shop/'), url.href);
      const local = url.pathname.slice('/demo-shop/'.length);
      assert.ok(existsSync(local || '.'), local);
    }
  }
});
