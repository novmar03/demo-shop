import test from 'node:test';
import assert from 'node:assert/strict';
import { paymentHomeUrl, handlePaymentReturn } from '../src/payment-result.js';

test('successful and failed 3DS returns leave checkout through a full navigation', () => {
  for (const result of ['success', 'failed']) {
    let destination;
    globalThis.window = { location: { href: `https://example.com/demo-shop/checkout/?payment=${result}`, replace(url) { destination = url; } } };
    handlePaymentReturn();
    assert.equal(destination, paymentHomeUrl(result));
    assert.equal(destination.includes('checkout'), false);
  }
  delete globalThis.window;
});

test('success returns to clean home and uncertain results are distinguished from refusal', () => {
  assert.equal(paymentHomeUrl('success').includes('?'), false);
  assert.ok(paymentHomeUrl('failed').endsWith('?payment=failed'));
  assert.ok(paymentHomeUrl('unknown').endsWith('?payment=unknown'));
});
