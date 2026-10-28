import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { landingPage } from '../src/landing.js';
import { products } from '../src/products.js';
import { orderSnapshot } from '../src/cart.js';

test('Landing keeps purchasable IDs, quantities and server-compatible prices', () => {
  const cart = [{id: products[0].id, quantity: 2}];
  const html = landingPage(products, cart, '/demo-shop/');
  const ids = [...html.matchAll(/data-product-id="(\d+)"/g)].map(m => Number(m[1]));
  assert.deepEqual(ids, products.map(p => p.id));
  assert.match(html, /В корзине: 2 шт\./);
  assert.equal(orderSnapshot(cart).totalAmount, products[0].price * 2);
  assert.match(html, /href="\/demo-shop\/" data-nav/);
  assert.match(html, /id="demo-shop"/);
  assert.match(html, /id="about"/);
});

test('Landing illustrations are local and do not load the reference store checkout or trackers', () => {
  const html = landingPage(products, [], '/demo-shop/');
  for (const [,src] of html.matchAll(/src="([^"]+)"/g)) assert.ok(existsSync(src), src);
  assert.doesNotMatch(html, /<script|tildacdn|metrika|tcart|#order/);
  assert.equal((html.match(/<h1 /g)||[]).length, 1);
});
