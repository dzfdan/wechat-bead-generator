const test = require('node:test');
const assert = require('node:assert/strict');

const { buildBeadGrid, summarizeUsage, buildResultModel } = require('../../utils/bead-generator');

test('converts sampled pixels into a bead grid', () => {
  const pixels = [
    { r: 250, g: 40, b: 50 },
    { r: 245, g: 244, b: 240 },
    { r: 90, g: 169, b: 230 },
    { r: 34, g: 34, b: 34 }
  ];

  const grid = buildBeadGrid({
    pixels,
    width: 2,
    height: 2
  });

  assert.equal(grid.length, 2);
  assert.equal(grid[0][0].code, 'R01');
  assert.equal(grid[0][1].code, 'W01');
  assert.equal(grid[1][0].code, 'B01');
  assert.equal(grid[1][1].code, 'K01');
});

test('merges isolated mapped colors before returning the bead grid', () => {
  const pixels = [
    { r: 34, g: 34, b: 34 },
    { r: 34, g: 34, b: 34 },
    { r: 34, g: 34, b: 34 },
    { r: 34, g: 34, b: 34 },
    { r: 245, g: 245, b: 240 },
    { r: 34, g: 34, b: 34 },
    { r: 34, g: 34, b: 34 },
    { r: 34, g: 34, b: 34 },
    { r: 34, g: 34, b: 34 }
  ];

  const grid = buildBeadGrid({
    pixels,
    width: 3,
    height: 3
  });

  assert.equal(grid[1][1].code, 'K01');
});

test('rejects incomplete pixel input with a clear error', () => {
  assert.throws(
    () => buildBeadGrid({
      pixels: [{ r: 250, g: 40, b: 50 }],
      width: 2,
      height: 1
    }),
    /Invalid pixel buffer size: expected 2 pixels but received 1/
  );
});

test('rejects sparse pixel holes with a clear error', () => {
  assert.throws(
    () => buildBeadGrid({
      pixels: [
        { r: 250, g: 40, b: 50 },
        ,
        { r: 90, g: 169, b: 230 },
        { r: 34, g: 34, b: 34 }
      ],
      width: 2,
      height: 2
    }),
    /Invalid pixel buffer entry at index 1/
  );
});

test('rejects explicit undefined pixel entries with a clear error', () => {
  assert.throws(
    () => buildBeadGrid({
      pixels: [
        { r: 250, g: 40, b: 50 },
        { r: 245, g: 244, b: 240 },
        { r: 90, g: 169, b: 230 },
        undefined
      ],
      width: 2,
      height: 2
    }),
    /Invalid pixel buffer entry at index 3/
  );
});

test('summarizes color usage counts from the bead grid', () => {
  const usage = summarizeUsage([
    [{ code: 'R01', name: 'Cherry Red', hex: '#e23d48' }, { code: 'R01', name: 'Cherry Red', hex: '#e23d48' }],
    [{ code: 'W01', name: 'Snow White', hex: '#f5f5f0' }, { code: 'R01', name: 'Cherry Red', hex: '#e23d48' }]
  ]);

  assert.deepEqual(usage, [
    { code: 'R01', name: 'Cherry Red', hex: '#e23d48', count: 3 },
    { code: 'W01', name: 'Snow White', hex: '#f5f5f0', count: 1 }
  ]);
});

test('builds the result model for result page rendering', () => {
  const grid = [
    [{ code: 'R01', name: 'Cherry Red', hex: '#e23d48' }, { code: 'W01', name: 'Snow White', hex: '#f5f5f0' }],
    [{ code: 'B01', name: 'Sky Blue', hex: '#5aa9e6' }, { code: 'K01', name: 'Jet Black', hex: '#222222' }]
  ];

  const result = buildResultModel({ grid, size: 2 });

  assert.equal(result.size, 2);
  assert.deepEqual(result.previewGridRows, [
    [
      { code: 'R01', name: 'Cherry Red', hex: '#e23d48', label: '1-1' },
      { code: 'W01', name: 'Snow White', hex: '#f5f5f0', label: '1-2' }
    ],
    [
      { code: 'B01', name: 'Sky Blue', hex: '#5aa9e6', label: '2-1' },
      { code: 'K01', name: 'Jet Black', hex: '#222222', label: '2-2' }
    ]
  ]);
  assert.equal(result.gridRows.length, 2);
  assert.equal(result.usage.length, 4);
});

test('builds a centered board result model with blank outer margin cells', () => {
  const red = { r: 250, g: 40, b: 50 };
  const pixels = Array.from({ length: 36 }, () => ({ ...red }));

  const grid = buildBeadGrid({
    pixels,
    width: 6,
    height: 6
  });

  const result = buildResultModel({
    grid,
    size: 6
  });

  assert.equal(result.size, 6);
  assert.equal(result.previewGridRows.length, 6);
  assert.equal(result.previewGridRows[0][0].code, 'R01');
  assert.equal(result.previewGridRows[5][5].code, 'R01');
  assert.equal(result.previewGridRows.flat().every((cell) => !cell.isBlank), true);
  assert.equal(result.gridRows.length, 6);
  assert.equal(result.gridRows[0][0].isBlank, true);
  assert.equal(result.gridRows[1][1].isBlank, true);
  assert.equal(result.gridRows[2][2].code, 'R01');
  assert.equal(result.gridRows[4][4].code, 'R01');
  assert.equal(result.gridRows.flat().filter((cell) => !cell.isBlank).length, 9);
  assert.deepEqual(result.usage, [
    { code: 'R01', name: 'Cherry Red', hex: '#e23d48', count: 9 }
  ]);
});

test('does not count blank board cells in usage statistics', () => {
  const usage = summarizeUsage([
    [{ code: 'BLANK', name: 'Blank Board', hex: '#f3efe8', isBlank: true }, { code: 'R01', name: 'Cherry Red', hex: '#e23d48' }],
    [{ code: 'BLANK', name: 'Blank Board', hex: '#f3efe8', isBlank: true }, { code: 'R01', name: 'Cherry Red', hex: '#e23d48' }]
  ]);

  assert.deepEqual(usage, [
    { code: 'R01', name: 'Cherry Red', hex: '#e23d48', count: 2 }
  ]);
});
