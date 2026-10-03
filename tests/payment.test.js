import test from 'node:test';
import assert from 'node:assert/strict';
import { paymentParameters, publicId } from '../src/payment.js';
import { orderSnapshot, updateCart } from '../src/cart.js';
test('payment uses current cart total, quantities and supplied terminal', () => {
  let cart = updateCart([], 1, 'add');
  cart = updateCart(cart, 1, 'add');
  cart = updateCart(cart, 4, 'add');
  const p = paymentParameters(orderSnapshot(cart, 'order-123'));
  assert.equal(p.publicTerminalId, publicId);
  assert.equal(p.amount, 57970);
  assert.equal(p.description, 'Покупка в демо-магазине');
  assert.equal(p.externalId, 'order-123');
  assert.equal(p.items[0].count, 2);
  cart = updateCart(cart, 1, 'subtract');
  cart = updateCart(cart, 4, 'remove');
  assert.equal(paymentParameters(orderSnapshot(cart)).amount, 24990);
  assert.throws(() => paymentParameters(orderSnapshot([])));
});
