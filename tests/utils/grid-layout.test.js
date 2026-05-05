const test = require('node:test');
const assert = require('node:assert/strict');

const { createBlankCell, embedGridInBoard } = require('../../utils/grid-layout');

function cell(code, hex) {
  return { code, name: code, hex };
}

test('creates a reusable blank board cell', () => {
  assert.deepEqual(createBlankCell(), {
    code: 'BLANK',
    name: 'Blank Board',
    hex: '#f3efe8',
    isBlank: true
  });
});

test('embeds a compact subject grid into the center of a larger board', () => {
  const subject = [
    [cell('R01', '#e23d48'), cell('R01', '#e23d48')],
    [cell('S02', '#efc7b6'), cell('K01', '#222222')]
  ];

  const board = embedGridInBoard({
    grid: subject,
    boardSize: 6,
    contentRatio: 0.66
  });

  assert.equal(board.length, 6);
  assert.equal(board[0][0].isBlank, true);
  assert.equal(board[5][5].isBlank, true);
  assert.equal(board[2][2].code, 'R01');
  assert.equal(board[2][3].code, 'R01');
  assert.equal(board[3][2].code, 'S02');
  assert.equal(board[3][3].code, 'K01');
});

test('uses contentRatio to shrink a full-size subject before embedding', () => {
  const subject = [
    [cell('R01', '#e23d48'), cell('R01', '#e23d48'), cell('R01', '#e23d48'), cell('R01', '#e23d48'), cell('R01', '#e23d48'), cell('R01', '#e23d48')],
    [cell('R01', '#e23d48'), cell('R01', '#e23d48'), cell('R01', '#e23d48'), cell('R01', '#e23d48'), cell('R01', '#e23d48'), cell('R01', '#e23d48')],
    [cell('R01', '#e23d48'), cell('R01', '#e23d48'), cell('K01', '#222222'), cell('R01', '#e23d48'), cell('R01', '#e23d48'), cell('R01', '#e23d48')],
    [cell('R01', '#e23d48'), cell('R01', '#e23d48'), cell('R01', '#e23d48'), cell('S02', '#efc7b6'), cell('R01', '#e23d48'), cell('R01', '#e23d48')],
    [cell('R01', '#e23d48'), cell('R01', '#e23d48'), cell('R01', '#e23d48'), cell('R01', '#e23d48'), cell('R01', '#e23d48'), cell('R01', '#e23d48')],
    [cell('R01', '#e23d48'), cell('R01', '#e23d48'), cell('R01', '#e23d48'), cell('R01', '#e23d48'), cell('R01', '#e23d48'), cell('R01', '#e23d48')]
  ];

  const board = embedGridInBoard({
    grid: subject,
    boardSize: 6,
    contentRatio: 0.5
  });

  assert.equal(board.flat().filter((item) => !item.isBlank).length, 9);
  assert.equal(board[0][0].isBlank, true);
  assert.equal(board[1][1].isBlank, true);
  assert.equal(board[2][2].code, 'R01');
  assert.equal(board[2][3].code, 'R01');
  assert.equal(board[3][2].code, 'R01');
  assert.equal(board[3][3].code, 'K01');
  assert.equal(board[5][5].isBlank, true);
});

test('centers compacted content on a small odd board without top-left skew', () => {
  const subject = [
    [cell('R01', '#e23d48'), cell('R01', '#e23d48'), cell('R01', '#e23d48')],
    [cell('R01', '#e23d48'), cell('R01', '#e23d48'), cell('R01', '#e23d48')],
    [cell('R01', '#e23d48'), cell('R01', '#e23d48'), cell('R01', '#e23d48')]
  ];

  const board = embedGridInBoard({
    grid: subject,
    boardSize: 3,
    contentRatio: 0.66
  });

  assert.equal(board[0][0].isBlank, true);
  assert.equal(board[0][1].isBlank, true);
  assert.equal(board[1][0].isBlank, true);
  assert.equal(board[1][1].code, 'R01');
  assert.equal(board[1][2].code, 'R01');
  assert.equal(board[2][1].code, 'R01');
  assert.equal(board[2][2].code, 'R01');
});

test('throws when the board is too small for the requested subject grid', () => {
  assert.throws(
    () => embedGridInBoard({
      grid: [
        [cell('R01', '#e23d48'), cell('R01', '#e23d48')],
        [cell('S02', '#efc7b6'), cell('K01', '#222222')]
      ],
      boardSize: 1,
      contentRatio: 0.66
    }),
    /Board size 1 cannot fit subject grid 2x2/
  );
});
