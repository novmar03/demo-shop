import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { landingPage } from "../src/landing.js";
import { products } from "../src/products.js";
import { orderSnapshot } from "../src/cart.js";

test("Landing keeps merchandise IDs, quantities and catalog prices", () => {
  const cart = [{ id: products[0].id, quantity: 2 }];
  const html = landingPage(products, cart, "/demo-shop/");
  const ids = [...html.matchAll(/data-product-id="(\d+)"/g)].map((m) =>
    Number(m[1]),
  );
  assert.deepEqual(
    ids,
    products.map((p) => p.id),
  );
  assert.match(html, /В корзине: 2 шт\./);
  assert.equal(orderSnapshot(cart).totalAmount, products[0].price * 2);
  assert.match(html, /href="\/demo-shop\/" data-nav/);
  assert.match(html, /id="demo-shop"/);
  assert.match(html, /id="about"/);
});

test("Landing illustrations are local and do not load the reference store checkout or trackers", () => {
  const html = landingPage(products, [], "/demo-shop/");
  for (const [, src] of html.matchAll(/src="([^"]+)"/g))
    assert.ok(existsSync(src), src);
  assert.doesNotMatch(html, /<script|tildacdn|metrika|tcart|#order/);
  assert.equal((html.match(/<h1 /g) || []).length, 1);
});

test("Merchandise matches Easy and the backend catalog; retired IDs cannot become new products", () => {
  const catalog = createRequire(import.meta.url)("../backend/catalog.cjs");
  assert.deepEqual(
    products.map((p) => [p.name, p.price]),
    [
      ["Кепка", 2100],
      ["Брелок «Акула бизнеса»", 900],
      ["Свеча «Гори огнем»", 1400],
      ["Новогодние носки", 490],
      ["Шопер «Красный конь»", 2300],
      ["Кружка «В стае»", 900],
      ["Стикер-пак", 700],
      ["Маска для сна", 4100],
    ],
  );
  for (const p of products) {
    assert.deepEqual(catalog[p.id], { name: p.name, price: p.price });
    assert.notEqual(p.image, p.hoverImage);
  }
  assert.equal(
    orderSnapshot(products.map((p) => ({ id: p.id, quantity: 1 }))).totalAmount,
    12890,
  );
  assert.equal(
    orderSnapshot([
      { id: 1, quantity: 2 },
      { id: 4, quantity: 1 },
    ]).itemCount,
    0,
  );
  const html = landingPage(products, [], "/demo-shop/");
  assert.equal((html.match(/class="image-hover"/g) || []).length, 8);
});
