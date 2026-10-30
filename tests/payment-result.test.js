import test from "node:test";
import assert from "node:assert/strict";
import { paymentHomeUrl, handlePaymentReturn } from "../src/payment-result.js";

test("successful and failed 3DS returns leave checkout through a full navigation", () => {
  for (const result of ["success", "failed"]) {
    let destination;
    globalThis.window = {
      location: {
        href: `https://example.com/demo-shop/checkout/?payment=${result}`,
        replace(url) {
          destination = url;
        },
      },
    };
    handlePaymentReturn();
    assert.equal(destination, paymentHomeUrl(result));
    assert.equal(destination.includes("checkout"), false);
  }
  delete globalThis.window;
});

test("success returns to clean home and uncertain results are distinguished from refusal", () => {
  assert.equal(paymentHomeUrl("success").includes("?"), false);
  assert.ok(paymentHomeUrl("failed").endsWith("?payment=failed"));
  assert.ok(paymentHomeUrl("unknown").endsWith("?payment=unknown"));
});

test('paid Checkout clears saved cart before navigation; failures preserve it', async () => {
  const { returnHome } = await import('../src/payment-result.js');
  const events = [];
  globalThis.window = {
    localStorage: { setItem(key, value) { events.push(['save', value]); } },
    location: { assign(url) { events.push(['navigate', url]); } },
  };
  try {
    returnHome('success');
    assert.equal(events[0][0], 'save');
    assert.equal(events[0][1], '[]');
    assert.equal(events[1][0], 'navigate');
    events.length = 0;
    returnHome('failed');
    assert.equal(events.length, 1);
    assert.equal(events[0][0], 'navigate');
  } finally { delete globalThis.window; }
});
