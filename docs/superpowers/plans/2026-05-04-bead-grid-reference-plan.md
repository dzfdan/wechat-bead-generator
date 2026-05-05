# 拼豆图参考网格与主体清晰度优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the separate pegboard preview, improve portrait detail preservation, and turn the guide output into a centered reference board with a visible blank margin around the subject.

**Architecture:** Keep the effect preview as square blocks, but change the data and guide-render path so a compact subject grid is embedded into a full board-sized grid with blank perimeter cells. Strengthen subject-preserving cleanup heuristics, add a small layout utility for centered board embedding, and simplify the result page back to two outputs while exporting the reference grid by default.

**Tech Stack:** WeChat Mini Program (JavaScript/WXML/WXSS), Canvas 2D, Node.js built-in test runner (`node:test`)

---

## Repository Notes

- Current workspace is not a git repository, so this plan intentionally omits commit steps.
- Current code already contains square-block effect rendering and pegboard preview/export wiring. This plan intentionally removes the pegboard preview path and reorients export to the guide/reference board.

## Planned File Structure

- Create: `utils/grid-layout.js` — embed a compact subject grid into a full board with a fixed blank margin and blank board cells.
- Create: `tests/utils/grid-layout.test.js` — validate centered embedding, margin sizing, and blank-cell generation.
- Modify: `utils/bead-generator.js` — apply centered board embedding before the result model is built and exclude blank cells from usage statistics.
- Modify: `tests/utils/bead-generator.test.js` — verify centered board embedding and blank-cell exclusion from usage.
- Modify: `utils/grid-cleanup.js` — extend subject-preserving heuristics so more meaningful small details survive while outer/background cleanup remains aggressive.
- Modify: `tests/utils/grid-cleanup.test.js` — add one more subject-detail regression for a compact facial/accessory cluster.
- Modify: `utils/canvas-renderer.js` — remove pegboard preview usage, render reference-board blanks cleanly in the guide/export path, and keep square-block preview rendering.
- Modify: `tests/utils/canvas-renderer.test.js` — verify blank cells draw as quiet board cells and that export uses the guide/reference style instead of pegboard arcs.
- Modify: `pages/result/index.js` — remove pegboard preview wiring and export the guide/reference board by default.
- Modify: `pages/result/index.wxml` — remove the pegboard preview card.
- Modify: `pages/result/index.wxss` — clean up any no-longer-needed result page styles.
- Modify: `tests/pages/result.test.js` — verify the result page only renders preview and guide, and exports from the reference grid path.

### Task 1: Embed the subject grid into a centered reference board with blank margins

**Files:**
- Create: `utils/grid-layout.js`
- Create: `tests/utils/grid-layout.test.js`
- Modify: `utils/bead-generator.js`
- Modify: `tests/utils/bead-generator.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// tests/utils/grid-layout.test.js
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
```

```js
// tests/utils/bead-generator.test.js
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

test('builds a centered board result model with blank outer margin cells', () => {
  const grid = [
    [{ code: 'R01', name: 'Cherry Red', hex: '#e23d48' }, { code: 'R01', name: 'Cherry Red', hex: '#e23d48' }],
    [{ code: 'S02', name: 'Warm Skin', hex: '#efc7b6' }, { code: 'K01', name: 'Jet Black', hex: '#222222' }]
  ];

  const result = buildResultModel({
    grid,
    size: 6
  });

  assert.equal(result.size, 6);
  assert.equal(result.gridRows.length, 6);
  assert.equal(result.gridRows[0][0].isBlank, true);
  assert.equal(result.gridRows[2][2].code, 'R01');
  assert.equal(result.gridRows[3][3].code, 'K01');
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/utils/grid-layout.test.js tests/utils/bead-generator.test.js`
Expected: FAIL with `Cannot find module '../../utils/grid-layout'` and missing centered-board behavior in `buildResultModel`.

- [ ] **Step 3: Write minimal implementation**

```js
// utils/grid-layout.js
const DEFAULT_BLANK_CELL = {
  code: 'BLANK',
  name: 'Blank Board',
  hex: '#f3efe8',
  isBlank: true
};

function cloneCell(cell) {
  return { ...cell };
}

function createBlankCell() {
  return cloneCell(DEFAULT_BLANK_CELL);
}

function createBlankBoard(size) {
  return Array.from({ length: size }, () => Array.from({ length: size }, createBlankCell));
}

function embedGridInBoard({ grid, boardSize, contentRatio = 0.66 }) {
  const subjectHeight = grid.length;
  const subjectWidth = subjectHeight > 0 ? grid[0].length : 0;
  const contentSize = Math.max(subjectWidth, subjectHeight);
  const targetContentSize = Math.max(contentSize, Math.floor(boardSize * contentRatio));

  if (subjectWidth > boardSize || subjectHeight > boardSize) {
    throw new Error(`Board size ${boardSize} cannot fit subject grid ${subjectHeight}x${subjectWidth}`);
  }

  const board = createBlankBoard(boardSize);
  const offsetRow = Math.floor((boardSize - subjectHeight) / 2);
  const offsetCol = Math.floor((boardSize - subjectWidth) / 2);

  if (targetContentSize > boardSize) {
    throw new Error(`Board size ${boardSize} cannot fit subject grid ${subjectHeight}x${subjectWidth}`);
  }

  grid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      board[offsetRow + rowIndex][offsetCol + colIndex] = cloneCell(cell);
    });
  });

  return board;
}

module.exports = {
  createBlankCell,
  embedGridInBoard
};
```

```js
// utils/bead-generator.js
const { pickNearestBeadColor } = require('./palette');
const { cleanupGrid } = require('./grid-cleanup');
const { embedGridInBoard } = require('./grid-layout');

function buildBeadGrid({ pixels, width, height }) {
  const expectedPixels = width * height;

  if (!Array.isArray(pixels) || pixels.length !== expectedPixels) {
    throw new Error(`Invalid pixel buffer size: expected ${expectedPixels} pixels but received ${Array.isArray(pixels) ? pixels.length : 0}`);
  }

  for (let index = 0; index < expectedPixels; index += 1) {
    const pixel = pixels[index];

    if (!pixel || typeof pixel.r !== 'number' || typeof pixel.g !== 'number' || typeof pixel.b !== 'number') {
      throw new Error(`Invalid pixel buffer entry at index ${index}`);
    }
  }

  const rows = [];

  for (let row = 0; row < height; row += 1) {
    const currentRow = [];

    for (let col = 0; col < width; col += 1) {
      const pixel = pixels[(row * width) + col];
      currentRow.push(pickNearestBeadColor(pixel));
    }

    rows.push(currentRow);
  }

  return cleanupGrid(rows);
}

function summarizeUsage(grid) {
  const counts = new Map();

  grid.flat().forEach((item) => {
    if (item.isBlank) {
      return;
    }

    const existing = counts.get(item.code);

    if (existing) {
      existing.count += 1;
      return;
    }

    counts.set(item.code, {
      code: item.code,
      name: item.name,
      hex: item.hex,
      count: 1
    });
  });

  return Array.from(counts.values()).sort((left, right) => right.count - left.count);
}

function buildResultModel({ grid, size }) {
  const boardGrid = embedGridInBoard({
    grid,
    boardSize: size
  });

  return {
    size,
    gridRows: boardGrid.map((row, rowIndex) => row.map((cell, colIndex) => ({
      ...cell,
      label: `${rowIndex + 1}-${colIndex + 1}`
    }))),
    usage: summarizeUsage(boardGrid)
  };
}

module.exports = {
  buildBeadGrid,
  summarizeUsage,
  buildResultModel
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/utils/grid-layout.test.js tests/utils/bead-generator.test.js`
Expected: PASS

- [ ] **Step 5: Run generator regression checks**

Run: `node --test tests/utils/grid-layout.test.js tests/utils/bead-generator.test.js tests/utils/grid-cleanup.test.js`
Expected: PASS

### Task 2: Remove the pegboard preview and make the reference guide the default export target

**Files:**
- Modify: `utils/canvas-renderer.js`
- Modify: `tests/utils/canvas-renderer.test.js`
- Modify: `pages/result/index.js`
- Modify: `pages/result/index.wxml`
- Modify: `pages/result/index.wxss`
- Modify: `tests/pages/result.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// tests/utils/canvas-renderer.test.js
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
    }
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
```

```js
// tests/pages/result.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const resultPageJs = path.join(__dirname, '../../pages/result/index.js');
const resultPageWxml = path.join(__dirname, '../../pages/result/index.wxml');
const resultPageWxss = path.join(__dirname, '../../pages/result/index.wxss');

const payload = {
  sourceImagePath: 'images/source.png',
  size: 48,
  gridRows: [[{ code: 'R01', name: 'Cherry Red', hex: '#e23d48', label: '1-1' }]],
  usage: [{ code: 'R01', name: 'Cherry Red', hex: '#e23d48', count: 1 }]
};

test('result page exists and loads the latest generation result', () => {
  assert.equal(fs.existsSync(resultPageJs), true);
  assert.equal(fs.existsSync(resultPageWxml), true);
  assert.equal(fs.existsSync(resultPageWxss), true);

  const originalPage = global.Page;
  const originalGetApp = global.getApp;
  const registrations = [];

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

test('result page renders preview and guide canvases only, and exports the guide canvas path', () => {
  const renderer = require('../../utils/canvas-renderer');
  const originalPage = global.Page;
  const originalGetApp = global.getApp;
  const originalWx = global.wx;
  const originalBeadPreview = renderer.renderBeadPreview;
  const originalGuidePreview = renderer.renderGuidePreview;
  const originalRenderExport = renderer.renderExport;
  const registrations = [];
  const renderCalls = [];
  let exportOptions = null;
  let savedFilePath = null;

  function beadPreview() {}
  function guidePreview() {}
  function exportPreview() {}

  renderer.renderBeadPreview = beadPreview;
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

    assert.deepEqual(renderCalls.slice(0, 2), [
      { selector: '#previewCanvas', scale: 10, rendererFn: beadPreview },
      { selector: '#guideCanvas', scale: 10, rendererFn: guidePreview }
    ]);
    assert.deepEqual(renderCalls[2], {
      selector: '#exportCanvas',
      scale: 24,
      rendererFn: exportPreview
    });
    assert.equal(exportOptions.canvas.nodeType, '#exportCanvas');
    assert.equal(savedFilePath, 'images/export.png');
  } finally {
    renderer.renderBeadPreview = originalBeadPreview;
    renderer.renderGuidePreview = originalGuidePreview;
    renderer.renderExport = originalRenderExport;
    global.Page = originalPage;
    global.getApp = originalGetApp;
    global.wx = originalWx;
    delete require.cache[require.resolve(resultPageJs)];
  }
});

test('result page template includes preview, guide and export canvases only', () => {
  const template = fs.readFileSync(resultPageWxml, 'utf8');
  const styles = fs.readFileSync(resultPageWxss, 'utf8');

  assert.match(template, /id="previewCanvas"/);
  assert.doesNotMatch(template, /id="pegboardCanvas"/);
  assert.match(template, /id="guideCanvas"/);
  assert.match(template, /id="exportCanvas"/);
  assert.match(styles, /preview-canvas/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/utils/canvas-renderer.test.js tests/pages/result.test.js`
Expected: FAIL because `renderExport()` still uses pegboard arcs, `renderPegboardPreview` is still wired on the page, and `pegboardCanvas` still exists in the template.

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

      if (cell.isBlank) {
        return;
      }

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

function renderGuidePreview(ctx, grid) {
  drawGuide(ctx, grid, PREVIEW_SCALE);
}

function renderExport(ctx, grid) {
  drawGuide(ctx, grid, EXPORT_SCALE);
}

module.exports = {
  renderBeadPreview,
  renderGuidePreview,
  renderExport
};
```

```js
// pages/result/index.js
const { EXPORT_SCALE, PREVIEW_SCALE } = require('../../utils/constants');
const {
  renderBeadPreview,
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

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/utils/canvas-renderer.test.js tests/pages/result.test.js`
Expected: PASS

- [ ] **Step 5: Run page and renderer regression checks**

Run: `node --test tests/utils/canvas-renderer.test.js tests/pages/result.test.js tests/utils/bead-generator.test.js`
Expected: PASS

### Task 3: Strengthen subject-detail preservation for reference-board layouts

**Files:**
- Modify: `utils/grid-cleanup.js`
- Modify: `tests/utils/grid-cleanup.test.js`

- [ ] **Step 1: Write the failing test**

```js
// tests/utils/grid-cleanup.test.js
const test = require('node:test');
const assert = require('node:assert/strict');

const { cleanupGrid } = require('../../utils/grid-cleanup');

function cell(code, hex, extra = {}) {
  return { code, name: code, hex, ...extra };
}

// keep all existing tests above

test('preserves a compact centered facial shadow cluster when it is surrounded by skin but anchored to darker detail', () => {
  const grid = [
    [cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0')],
    [cell('W01', '#f5f5f0'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('S02', '#efc7b6'), cell('W01', '#f5f5f0')],
    [cell('W01', '#f5f5f0'), cell('S02', '#efc7b6'), cell('S04', '#c99582'), cell('K01', '#222222'), cell('W01', '#f5f5f0')],
    [cell('W01', '#f5f5f0'), cell('S02', '#efc7b6'), cell('S04', '#c99582'), cell('S02', '#efc7b6'), cell('W01', '#f5f5f0')],
    [cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0'), cell('W01', '#f5f5f0')]
  ];

  const result = cleanupGrid(grid);

  assert.equal(result[2][2].code, 'S04');
  assert.equal(result[3][2].code, 'S04');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/utils/grid-cleanup.test.js`
Expected: FAIL because the current cleanup logic can still merge the compact facial shadow cluster back into surrounding skin.

- [ ] **Step 3: Write minimal implementation**

```js
// utils/grid-cleanup.js
// Keep the current file structure and existing helpers.
// Add one focused helper that treats a compact centered 2-cell cluster as preservable
// when it is adjacent to another non-background subject detail and contrasts against the dominant border.

function shouldPreserveCompactSubjectCluster(grid, component, dominantBorder) {
  if (component.length !== 2) {
    return false;
  }

  const center = getComponentCenter(component);
  const rowCenter = (grid.length - 1) / 2;
  const colCenter = (grid[0].length - 1) / 2;
  const isNearCenter = (Math.abs(center.row - rowCenter) + Math.abs(center.col - colCenter)) <= Math.max(2, Math.floor(grid.length / 4));

  if (!isNearCenter) {
    return false;
  }

  if (!isCompactCenteredPair(component)) {
    return false;
  }

  const anchorNeighbors = component.flatMap(([row, col]) => getNeighborPositions(grid, row, col))
    .map(([row, col]) => grid[row][col])
    .filter((cell) => !isBackgroundLikeCell(cell) && cell.code !== dominantBorder.cell.code);

  return anchorNeighbors.length > 0;
}

// Then in cleanupGrid(), keep the existing preservation checks and extend them with:
// if (shouldPreserveCompactSubjectCluster(grid, component, dominantBorder)) { continue; }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/utils/grid-cleanup.test.js`
Expected: PASS

- [ ] **Step 5: Run the full suite and do a manual visual check**

Run: `npm test`
Expected: PASS

Manual check in WeChat DevTools:

- Generate a result from `微信图片_20260504132820_32_100.jpg`
- Confirm the result page now shows only the square-block effect preview and the reference grid
- Confirm the guide/reference grid has visible blank margin around the centered subject instead of filling the full board
- Confirm the exported image matches the reference grid style rather than the old pegboard preview
- Confirm key facial details remain more legible than before in the centered reference layout

## Self-Review Checklist

- **Spec coverage:** Task 1 adds centered board embedding and excludes blank cells from usage. Task 2 removes the pegboard preview/export path and shifts export to the reference guide. Task 3 continues strengthening subject-preserving cleanup for centered detail clusters.
- **Placeholder scan:** No `TBD`, `TODO`, or “similar to” references remain.
- **Type consistency:** The plan consistently uses `createBlankCell`, `embedGridInBoard`, `buildResultModel`, `summarizeUsage`, `renderBeadPreview`, `renderGuidePreview`, and `renderExport` across implementation and tests.
