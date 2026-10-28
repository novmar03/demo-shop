import test from 'node:test';
import assert from 'node:assert/strict';
import { paymentParameters, publicId } from '../src/payment.js';
import { orderSnapshot, updateCart } from '../src/cart.js';
test('payment uses current cart total, quantities and supplied terminal', () => {
  let cart = updateCart([], 1792768165569, 'add');
  cart = updateCart(cart, 1792768165569, 'add');
  cart = updateCart(cart, 1792768153866, 'add');
  const p = paymentParameters(orderSnapshot(cart, 'order-123'));
  assert.equal(p.publicTerminalId, publicId);
  assert.equal(p.amount, 4690);
  assert.equal(p.description, 'Покупка в демо-магазине');
  assert.equal(p.externalId, 'order-123');
  assert.equal(p.items[0].count, 2);
  cart = updateCart(cart, 1792768165569, 'subtract');
  cart = updateCart(cart, 1792768153866, 'remove');
  assert.equal(paymentParameters(orderSnapshot(cart)).amount, 2100);
  assert.throws(() => paymentParameters(orderSnapshot([])));
});
