const test = require('node:test');
const assert = require('node:assert/strict');

const { createSessionStore } = require('../../utils/session-store');

test('stores and retrieves the latest generation result in memory', () => {
  const store = createSessionStore();
  const payload = { size: 48, usage: [{ code: 'F4', name: '正红', hex: '#FC283C', count: 3 }] };

  store.set(payload);

  assert.deepEqual(store.get(), payload);
  store.clear();
  assert.equal(store.get(), null);
});
