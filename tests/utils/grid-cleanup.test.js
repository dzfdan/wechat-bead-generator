const test = require('node:test');
const assert = require('node:assert/strict');

const { cleanupGrid } = require('../../utils/grid-cleanup');

function cell(code, hex = '#ffffff') {
  return { code, name: code, hex };
}

test('replaces an isolated center cell with the dominant surrounding color', () => {
  const grid = [
    [cell('B27'), cell('B27'), cell('B27')],
    [cell('B27'), cell('P02'), cell('B27')],
    [cell('B27'), cell('B27'), cell('B27')]
  ];

  const result = cleanupGrid(grid);

  assert.equal(result[1][1].code, 'B27');
});

test('replaces a two-cell island when a dominant border surrounds it', () => {
  const grid = [
    [cell('B27'), cell('B27'), cell('B27'), cell('B27')],
    [cell('B27'), cell('P02'), cell('P02'), cell('B27')],
    [cell('B27'), cell('B27'), cell('B27'), cell('B27')]
  ];

  const result = cleanupGrid(grid);

  assert.equal(result[1][1].code, 'B27');
  assert.equal(result[1][2].code, 'B27');
});

test('preserves a stable 2x2 facial feature block', () => {
  const grid = [
    [cell('B27'), cell('B27'), cell('B27'), cell('B27')],
    [cell('B27'), cell('H16'), cell('H16'), cell('B27')],
    [cell('B27'), cell('H16'), cell('H16'), cell('B27')],
    [cell('B27'), cell('B27'), cell('B27'), cell('B27')]
  ];

  const result = cleanupGrid(grid);

  assert.equal(result[1][1].code, 'H16');
  assert.equal(result[2][2].code, 'H16');
});

test('does not replace a cell when surrounding colors are tied', () => {
  const grid = [
    [cell('B27'), cell('B27'), cell('H16')],
    [cell('B27'), cell('P02'), cell('H16')],
    [cell('B27'), cell('H16'), cell('H16')]
  ];

  const result = cleanupGrid(grid);

  assert.equal(result[1][1].code, 'P02');
});

test('keeps corner cells safe and deterministic on tiny grids', () => {
  const grid = [
    [cell('P02'), cell('B27')],
    [cell('B27'), cell('H16')]
  ];

  const result = cleanupGrid(grid);

  assert.equal(result[0][0].code, 'P02');
  assert.equal(result[0][1].code, 'B27');
  assert.equal(result[1][0].code, 'B27');
  assert.equal(result[1][1].code, 'H16');
});

test('returns cloned cells without mutating the input grid', () => {
  const grid = [
    [cell('B27'), cell('B27'), cell('B27')],
    [cell('B27'), cell('P02'), cell('B27')],
    [cell('B27'), cell('B27'), cell('B27')]
  ];

  const originalCenter = grid[1][1];
  const originalCorner = grid[0][0];
  const result = cleanupGrid(grid);

  assert.equal(grid[1][1].code, 'P02');
  assert.notStrictEqual(result, grid);
  assert.notStrictEqual(result[1][1], originalCenter);
  assert.notStrictEqual(result[0][0], originalCorner);
  assert.equal(result[1][1].code, 'B27');
});

test('preserves a small high-contrast eye detail near image center', () => {
  const grid = [
    [cell('B27', '#f2eee8'), cell('B27', '#f2eee8'), cell('B27', '#f2eee8'), cell('B27', '#f2eee8'), cell('B27', '#f2eee8')],
    [cell('B27', '#f2eee8'), cell('S02', '#e8bf9d'), cell('S02', '#e8bf9d'), cell('S02', '#e8bf9d'), cell('B27', '#f2eee8')],
    [cell('B27', '#f2eee8'), cell('S02', '#e8bf9d'), cell('K01', '#2b211d'), cell('S02', '#e8bf9d'), cell('B27', '#f2eee8')],
    [cell('B27', '#f2eee8'), cell('S02', '#e8bf9d'), cell('S02', '#e8bf9d'), cell('S02', '#e8bf9d'), cell('B27', '#f2eee8')],
    [cell('B27', '#f2eee8'), cell('B27', '#f2eee8'), cell('B27', '#f2eee8'), cell('B27', '#f2eee8'), cell('B27', '#f2eee8')]
  ];

  const result = cleanupGrid(grid);

  assert.equal(result[2][2].code, 'K01');
});

test('preserves a small high-contrast centered lip detail with a non-dark code', () => {
  const grid = [
    [cell('B27', '#f2eee8'), cell('B27', '#f2eee8'), cell('B27', '#f2eee8'), cell('B27', '#f2eee8'), cell('B27', '#f2eee8')],
    [cell('B27', '#f2eee8'), cell('S02', '#e8bf9d'), cell('S02', '#e8bf9d'), cell('S02', '#e8bf9d'), cell('B27', '#f2eee8')],
    [cell('B27', '#f2eee8'), cell('S02', '#e8bf9d'), cell('R14', '#b24561'), cell('S02', '#e8bf9d'), cell('B27', '#f2eee8')],
    [cell('B27', '#f2eee8'), cell('S02', '#e8bf9d'), cell('S02', '#e8bf9d'), cell('S02', '#e8bf9d'), cell('B27', '#f2eee8')],
    [cell('B27', '#f2eee8'), cell('B27', '#f2eee8'), cell('B27', '#f2eee8'), cell('B27', '#f2eee8'), cell('B27', '#f2eee8')]
  ];

  const result = cleanupGrid(grid);

  assert.equal(result[2][2].code, 'R14');
});

test('preserves a small centered accessory detail with production palette codes', () => {
  const grid = [
    [cell('B27', '#f2eee8'), cell('B27', '#f2eee8'), cell('B27', '#f2eee8'), cell('B27', '#f2eee8'), cell('B27', '#f2eee8')],
    [cell('B27', '#f2eee8'), cell('S02', '#e8bf9d'), cell('S02', '#e8bf9d'), cell('S02', '#e8bf9d'), cell('B27', '#f2eee8')],
    [cell('B27', '#f2eee8'), cell('S02', '#e8bf9d'), cell('B01', '#5aa9e6'), cell('S02', '#e8bf9d'), cell('B27', '#f2eee8')],
    [cell('B27', '#f2eee8'), cell('S02', '#e8bf9d'), cell('S02', '#e8bf9d'), cell('S02', '#e8bf9d'), cell('B27', '#f2eee8')],
    [cell('B27', '#f2eee8'), cell('B27', '#f2eee8'), cell('B27', '#f2eee8'), cell('B27', '#f2eee8'), cell('B27', '#f2eee8')]
  ];

  const result = cleanupGrid(grid);

  assert.equal(result[2][2].code, 'B01');
});

test('preserves a centered blue subject detail even when its code starts with B', () => {
  const grid = [
    [cell('N01', '#f4f1ea'), cell('N01', '#f4f1ea'), cell('N01', '#f4f1ea'), cell('N01', '#f4f1ea'), cell('N01', '#f4f1ea')],
    [cell('N01', '#f4f1ea'), cell('S02', '#e8bf9d'), cell('S02', '#e8bf9d'), cell('S02', '#e8bf9d'), cell('N01', '#f4f1ea')],
    [cell('N01', '#f4f1ea'), cell('S02', '#e8bf9d'), cell('B01', '#5aa9e6'), cell('S02', '#e8bf9d'), cell('N01', '#f4f1ea')],
    [cell('N01', '#f4f1ea'), cell('S02', '#e8bf9d'), cell('S02', '#e8bf9d'), cell('S02', '#e8bf9d'), cell('N01', '#f4f1ea')],
    [cell('N01', '#f4f1ea'), cell('N01', '#f4f1ea'), cell('N01', '#f4f1ea'), cell('N01', '#f4f1ea'), cell('N01', '#f4f1ea')]
  ];

  const result = cleanupGrid(grid);

  assert.equal(result[2][2].code, 'B01');
});

test('removes a non-skin high-contrast centered two-cell cluster even when it looks subject-like', () => {
  const grid = [
    [cell('N01', '#f4f1ea'), cell('N01', '#f4f1ea'), cell('N01', '#f4f1ea'), cell('N01', '#f4f1ea'), cell('N01', '#f4f1ea')],
    [cell('N01', '#f4f1ea'), cell('S02', '#e8bf9d'), cell('S02', '#e8bf9d'), cell('S02', '#e8bf9d'), cell('N01', '#f4f1ea')],
    [cell('N01', '#f4f1ea'), cell('S02', '#e8bf9d'), cell('K01', '#2b211d'), cell('K01', '#2b211d'), cell('N01', '#f4f1ea')],
    [cell('N01', '#f4f1ea'), cell('S02', '#e8bf9d'), cell('S02', '#e8bf9d'), cell('S02', '#e8bf9d'), cell('N01', '#f4f1ea')],
    [cell('N01', '#f4f1ea'), cell('N01', '#f4f1ea'), cell('N01', '#f4f1ea'), cell('N01', '#f4f1ea'), cell('N01', '#f4f1ea')]
  ];

  const result = cleanupGrid(grid);

  assert.equal(result[2][2].code, 'S02');
  assert.equal(result[2][3].code, 'S02');
});

test('preserves a compact centered facial shadow cluster when it is surrounded by skin but anchored to darker detail', () => {
  const grid = [
    [cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0')],
    [cell('W01', '#f5f5f0'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('W01', '#f5f5f0')],
    [cell('W01', '#f5f5f0'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('W01', '#f5f5f0')],
    [cell('W01', '#f5f5f0'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('W01', '#f5f5f0')],
    [cell('W01', '#f5f5f0'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S04', '#c99582'), cell('K01', '#222222'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('W01', '#f5f5f0')],
    [cell('W01', '#f5f5f0'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S04', '#c99582'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('W01', '#f5f5f0')],
    [cell('W01', '#f5f5f0'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('W01', '#f5f5f0')],
    [cell('W01', '#f5f5f0'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('W01', '#f5f5f0')],
    [cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0')]
  ];

  const result = cleanupGrid(grid);

  assert.equal(result[4][4].code, 'S04');
  assert.equal(result[5][4].code, 'S04');
});

test('still removes unrelated centered two-cell noise even when a darker subject detail is nearby', () => {
  const grid = [
    [cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0')],
    [cell('W01', '#f5f5f0'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('W01', '#f5f5f0')],
    [cell('W01', '#f5f5f0'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('W01', '#f5f5f0')],
    [cell('W01', '#f5f5f0'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('W01', '#f5f5f0')],
    [cell('W01', '#f5f5f0'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('B01', '#5aa9e6'), cell('K01', '#222222'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('W01', '#f5f5f0')],
    [cell('W01', '#f5f5f0'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('B01', '#5aa9e6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('W01', '#f5f5f0')],
    [cell('W01', '#f5f5f0'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('W01', '#f5f5f0')],
    [cell('W01', '#f5f5f0'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('W01', '#f5f5f0')],
    [cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0')]
  ];

  const result = cleanupGrid(grid);

  assert.equal(result[4][4].code, 'S02');
  assert.equal(result[5][4].code, 'S02');
});

test('still clears a tiny background island near outer edge', () => {
  const grid = [
    [cell('B27', '#f2eee8'), cell('P02', '#d9c9ee'), cell('B27', '#f2eee8'), cell('B27', '#f2eee8'), cell('B27', '#f2eee8')],
    [cell('B27', '#f2eee8'), cell('B27', '#f2eee8'), cell('B27', '#f2eee8'), cell('B27', '#f2eee8'), cell('B27', '#f2eee8')],
    [cell('B27', '#f2eee8'), cell('B27', '#f2eee8'), cell('S02', '#e8bf9d'), cell('S02', '#e8bf9d'), cell('B27', '#f2eee8')],
    [cell('B27', '#f2eee8'), cell('B27', '#f2eee8'), cell('S02', '#e8bf9d'), cell('S02', '#e8bf9d'), cell('B27', '#f2eee8')],
    [cell('B27', '#f2eee8'), cell('B27', '#f2eee8'), cell('B27', '#f2eee8'), cell('B27', '#f2eee8'), cell('B27', '#f2eee8')]
  ];

  const result = cleanupGrid(grid);

  assert.equal(result[0][1].code, 'B27');
});
