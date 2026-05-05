# 拼豆图清晰度与豆板背景渲染 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve portrait readability, switch the main effect preview from round beads to square pixel blocks, add a pegboard-background render, and make pegboard export the default saved image.

**Architecture:** Keep one final `gridRows` model and improve both its generation and its rendering. Extend `grid-cleanup` with feature-preserving cleanup rules, update `canvas-renderer` to support square-block previews plus pegboard renders, and wire the result page to show three canvases while exporting the pegboard canvas by default.

**Tech Stack:** WeChat Mini Program (JavaScript/WXML/WXSS), Canvas 2D, Node.js built-in test runner (`node:test`)

---

## Repository Notes

- Current workspace is not a git repository, so this plan intentionally omits commit steps.
- The current result model should remain `sourceImagePath`, `size`, `gridRows`, and `usage`; new output types must reuse that same data.

## Planned File Structure

- Modify: `utils/grid-cleanup.js` — add feature-preserving cleanup rules so small high-contrast subject details survive while background noise is still merged.
- Modify: `tests/utils/grid-cleanup.test.js` — verify subject-detail preservation and center-weighted cleanup behavior.
- Modify: `utils/canvas-renderer.js` — replace the round bead preview with square block rendering, add pegboard preview/export renderers, and keep the guide renderer intact.
- Modify: `tests/utils/canvas-renderer.test.js` — verify square-block rendering and pegboard drawing order.
- Modify: `pages/result/index.js` — render the new pegboard canvas on ready and export the pegboard canvas by default.
- Modify: `pages/result/index.wxml` — add the pegboard preview canvas.
- Modify: `pages/result/index.wxss` — style the extra preview card while keeping current layout stable.
- Modify: `tests/pages/result.test.js` — verify pegboard render and export wiring.

### Task 1: Preserve important facial details while still cleaning noisy background regions

**Files:**
- Modify: `utils/grid-cleanup.js`
- Modify: `tests/utils/grid-cleanup.test.js`

- [ ] **Step 1: Write the failing test**

```js
// tests/utils/grid-cleanup.test.js
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

test('preserves a small high-contrast eye detail near the image center', () => {
  const grid = [
    [cell('B27'), cell('B27'), cell('B27'), cell('B27'), cell('B27')],
    [cell('B27'), cell('S02'), cell('S02'), cell('S02'), cell('B27')],
    [cell('B27'), cell('S02'), cell('K01'), cell('S02'), cell('B27')],
    [cell('B27'), cell('S02'), cell('S02'), cell('S02'), cell('B27')],
    [cell('B27'), cell('B27'), cell('B27'), cell('B27'), cell('B27')]
  ];

  const result = cleanupGrid(grid);

  assert.equal(result[2][2].code, 'K01');
});

test('still clears a tiny background island near the outer edge', () => {
  const grid = [
    [cell('B27'), cell('P02'), cell('B27'), cell('B27'), cell('B27')],
    [cell('B27'), cell('B27'), cell('B27'), cell('B27'), cell('B27')],
    [cell('B27'), cell('B27'), cell('S02'), cell('S02'), cell('B27')],
    [cell('B27'), cell('B27'), cell('S02'), cell('S02'), cell('B27')],
    [cell('B27'), cell('B27'), cell('B27'), cell('B27'), cell('B27')]
  ];

  const result = cleanupGrid(grid);

  assert.equal(result[0][1].code, 'B27');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/utils/grid-cleanup.test.js`
Expected: FAIL because the current cleanup rules will still merge the centered `K01` eye detail into the surrounding skin tone.

- [ ] **Step 3: Write minimal implementation**

```js
// utils/grid-cleanup.js
function cloneCell(cell) {
  return { ...cell };
}

function cloneGrid(grid) {
  return grid.map((row) => row.map(cloneCell));
}

function getNeighborPositions(grid, row, col) {
  const positions = [];

  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
      if (rowOffset === 0 && colOffset === 0) {
        continue;
      }

      const nextRow = row + rowOffset;
      const nextCol = col + colOffset;

      if (!grid[nextRow] || !grid[nextRow][nextCol]) {
        continue;
      }

      positions.push([nextRow, nextCol]);
    }
  }

  return positions;
}

function collectComponent(grid, startRow, startCol, visited) {
  const startCode = grid[startRow][startCol].code;
  const queue = [[startRow, startCol]];
  const cells = [];
  visited.add(`${startRow}:${startCol}`);

  while (queue.length > 0) {
    const [row, col] = queue.shift();
    cells.push([row, col]);

    getNeighborPositions(grid, row, col).forEach(([nextRow, nextCol]) => {
      const key = `${nextRow}:${nextCol}`;

      if (visited.has(key)) {
        return;
      }

      if (grid[nextRow][nextCol].code !== startCode) {
        return;
      }

      visited.add(key);
      queue.push([nextRow, nextCol]);
    });
  }

  return cells;
}

function getDominantBorderCell(grid, component) {
  const componentKeys = new Set(component.map(([row, col]) => `${row}:${col}`));
  const borderCounts = new Map();

  component.forEach(([row, col]) => {
    getNeighborPositions(grid, row, col).forEach(([neighborRow, neighborCol]) => {
      const key = `${neighborRow}:${neighborCol}`;

      if (componentKeys.has(key)) {
        return;
      }

      const neighbor = grid[neighborRow][neighborCol];
      const existing = borderCounts.get(neighbor.code);

      if (existing) {
        existing.count += 1;
        return;
      }

      borderCounts.set(neighbor.code, {
        cell: neighbor,
        count: 1
      });
    });
  });

  let best = null;
  let hasTie = false;
  borderCounts.forEach((entry) => {
    if (!best || entry.count > best.count) {
      best = entry;
      hasTie = false;
      return;
    }

    if (entry.count === best.count) {
      hasTie = true;
    }
  });

  if (hasTie) {
    return null;
  }

  return best;
}

function getGridCenterDistance(grid, component) {
  const rowCenter = (grid.length - 1) / 2;
  const colCenter = (grid[0].length - 1) / 2;
  const [row, col] = component[Math.floor(component.length / 2)];

  return Math.abs(row - rowCenter) + Math.abs(col - colCenter);
}

function shouldPreserveComponent(grid, component, dominantBorder) {
  if (component.length > 1) {
    return true;
  }

  const [row, col] = component[0];
  const current = grid[row][col];
  const neighbors = getNeighborPositions(grid, row, col).map(([nextRow, nextCol]) => grid[nextRow][nextCol]);
  const sameFamilyNeighborCount = neighbors.filter((neighbor) => neighbor.code[0] === current.code[0]).length;
  const isNearCenter = getGridCenterDistance(grid, component) <= Math.max(2, Math.floor(grid.length / 4));
  const isDarkDetail = current.code.startsWith('K') || current.code.startsWith('H');
  const borderStartsWithBackground = dominantBorder && dominantBorder.cell.code.startsWith('B');

  return isNearCenter && isDarkDetail && sameFamilyNeighborCount === 0 && borderStartsWithBackground === false;
}

function cleanupGrid(grid) {
  const next = cloneGrid(grid);
  const visited = new Set();

  for (let row = 0; row < grid.length; row += 1) {
    for (let col = 0; col < grid[row].length; col += 1) {
      const key = `${row}:${col}`;

      if (visited.has(key)) {
        continue;
      }

      const component = collectComponent(grid, row, col, visited);

      if (component.length > 2) {
        continue;
      }

      const dominantBorder = getDominantBorderCell(grid, component);

      if (!dominantBorder || dominantBorder.count < component.length * 3) {
        continue;
      }

      if (shouldPreserveComponent(grid, component, dominantBorder)) {
        continue;
      }

      component.forEach(([componentRow, componentCol]) => {
        next[componentRow][componentCol] = cloneCell(dominantBorder.cell);
      });
    }
  }

  return next;
}

module.exports = {
  cleanupGrid
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/utils/grid-cleanup.test.js`
Expected: PASS

- [ ] **Step 5: Run cleanup regression checks**

Run: `node --test tests/utils/grid-cleanup.test.js tests/utils/bead-generator.test.js`
Expected: PASS

### Task 2: Replace the round bead preview with square blocks and add pegboard renderers

**Files:**
- Modify: `utils/canvas-renderer.js`
- Modify: `tests/utils/canvas-renderer.test.js`

- [ ] **Step 1: Write the failing test**

```js
// tests/utils/canvas-renderer.test.js
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  renderBeadPreview,
  renderPegboardPreview,
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
    save(...args) {
      calls.push(['save', ...args]);
    },
    restore(...args) {
      calls.push(['restore', ...args]);
    },
    createRadialGradient() {
      return {
        addColorStop() {}
      };
    }
  };
}

const grid = [[{ code: 'R01', name: 'Cherry Red', hex: '#e23d48', label: '1-1' }]];

test('renders the guide preview with grid lines and color codes', () => {
  const ctx = createFakeContext();

  renderGuidePreview(ctx, grid);

  assert.equal(ctx.calls.some(([name]) => name === 'strokeRect'), true);
  assert.equal(ctx.calls.some(([name]) => name === 'fillText'), true);
});

test('renders the bead preview as square blocks without round bead arcs', () => {
  const ctx = createFakeContext();

  renderBeadPreview(ctx, grid);

  assert.equal(ctx.calls.some(([name]) => name === 'fillRect'), true);
  assert.equal(ctx.calls.some(([name]) => name === 'arc'), false);
  assert.equal(ctx.calls.some(([name]) => name === 'fillText'), false);
});

test('renders the pegboard preview with board holes before colored beads', () => {
  const ctx = createFakeContext();

  renderPegboardPreview(ctx, grid);

  const firstArc = ctx.calls.findIndex(([name]) => name === 'arc');
  const firstFillRect = ctx.calls.findIndex(([name]) => name === 'fillRect');

  assert.equal(firstFillRect >= 0, true);
  assert.equal(firstArc >= 0, true);
  assert.equal(firstFillRect < firstArc, true);
  assert.equal(ctx.calls.filter(([name]) => name === 'arc').length >= 2, true);
});

test('renders the export with pegboard background and without guide labels', () => {
  const ctx = createFakeContext();

  renderExport(ctx, grid);

  assert.equal(ctx.calls.some(([name]) => name === 'fillText'), false);
  assert.equal(ctx.calls.filter(([name]) => name === 'arc').length >= 2, true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/utils/canvas-renderer.test.js`
Expected: FAIL because `renderPegboardPreview` does not exist and the current bead preview still uses `arc()`.

- [ ] **Step 3: Write minimal implementation**

```js
// utils/canvas-renderer.js
const {
  EXPORT_SCALE,
  PREVIEW_SCALE,
  GRID_STROKE_COLOR
} = require('./constants');

function clearCanvas(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
}

function getGridSize(grid, cellSize) {
  const rowCount = grid.length;
  const colCount = rowCount > 0 ? grid[0].length : 0;

  return {
    width: colCount * cellSize,
    height: rowCount * cellSize
  };
}

function drawSquareBlocks(ctx, grid, cellSize) {
  const { width, height } = getGridSize(grid, cellSize);

  clearCanvas(ctx, width, height);

  grid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const x = colIndex * cellSize;
      const y = rowIndex * cellSize;

      ctx.fillStyle = cell.hex;
      ctx.fillRect(x, y, cellSize, cellSize);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellSize, cellSize);
    });
  });
}

function drawPegboard(ctx, grid, cellSize) {
  const { width, height } = getGridSize(grid, cellSize);

  clearCanvas(ctx, width, height);
  ctx.fillStyle = '#f3e7d8';
  ctx.fillRect(0, 0, width, height);

  grid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const x = colIndex * cellSize;
      const y = rowIndex * cellSize;
      const centerX = x + (cellSize / 2);
      const centerY = y + (cellSize / 2);
      const holeRadius = cellSize * 0.16;
      const beadRadius = cellSize * 0.34;

      ctx.fillStyle = '#e5d4c0';
      ctx.fillRect(x, y, cellSize, cellSize);

      ctx.beginPath();
      ctx.fillStyle = '#d6c0a8';
      ctx.arc(centerX, centerY, holeRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = cell.hex;
      ctx.arc(centerX, centerY, beadRadius, 0, Math.PI * 2);
      ctx.fill();
    });
  });
}

function drawGuide(ctx, grid, cellSize) {
  const { width, height } = getGridSize(grid, cellSize);

  clearCanvas(ctx, width, height);

  grid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const x = colIndex * cellSize;
      const y = rowIndex * cellSize;

      ctx.fillStyle = cell.hex;
      ctx.fillRect(x, y, cellSize, cellSize);
      ctx.strokeStyle = GRID_STROKE_COLOR;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellSize, cellSize);
      ctx.fillStyle = '#111827';
      ctx.font = `${Math.max(10, Math.floor(cellSize / 3))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cell.code, x + (cellSize / 2), y + (cellSize / 2));
    });
  });
}

function renderBeadPreview(ctx, grid) {
  drawSquareBlocks(ctx, grid, PREVIEW_SCALE);
}

function renderPegboardPreview(ctx, grid) {
  drawPegboard(ctx, grid, PREVIEW_SCALE);
}

function renderGuidePreview(ctx, grid) {
  drawGuide(ctx, grid, PREVIEW_SCALE);
}

function renderExport(ctx, grid) {
  drawPegboard(ctx, grid, EXPORT_SCALE);
}

module.exports = {
  renderBeadPreview,
  renderPegboardPreview,
  renderGuidePreview,
  renderExport
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/utils/canvas-renderer.test.js`
Expected: PASS

- [ ] **Step 5: Run renderer regression checks**

Run: `node --test tests/utils/canvas-renderer.test.js tests/utils/grid-cleanup.test.js`
Expected: PASS

### Task 3: Show the pegboard preview on the result page and export it by default

**Files:**
- Modify: `pages/result/index.js`
- Modify: `pages/result/index.wxml`
- Modify: `pages/result/index.wxss`
- Modify: `tests/pages/result.test.js`

- [ ] **Step 1: Write the failing test**

```js
// tests/pages/result.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const resultPageJs = path.join(__dirname, '../../pages/result/index.js');
const resultPageWxml = path.join(__dirname, '../../pages/result/index.wxml');
const resultPageWxss = path.join(__dirname, '../../pages/result/index.wxss');

test('result page exists and loads the latest generation result', () => {
  assert.equal(fs.existsSync(resultPageJs), true);
  assert.equal(fs.existsSync(resultPageWxml), true);
  assert.equal(fs.existsSync(resultPageWxss), true);

  const originalPage = global.Page;
  const originalGetApp = global.getApp;
  const registrations = [];
  const payload = {
    sourceImagePath: 'images/source.png',
    size: 48,
    gridRows: [[{ code: 'R01', name: 'Cherry Red', hex: '#e23d48', label: '1-1' }]],
    usage: [{ code: 'R01', name: 'Cherry Red', hex: '#e23d48', count: 1 }]
  };

  global.Page = (definition) => {
    registrations.push(definition);
  };
  global.getApp = () => ({
    globalData: {
      currentResult: payload
    }
  });

  try {
    delete require.cache[require.resolve(resultPageJs)];
    require(resultPageJs);

    assert.equal(registrations.length, 1);

    const page = registrations[0];
    const instance = {
      data: {
        ...page.data
      },
      setData(update) {
        Object.assign(this.data, update);
      }
    };

    page.onLoad.call(instance);

    assert.deepEqual(instance.data.result, payload);
  } finally {
    global.Page = originalPage;
    global.getApp = originalGetApp;
    delete require.cache[require.resolve(resultPageJs)];
  }
});

test('result page renders preview, pegboard, guide canvases and exports from the pegboard canvas', () => {
  const renderer = require('../../utils/canvas-renderer');
  const originalPage = global.Page;
  const originalGetApp = global.getApp;
  const originalWx = global.wx;
  const originalBeadPreview = renderer.renderBeadPreview;
  const originalPegboardPreview = renderer.renderPegboardPreview;
  const originalGuidePreview = renderer.renderGuidePreview;
  const originalRenderExport = renderer.renderExport;
  const registrations = [];
  const payload = {
    sourceImagePath: 'images/source.png',
    size: 48,
    gridRows: [[{ code: 'R01', name: 'Cherry Red', hex: '#e23d48', label: '1-1' }]],
    usage: [{ code: 'R01', name: 'Cherry Red', hex: '#e23d48', count: 1 }]
  };
  const renderCalls = [];
  let exportOptions = null;
  let savedFilePath = null;

  function beadPreview() {}
  function pegboardPreview() {}
  function guidePreview() {}
  function exportPreview() {}

  renderer.renderBeadPreview = beadPreview;
  renderer.renderPegboardPreview = pegboardPreview;
  renderer.renderGuidePreview = guidePreview;
  renderer.renderExport = exportPreview;

  global.Page = (definition) => {
    registrations.push(definition);
  };
  global.getApp = () => ({
    globalData: {
      currentResult: payload
    }
  });
  global.wx = {
    canvasToTempFilePath(options) {
      exportOptions = options;
      options.success({ tempFilePath: 'images/export.png' });
    },
    saveImageToPhotosAlbum({ filePath, success }) {
      savedFilePath = filePath;
      success();
    },
    showToast() {}
  };

  try {
    delete require.cache[require.resolve(resultPageJs)];
    require(resultPageJs);

    const page = registrations[0];
    const instance = {
      data: {
        ...page.data,
        result: payload
      },
      renderCanvas(selector, scale, rendererFn, callback) {
        renderCalls.push({ selector, scale, rendererFn });
        if (typeof callback === 'function') {
          callback({ nodeType: selector });
        }
      },
      setData(update) {
        Object.assign(this.data, update);
      }
    };

    page.onReady.call(instance);
    page.saveImage.call(instance);

    assert.deepEqual(renderCalls.slice(0, 3), [
      { selector: '#previewCanvas', scale: 10, rendererFn: beadPreview },
      { selector: '#pegboardCanvas', scale: 10, rendererFn: pegboardPreview },
      { selector: '#guideCanvas', scale: 10, rendererFn: guidePreview }
    ]);
    assert.deepEqual(renderCalls[3], {
      selector: '#exportCanvas',
      scale: 24,
      rendererFn: exportPreview
    });
    assert.equal(exportOptions.canvas.nodeType, '#exportCanvas');
    assert.equal(savedFilePath, 'images/export.png');
  } finally {
    renderer.renderBeadPreview = originalBeadPreview;
    renderer.renderPegboardPreview = originalPegboardPreview;
    renderer.renderGuidePreview = originalGuidePreview;
    renderer.renderExport = originalRenderExport;
    global.Page = originalPage;
    global.getApp = originalGetApp;
    global.wx = originalWx;
    delete require.cache[require.resolve(resultPageJs)];
  }
});

test('result page template includes preview, pegboard, guide and export canvases', () => {
  const template = fs.readFileSync(resultPageWxml, 'utf8');
  const styles = fs.readFileSync(resultPageWxss, 'utf8');

  assert.match(template, /id="previewCanvas"/);
  assert.match(template, /id="pegboardCanvas"/);
  assert.match(template, /id="guideCanvas"/);
  assert.match(template, /id="exportCanvas"/);
  assert.match(styles, /preview-canvas/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/pages/result.test.js`
Expected: FAIL because `renderPegboardPreview` is not imported or called and `pegboardCanvas` is not present in the template.

- [ ] **Step 3: Write minimal implementation**

```js
// pages/result/index.js
const { EXPORT_SCALE, PREVIEW_SCALE } = require('../../utils/constants');
const {
  renderBeadPreview,
  renderPegboardPreview,
  renderGuidePreview,
  renderExport
} = require('../../utils/canvas-renderer');

function getResultFromApp() {
  const app = getApp();
  return app && app.globalData ? app.globalData.currentResult : null;
}

Page({
  data: {
    result: null
  },

  onLoad() {
    const result = getResultFromApp();

    if (!result) {
      wx.showToast({
        title: '请重新生成拼豆图',
        icon: 'none'
      });
      wx.navigateBack({
        delta: 1
      });
      return;
    }

    this.setData({
      result
    });
  },

  onReady() {
    if (!this.data.result) {
      return;
    }

    this.renderCanvas('#previewCanvas', PREVIEW_SCALE, renderBeadPreview);
    this.renderCanvas('#pegboardCanvas', PREVIEW_SCALE, renderPegboardPreview);
    this.renderCanvas('#guideCanvas', PREVIEW_SCALE, renderGuidePreview);
  },

  renderCanvas(selector, scale, renderer, callback) {
    const { result } = this.data;

    if (!result) {
      return;
    }

    wx.createSelectorQuery()
      .select(selector)
      .fields({ node: true, size: true })
      .exec((res) => {
        const target = res && res[0];

        if (!target || !target.node) {
          if (typeof callback === 'function') {
            callback(null);
          }
          return;
        }

        const canvas = target.node;
        const ctx = canvas.getContext('2d');
        const width = result.size * scale;
        const height = result.size * scale;

        canvas.width = width;
        canvas.height = height;
        renderer(ctx, result.gridRows);

        if (typeof callback === 'function') {
          callback(canvas);
        }
      });
  },

  saveImage() {
    if (!this.data.result) {
      return;
    }

    this.renderCanvas('#exportCanvas', EXPORT_SCALE, renderExport, (canvas) => {
      if (!canvas) {
        wx.showToast({
          title: '导出失败',
          icon: 'none'
        });
        return;
      }

      wx.canvasToTempFilePath({
        canvas,
        success: ({ tempFilePath }) => {
          wx.saveImageToPhotosAlbum({
            filePath: tempFilePath,
            success: () => {
              wx.showToast({
                title: '已保存到相册'
              });
            },
            fail: () => {
              wx.showToast({
                title: '保存失败，请检查权限',
                icon: 'none'
              });
            }
          });
        },
        fail: () => {
          wx.showToast({
            title: '导出失败',
            icon: 'none'
          });
        }
      });
    });
  }
});
```

```xml
<!-- pages/result/index.wxml -->
<view class="page" wx:if="{{result}}">
  <view class="card">
    <view class="title">拼豆效果图</view>
    <canvas id="previewCanvas" type="2d" class="preview-canvas"></canvas>
  </view>

  <view class="card">
    <view class="title">豆板背景图</view>
    <canvas id="pegboardCanvas" type="2d" class="preview-canvas"></canvas>
  </view>

  <view class="card">
    <view class="title">网格色号图</view>
    <canvas id="guideCanvas" type="2d" class="preview-canvas"></canvas>
  </view>

  <view class="card">
    <view class="title">颜色用量统计</view>
    <view class="usage-row" wx:for="{{result.usage}}" wx:key="code">
      <view class="swatch" style="background: {{item.hex}};"></view>
      <view class="usage-text">{{item.code}} {{item.name}}</view>
      <view class="usage-count">{{item.count}} 颗</view>
    </view>
  </view>

  <view class="card">
    <button class="primary-button" bindtap="saveImage">保存高清拼豆图</button>
  </view>

  <canvas id="exportCanvas" type="2d" class="hidden-canvas"></canvas>
</view>
```

```css
/* pages/result/index.wxss */
.page {
  min-height: 100vh;
  padding: 24rpx;
  background: #f5f7fb;
  box-sizing: border-box;
}

.card {
  margin-bottom: 24rpx;
  padding: 24rpx;
  border-radius: 24rpx;
  background: #ffffff;
  box-shadow: 0 12rpx 32rpx rgba(15, 23, 42, 0.08);
}

.title {
  margin-bottom: 16rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: #111827;
}

.preview-canvas {
  width: 640rpx;
  height: 640rpx;
  border-radius: 16rpx;
  background: #ffffff;
}

.hidden-canvas {
  position: fixed;
  left: -9999px;
  top: -9999px;
  width: 1px;
  height: 1px;
}

.usage-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 12rpx 0;
  border-bottom: 1px solid #eef2f7;
}

.usage-row:last-child {
  border-bottom: none;
}

.swatch {
  width: 32rpx;
  height: 32rpx;
  border-radius: 999rpx;
  border: 1px solid #d0d7de;
  flex-shrink: 0;
}

.usage-text {
  flex: 1;
  font-size: 28rpx;
  color: #1f2937;
}

.usage-count {
  font-size: 28rpx;
  color: #4b5563;
}

.primary-button {
  width: 100%;
  border-radius: 999rpx;
  background: #2563eb;
  color: #ffffff;
  font-size: 30rpx;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/pages/result.test.js`
Expected: PASS

- [ ] **Step 5: Run the full suite and perform a manual visual check**

Run: `npm test`
Expected: PASS

Manual check in WeChat DevTools:

- Generate a result from `微信图片_20260504132820_32_100.jpg`
- Confirm “拼豆效果图” now uses square blocks rather than round beads
- Confirm “豆板背景图” appears as a separate preview card
- Confirm “保存高清拼豆图” exports the pegboard-style result rather than the old round-bead image

## Self-Review Checklist

- **Spec coverage:** Task 1 covers subject-preserving cleanup and continued background simplification. Task 2 covers square-block effect rendering and pegboard rendering. Task 3 covers result page display and default export changes.
- **Placeholder scan:** No `TBD`, `TODO`, or “similar to” references remain.
- **Type consistency:** The plan consistently uses `cleanupGrid`, `renderBeadPreview`, `renderPegboardPreview`, `renderGuidePreview`, and `renderExport` across tests and implementation.
