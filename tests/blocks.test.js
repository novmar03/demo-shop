import test from 'node:test';
import assert from 'node:assert/strict';
import { mountBlocks } from '../src/blocks.js';
import { orderSnapshot } from '../src/cart.js';
test('blocks receive latest totals and dispose instances or pending mounts', async () => {
  const calls = [];
  globalThis.window = { cp: { PaymentBlocks: class {
    constructor(params) { calls.push(['init', params]); }
    mount() { calls.push(['mount']); }
    on() {}
    off() {}
    unmount() { calls.push(['unmount']); }
  } } };
  const element = { isConnected: true, replaceChildren() {} };
  const dispose = mountBlocks(element, orderSnapshot([{ id: 1, quantity: 2 }]), () => {});
  await Promise.resolve();
  assert.equal(calls[0][1].amount, 49980);
  dispose();
  assert.equal(calls.at(-1)[0], 'unmount');
  const next = mountBlocks(element, orderSnapshot([{ id: 1, quantity: 1 }]), () => {});
  await Promise.resolve();
  assert.equal(calls.findLast(c => c[0] === 'init')[1].amount, 24990);
  next();
  const before = calls.length;
  mountBlocks(element, orderSnapshot([{ id: 1, quantity: 1 }]), () => {})();
  await Promise.resolve();
  assert.equal(calls.length, before);
  delete globalThis.window;
});
