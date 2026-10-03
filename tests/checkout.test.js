import test from 'node:test';
import assert from 'node:assert/strict';
import { checkoutForm, mountCheckout } from '../src/checkout.js';
import { orderSnapshot } from '../src/cart.js';
test('checkout form keeps card fields out of normal form submission', () => {
  const html = checkoutForm(orderSnapshot([{ id: 1, quantity: 2 }]));
  assert.equal((html.match(/data-cp=/g) || []).length, 5);
  assert.doesNotMatch(html, /\sname=/);
  assert.match(html, /49\s980/);
});
test('checkout generates once, clears fields and never reports a payment', async () => {
  let submit; let resets = 0; let calls = 0;
  const button = {}; const status = {};
  const form = { addEventListener(_, fn) { submit = fn; }, removeEventListener() {}, reportValidity: () => true, reset() { resets++; }, querySelector: s => s === 'button' ? button : status };
  globalThis.window = { cp: { Checkout: class {
    constructor(options) { assert.equal(options.container, form); }
    async createPaymentCryptogram() { calls++; return 'mock-cryptogram'; }
  } } };
  const dispose = mountCheckout(form);
  await submit({ preventDefault() {} });
  assert.equal(calls, 1); assert.equal(resets, 1);
  assert.match(status.textContent, /Платёж не проводился/);
  assert.equal(button.disabled, false);
  dispose(); delete globalThis.window;
});
