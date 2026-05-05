const test = require('node:test');
const assert = require('node:assert/strict');

const {
  renderBeadPreview,
  renderGuidePreview,
  renderExport
} = require('../../utils/canvas-renderer');

function createFakeContext() {
  const calls = [];

  return {
    calls,
    clearRect(...args) {
      calls.push(['clearRect', ...args]);
    },
    fillRect(...args) {
      calls.push(['fillRect', ...args]);
    },
    strokeRect(...args) {
      calls.push(['strokeRect', ...args]);
    },
    fillText(...args) {
      calls.push(['fillText', ...args]);
    },
    beginPath(...args) {
      calls.push(['beginPath', ...args]);
    },
    arc(...args) {
      calls.push(['arc', ...args]);
    },
    fill(...args) {
      calls.push(['fill', ...args]);
    },
  };
}

const grid = [[
  { code: 'BLANK', name: 'Blank Board', hex: '#f3efe8', label: '1-1', isBlank: true },
  { code: 'R01', name: 'Cherry Red', hex: '#e23d48', label: '1-2' }
]];

test('renders the effect preview as square blocks without round bead arcs', () => {
  const ctx = createFakeContext();

  renderBeadPreview(ctx, grid);

  assert.equal(ctx.calls.some(([name]) => name === 'fillRect'), true);
  assert.equal(ctx.calls.some(([name]) => name === 'arc'), false);
});

test('renders the guide preview with quiet blank board cells and labels only on subject cells', () => {
  const ctx = createFakeContext();

  renderGuidePreview(ctx, grid);

  assert.equal(ctx.calls.filter(([name]) => name === 'fillText').length, 1);
  assert.equal(ctx.calls.some((call) => call[0] === 'fillText' && call[1] === 'BLANK'), false);
  assert.equal(ctx.calls.some(([name]) => name === 'strokeRect'), true);
});

test('renders the export using the reference guide style without pegboard arcs', () => {
  const ctx = createFakeContext();

  renderExport(ctx, grid);

  assert.equal(ctx.calls.some(([name]) => name === 'strokeRect'), true);
  assert.equal(ctx.calls.some(([name]) => name === 'arc'), false);
  assert.equal(ctx.calls.some(([name]) => name === 'fillText'), true);
});
