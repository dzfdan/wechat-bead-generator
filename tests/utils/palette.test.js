const test = require('node:test');
const assert = require('node:assert/strict');

const { BEAD_PALETTE, pickNearestBeadColor } = require('../../utils/palette');

test('includes an expanded portrait-friendly bead palette', () => {
  const codes = BEAD_PALETTE.map((item) => item.code);
  const names = BEAD_PALETTE.map((item) => item.name);

  assert.equal(BEAD_PALETTE.length >= 24, true);
  assert.deepEqual(
    codes.slice(0, 6),
    ['H2', 'H3', 'H10', 'H7', 'H9', 'G2']
  );
  assert.deepEqual(
    names.slice(0, 6),
    ['米白', '浅灰白', '暖白', '纯黑', '炭灰', '卡其']
  );
  assert.equal(codes.includes('M7'), true);
  assert.equal(codes.includes('E10'), true);
  assert.equal(codes.includes('G4'), true);
});

test('returns the nearest bead color for a bright red pixel', () => {
  const result = pickNearestBeadColor({ r: 250, g: 40, b: 50 });

  assert.equal(result.code, 'F4');
  assert.equal(result.name, '正红');
});

test('uses the portrait skin-highlight override instead of flattening into white', () => {
  const result = pickNearestBeadColor({ r: 250, g: 232, b: 222 });

  assert.equal(result.code, 'E1');
  assert.equal(result.name, '奶粉');
});

test('returns the best portrait skin tone for a warm fair pixel', () => {
  const result = pickNearestBeadColor({ r: 244, g: 214, b: 198 });

  assert.equal(result.code, 'M7');
  assert.equal(result.name, '裸肤色浅');
});

test('returns a soft pink instead of flattening into white', () => {
  const result = pickNearestBeadColor({ r: 244, g: 198, b: 215 });

  assert.equal(result.code, 'E2');
  assert.equal(result.name, '樱花粉');
});

test('returns a deep outline color for dark brown shadow pixels', () => {
  const result = pickNearestBeadColor({ r: 78, g: 58, b: 52 });

  assert.equal(result.code, 'G9');
  assert.equal(result.name, '深咖啡');
});

test('returns white for a near-white pixel', () => {
  const result = pickNearestBeadColor({ r: 245, g: 244, b: 240 });

  assert.equal(result.code, 'H2');
  assert.equal(result.name, '米白');
});

test('returns a deeper lip tone instead of flattening warm lip pixels into skin', () => {
  const result = pickNearestBeadColor({ r: 210, g: 118, b: 128 });

  assert.equal(result.code, 'E10');
  assert.equal(result.name, '干枯玫瑰粉');
});

test('returns a darker skin-shadow tone for jaw and nose-shadow pixels', () => {
  const result = pickNearestBeadColor({ r: 184, g: 132, b: 118 });

  assert.equal(result.code, 'M10');
  assert.equal(result.name, '古铜肤色');
});

test('returns a hair-shadow tone instead of collapsing blonde shadows into mid blonde', () => {
  const result = pickNearestBeadColor({ r: 176, g: 148, b: 108 });

  assert.equal(result.code, 'G4');
  assert.equal(result.name, '浅棕');
});
