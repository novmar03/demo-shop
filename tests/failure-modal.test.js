import test from 'node:test';
import assert from 'node:assert/strict';
import { rememberPaymentAmount, paymentAmount, handlePaymentReturn } from '../src/payment-result.js';

test('failure modal preserves payment amount and distinguishes exit destinations', () => {
  for (const action of ['.payment-result-close', '.payment-result-shop']) {
    const saved = new Map();
    let destination;
    globalThis.window = {
      sessionStorage: { setItem: (k,v) => saved.set(k,v), getItem: k => saved.get(k), removeItem: k => saved.delete(k) },
      location: { href: 'https://example.com/workspace/scratch/3c1cd78acc8e/shop-current/?payment=failed', assign: url => { destination = url; } },
      history: { replaceState() {} }
    };
    // Derive the test URL from the module's actual base path.
    window.location.href = 'https://example.com' + new URL('../', import.meta.url).pathname + '?payment=failed';
    const handlers = {};
    const dialog = { setAttribute() {}, querySelector: selector => ({ addEventListener: (_,fn) => { handlers[selector] = fn; } }), addEventListener: (_,fn) => { handlers.close = fn; }, close() { handlers.close(); }, showModal() {}, remove() {} };
    globalThis.document = { createElement: tag => tag === 'dialog' ? dialog : { remove() {} }, head: { append() {} }, body: { style: {}, append() {} } };
    rememberPaymentAmount(8000);
    assert.equal(paymentAmount(), 8000);
    handlePaymentReturn();
    assert.match(dialog.innerHTML, /Не удалось оплатить/);
    assert.match(dialog.innerHTML, /Оплата тестового заказа/);
    assert.match(dialog.innerHTML, /8\s000,00/);
    handlers[action]();
    assert.equal(destination.endsWith('/checkout/'), action === '.payment-result-close');
    assert.equal(paymentAmount(), null);
  }
  delete globalThis.window;
  delete globalThis.document;
});
