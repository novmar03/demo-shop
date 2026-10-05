import test from 'node:test';
import assert from 'node:assert/strict';
import { checkoutForm, mountCheckout, redirectToBank, checkoutApi, formatCardNumber, cardValues } from '../src/checkout.js';
import { orderSnapshot } from '../src/cart.js';
test('checkout form keeps card fields out of normal form submission', () => {
  const html = checkoutForm(orderSnapshot([{ id: 1, quantity: 2 }]));
  assert.equal((html.match(/data-cp=/g) || []).length, 4);
  assert.doesNotMatch(html, /\sname=/);
  assert.doesNotMatch(html, /data-cardholder|data-preview-name|data-cp="name"|<small>123/);
  assert.match(html, /maxlength="3" pattern="\[0-9\]\{3\}"/);
});
test('checkout submits minimal payload, blocks double clicks and handles decline', async () => {
  let submit; let resets = 0; let calls = 0;
  const button = {}; const status = {};
  const form = { addEventListener(type, fn) { if (type === 'submit') submit = fn; }, removeEventListener() {}, reportValidity: () => true, reset() { resets++; }, querySelector: s => s === 'button' ? button : s === '.checkout-status' ? status : { value: s === '[data-cardholder]' ? '' : '123' } };
  globalThis.window = { cp: { Checkout: class {
    constructor(options) { assert.equal(options.container, form); }
    async createPaymentCryptogram(values) { assert.equal(values, undefined); calls++; return 'mock-cryptogram'; }
  } } };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, `${checkoutApi}/payment`);
    assert.deepEqual(JSON.parse(options.body), { cardCryptogramPacket: 'mock-cryptogram', items: [{ id: 1, quantity: 2 }] });
    return { ok: true, json: async () => ({ success: false, status: 'declined', message: 'Отказ банка' }) };
  };
  let destination;
  window.location = { assign(url) { destination = url; } };
  const dispose = mountCheckout(form, orderSnapshot([{ id: 1, quantity: 2 }]));
  await Promise.all([submit({ preventDefault() {} }), submit({ preventDefault() {} })]);
  assert.equal(calls, 1); assert.equal(resets, 1);
  assert.ok(destination.endsWith('/?payment=failed'));
  assert.equal(button.disabled, false);
  dispose(); delete globalThis.window; globalThis.fetch = originalFetch;
});
test('card formatting strips non-digits and caps at nineteen digits', () => {
  assert.equal(formatCardNumber('4242424242424242'), '4242 4242 4242 4242');
  assert.equal(formatCardNumber('1234x5678901234567890123'), '1234 5678 9012 3456 789');
  const form = { querySelector: s => ({ value: s === '[data-cardholder]' ? '   ' : '12' }) };
  assert.equal('name' in cardValues(form), false);
});
test('3DS posts exact case-sensitive fields and rejects unsafe URLs', () => {
  let submitted = false; let mounted;
  const doc = { createElement: () => ({ children: [], append(child) { this.children.push(child); }, submit() { submitted = true; } }), body: { append(node) { mounted = node; } } };
  const result = { acsUrl: 'https://demo.cloudpayments.ru/acs', paReq: 'test-payload', transactionId: 123, termUrl: `${checkoutApi}/post3ds` };
  redirectToBank(result, doc);
  assert.equal(submitted, true);
  assert.equal(mounted.method, 'POST');
  assert.deepEqual(mounted.children.map(({ name, value }) => [name, value]), [['MD', '123'], ['PaReq', 'test-payload'], ['TermUrl', `${checkoutApi}/post3ds`]]);
  assert.throws(() => redirectToBank({ ...result, acsUrl: 'javascript:alert(1)' }, doc));
  assert.throws(() => redirectToBank({ ...result, termUrl: 'https://example.com' }, doc));
});
