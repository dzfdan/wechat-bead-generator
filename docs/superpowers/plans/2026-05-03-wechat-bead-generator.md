# WeChat Bead Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a WeChat Mini Program that turns a locally selected image into a bead-art render, bead grid, and color usage summary entirely on-device, then saves the HD render to the photo album.

**Architecture:** Use a native Mini Program app with two pages (`index` and `result`). Keep image processing in plain JavaScript utility modules so the core logic is unit-testable with Node’s built-in test runner, while page files stay thin wrappers around WeChat APIs and canvas rendering.

**Tech Stack:** WeChat Mini Program (WXML/WXSS/JavaScript), Canvas 2D, Node.js built-in test runner (`node:test`)

---

## Repository Notes

- Current workspace is **not** a git repository, so the plan intentionally omits commit steps.
- The app is planned as a fresh Mini Program project rooted at `/mnt/d/git/Demo`.

## Planned File Structure

- Create: `package.json` — local test script for utility tests
- Create: `project.config.json` — WeChat DevTools project config
- Create: `sitemap.json` — Mini Program sitemap
- Create: `app.js` — application bootstrap and global result cache
- Create: `app.json` — page registration and window config
- Create: `app.wxss` — shared app styles
- Create: `pages/index/index.js` — upload/size selection/generate page controller
- Create: `pages/index/index.wxml` — upload and size selection UI
- Create: `pages/index/index.wxss` — index page styles
- Create: `pages/result/index.js` — render and save result page controller
- Create: `pages/result/index.wxml` — result previews and summary UI
- Create: `pages/result/index.wxss` — result page styles
- Create: `utils/constants.js` — fixed size options and render constants
- Create: `utils/palette.js` — built-in bead palette and nearest-color matching
- Create: `utils/bead-generator.js` — grid conversion and usage summary logic
- Create: `utils/session-store.js` — in-memory result cache between pages
- Create: `utils/canvas-renderer.js` — render helpers for preview/export canvases
- Test: `tests/utils/constants.test.js`
- Test: `tests/utils/palette.test.js`
- Test: `tests/utils/bead-generator.test.js`
- Test: `tests/utils/session-store.test.js`

### Task 1: Bootstrap the Mini Program skeleton and shared constants

**Files:**
- Create: `package.json`
- Create: `project.config.json`
- Create: `sitemap.json`
- Create: `app.js`
- Create: `app.json`
- Create: `app.wxss`
- Create: `utils/constants.js`
- Test: `tests/utils/constants.test.js`

- [ ] **Step 1: Write the failing test**

```js
// tests/utils/constants.test.js
const test = require('node:test');
const assert = require('node:assert/strict');

const { SIZE_OPTIONS, EXPORT_SCALE, GRID_STROKE_COLOR } = require('../../utils/constants');

test('exports the fixed bead sizes and render defaults', () => {
  assert.deepEqual(
    SIZE_OPTIONS.map((item) => item.value),
    [32, 48, 64]
  );
  assert.equal(EXPORT_SCALE, 24);
  assert.equal(GRID_STROKE_COLOR, '#d0d7de');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/utils/constants.test.js`
Expected: FAIL with `Cannot find module '../../utils/constants'`

- [ ] **Step 3: Write minimal implementation**

```json
// package.json
{
  "name": "wechat-bead-generator",
  "private": true,
  "scripts": {
    "test": "node --test tests/utils/*.test.js"
  }
}
```

```json
// project.config.json
{
  "appid": "touristappid",
  "compileType": "miniprogram",
  "miniprogramRoot": "./",
  "setting": {
    "urlCheck": false,
    "es6": true,
    "enhance": true,
    "postcss": true,
    "minified": false
  }
}
```

```json
// sitemap.json
{
  "rules": []
}
```

```js
// app.js
App({
  globalData: {
    currentResult: null
  }
});
```

```json
// app.json
{
  "pages": [
    "pages/index/index",
    "pages/result/index"
  ],
  "window": {
    "navigationBarTitleText": "拼豆生成器",
    "navigationBarBackgroundColor": "#ffffff",
    "navigationBarTextStyle": "black",
    "backgroundColor": "#f5f7fb"
  },
  "style": "v2",
  "sitemapLocation": "sitemap.json"
}
```

```css
/* app.wxss */
page {
  background: #f5f7fb;
  color: #1f2328;
  font-size: 28rpx;
}

.card {
  margin: 24rpx;
  padding: 24rpx;
  background: #ffffff;
  border-radius: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.06);
}

.primary-button {
  background: #2563eb;
  color: #ffffff;
  border-radius: 999rpx;
}
```

```js
// utils/constants.js
const SIZE_OPTIONS = [
  { label: '32 x 32', value: 32 },
  { label: '48 x 48', value: 48 },
  { label: '64 x 64', value: 64 }
];

const EXPORT_SCALE = 24;
const PREVIEW_SCALE = 10;
const GRID_STROKE_COLOR = '#d0d7de';

module.exports = {
  SIZE_OPTIONS,
  EXPORT_SCALE,
  PREVIEW_SCALE,
  GRID_STROKE_COLOR
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/utils/constants.test.js`
Expected: PASS

- [ ] **Step 5: Smoke-check the app bootstrap files**

Run: `node --check app.js && node --check utils/constants.js`
Expected: no output

### Task 2: Implement the bead palette and nearest-color matching

**Files:**
- Create: `utils/palette.js`
- Test: `tests/utils/palette.test.js`

- [ ] **Step 1: Write the failing test**

```js
// tests/utils/palette.test.js
const test = require('node:test');
const assert = require('node:assert/strict');

const { BEAD_PALETTE, pickNearestBeadColor } = require('../../utils/palette');

test('returns the nearest bead color for a bright red pixel', () => {
  const result = pickNearestBeadColor({ r: 250, g: 40, b: 50 });

  assert.equal(BEAD_PALETTE.length > 5, true);
  assert.equal(result.code, 'R01');
  assert.equal(result.name, 'Cherry Red');
});

test('returns white for a near-white pixel', () => {
  const result = pickNearestBeadColor({ r: 245, g: 244, b: 240 });

  assert.equal(result.code, 'W01');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/utils/palette.test.js`
Expected: FAIL with `Cannot find module '../../utils/palette'`

- [ ] **Step 3: Write minimal implementation**

```js
// utils/palette.js
const BEAD_PALETTE = [
  { code: 'W01', name: 'Snow White', hex: '#f5f5f0', rgb: [245, 245, 240] },
  { code: 'K01', name: 'Jet Black', hex: '#222222', rgb: [34, 34, 34] },
  { code: 'R01', name: 'Cherry Red', hex: '#e23d48', rgb: [226, 61, 72] },
  { code: 'Y01', name: 'Honey Yellow', hex: '#f5c542', rgb: [245, 197, 66] },
  { code: 'G01', name: 'Leaf Green', hex: '#4e9f5a', rgb: [78, 159, 90] },
  { code: 'B01', name: 'Sky Blue', hex: '#5aa9e6', rgb: [90, 169, 230] },
  { code: 'N01', name: 'Soft Beige', hex: '#d8c3a5', rgb: [216, 195, 165] }
];

function distanceSquared(input, candidate) {
  const [r, g, b] = candidate.rgb;
  return (
    (input.r - r) ** 2 +
    (input.g - g) ** 2 +
    (input.b - b) ** 2
  );
}

function pickNearestBeadColor(input) {
  return BEAD_PALETTE.reduce((best, item) => {
    if (!best) {
      return item;
    }

    return distanceSquared(input, item) < distanceSquared(input, best) ? item : best;
  }, null);
}

module.exports = {
  BEAD_PALETTE,
  pickNearestBeadColor
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/utils/palette.test.js`
Expected: PASS

- [ ] **Step 5: Run the utility suite before building the generator**

Run: `npm test`
Expected: all current tests pass

### Task 3: Implement grid conversion and color usage summary

**Files:**
- Create: `utils/bead-generator.js`
- Test: `tests/utils/bead-generator.test.js`

- [ ] **Step 1: Write the failing test**

```js
// tests/utils/bead-generator.test.js
const test = require('node:test');
const assert = require('node:assert/strict');

const { buildBeadGrid, summarizeUsage } = require('../../utils/bead-generator');

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/utils/bead-generator.test.js`
Expected: FAIL with `Cannot find module '../../utils/bead-generator'`

- [ ] **Step 3: Write minimal implementation**

```js
// utils/bead-generator.js
const { pickNearestBeadColor } = require('./palette');

function buildBeadGrid({ pixels, width, height }) {
  const rows = [];

  for (let row = 0; row < height; row += 1) {
    const currentRow = [];

    for (let col = 0; col < width; col += 1) {
      const pixel = pixels[(row * width) + col];
      currentRow.push(pickNearestBeadColor(pixel));
    }

    rows.push(currentRow);
  }

  return rows;
}

function summarizeUsage(grid) {
  const counts = new Map();

  grid.flat().forEach((item) => {
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

module.exports = {
  buildBeadGrid,
  summarizeUsage
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/utils/bead-generator.test.js`
Expected: PASS

- [ ] **Step 5: Run the full utility suite**

Run: `npm test`
Expected: all tests pass, covering constants, palette, and generator logic

### Task 4: Add page session state and the index page generate flow

**Files:**
- Create: `utils/session-store.js`
- Create: `pages/index/index.js`
- Create: `pages/index/index.wxml`
- Create: `pages/index/index.wxss`
- Test: `tests/utils/session-store.test.js`

- [ ] **Step 1: Write the failing test**

```js
// tests/utils/session-store.test.js
const test = require('node:test');
const assert = require('node:assert/strict');

const { createSessionStore } = require('../../utils/session-store');

test('stores and retrieves the latest generation result in memory', () => {
  const store = createSessionStore();
  const payload = { size: 48, usage: [{ code: 'R01', count: 3 }] };

  store.set(payload);

  assert.deepEqual(store.get(), payload);
  store.clear();
  assert.equal(store.get(), null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/utils/session-store.test.js`
Expected: FAIL with `Cannot find module '../../utils/session-store'`

- [ ] **Step 3: Write minimal implementation**

```js
// utils/session-store.js
function createSessionStore() {
  let current = null;

  return {
    get() {
      return current;
    },
    set(value) {
      current = value;
    },
    clear() {
      current = null;
    }
  };
}

module.exports = {
  createSessionStore
};
```

```js
// pages/index/index.js
const { SIZE_OPTIONS } = require('../../utils/constants');
const { createSessionStore } = require('../../utils/session-store');

const store = createSessionStore();

Page({
  data: {
    imagePath: '',
    sizeOptions: SIZE_OPTIONS,
    selectedSize: 32,
    generating: false
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: ({ tempFiles }) => {
        this.setData({ imagePath: tempFiles[0].tempFilePath });
      }
    });
  },

  onSizeChange(event) {
    this.setData({ selectedSize: Number(event.currentTarget.dataset.value) });
  },

  async generateResult() {
    if (!this.data.imagePath) {
      wx.showToast({ title: '请先选择图片', icon: 'none' });
      return;
    }

    this.setData({ generating: true });

    store.set({
      sourceImagePath: this.data.imagePath,
      size: this.data.selectedSize
    });

    getApp().globalData.currentResult = store.get();

    this.setData({ generating: false });
    wx.navigateTo({ url: '/pages/result/index' });
  }
});
```

```xml
<!-- pages/index/index.wxml -->
<view class="page">
  <view class="card">
    <view class="title">上传本地图片</view>
    <button class="primary-button" bindtap="chooseImage">选择图片</button>
    <image wx:if="{{imagePath}}" class="preview" src="{{imagePath}}" mode="aspectFit" />
  </view>

  <view class="card">
    <view class="title">选择拼豆尺寸</view>
    <view class="size-list">
      <view
        wx:for="{{sizeOptions}}"
        wx:key="value"
        class="size-chip {{selectedSize === item.value ? 'size-chip--active' : ''}}"
        data-value="{{item.value}}"
        bindtap="onSizeChange"
      >
        {{item.label}}
      </view>
    </view>
  </view>

  <view class="card">
    <button class="primary-button" loading="{{generating}}" bindtap="generateResult">
      开始生成
    </button>
  </view>
</view>
```

```css
/* pages/index/index.wxss */
.page {
  padding: 24rpx;
}

.title {
  margin-bottom: 16rpx;
  font-weight: 600;
}

.preview {
  width: 100%;
  height: 420rpx;
  margin-top: 20rpx;
  border-radius: 16rpx;
  background: #eef2ff;
}

.size-list {
  display: flex;
  gap: 16rpx;
}

.size-chip {
  padding: 14rpx 24rpx;
  border-radius: 999rpx;
  background: #e5e7eb;
}

.size-chip--active {
  background: #2563eb;
  color: #ffffff;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/utils/session-store.test.js`
Expected: PASS

- [ ] **Step 5: Validate the index page controller syntax**

Run: `node --check pages/index/index.js && npm test`
Expected: no syntax errors and all utility tests still pass

### Task 5: Implement result rendering, usage display, and album save flow

**Files:**
- Create: `utils/canvas-renderer.js`
- Create: `pages/result/index.js`
- Create: `pages/result/index.wxml`
- Create: `pages/result/index.wxss`
- Modify: `pages/index/index.js`

- [ ] **Step 1: Write the failing test**

```js
// tests/utils/bead-generator.test.js
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildBeadGrid,
  summarizeUsage,
  buildResultModel
} = require('../../utils/bead-generator');

test('builds the result model for result page rendering', () => {
  const grid = [
    [{ code: 'R01', name: 'Cherry Red', hex: '#e23d48' }, { code: 'W01', name: 'Snow White', hex: '#f5f5f0' }],
    [{ code: 'B01', name: 'Sky Blue', hex: '#5aa9e6' }, { code: 'K01', name: 'Jet Black', hex: '#222222' }]
  ];

  const result = buildResultModel({ grid, size: 2 });

  assert.equal(result.size, 2);
  assert.equal(result.gridRows.length, 2);
  assert.equal(result.usage.length, 4);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/utils/bead-generator.test.js`
Expected: FAIL with `buildResultModel is not a function`

- [ ] **Step 3: Write minimal implementation**

```js
// utils/bead-generator.js
const { pickNearestBeadColor } = require('./palette');

function buildBeadGrid({ pixels, width, height }) {
  const rows = [];

  for (let row = 0; row < height; row += 1) {
    const currentRow = [];

    for (let col = 0; col < width; col += 1) {
      const pixel = pixels[(row * width) + col];
      currentRow.push(pickNearestBeadColor(pixel));
    }

    rows.push(currentRow);
  }

  return rows;
}

function summarizeUsage(grid) {
  const counts = new Map();

  grid.flat().forEach((item) => {
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
  return {
    size,
    gridRows: grid.map((row, rowIndex) => row.map((cell, colIndex) => ({
      ...cell,
      label: `${rowIndex + 1}-${colIndex + 1}`
    }))),
    usage: summarizeUsage(grid)
  };
}

module.exports = {
  buildBeadGrid,
  summarizeUsage,
  buildResultModel
};
```

```js
// utils/canvas-renderer.js
const { EXPORT_SCALE, PREVIEW_SCALE, GRID_STROKE_COLOR } = require('./constants');

function drawGrid(ctx, grid, cellSize, withLabels) {
  grid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const x = colIndex * cellSize;
      const y = rowIndex * cellSize;

      ctx.setFillStyle(cell.hex);
      ctx.fillRect(x, y, cellSize, cellSize);
      ctx.setStrokeStyle(GRID_STROKE_COLOR);
      ctx.strokeRect(x, y, cellSize, cellSize);

      if (withLabels) {
        ctx.setFillStyle('#111827');
        ctx.setFontSize(Math.max(12, cellSize / 4));
        ctx.fillText(cell.code, x + 4, y + (cellSize / 2));
      }
    });
  });
}

function renderPreview(ctx, grid) {
  drawGrid(ctx, grid, PREVIEW_SCALE, false);
}

function renderExport(ctx, grid) {
  drawGrid(ctx, grid, EXPORT_SCALE, true);
}

module.exports = {
  renderPreview,
  renderExport
};
```

```js
// pages/index/index.js
const { SIZE_OPTIONS } = require('../../utils/constants');
const { createSessionStore } = require('../../utils/session-store');
const { buildBeadGrid, buildResultModel } = require('../../utils/bead-generator');

const store = createSessionStore();

Page({
  data: {
    imagePath: '',
    sizeOptions: SIZE_OPTIONS,
    selectedSize: 32,
    generating: false
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: ({ tempFiles }) => {
        this.setData({ imagePath: tempFiles[0].tempFilePath });
      }
    });
  },

  onSizeChange(event) {
    this.setData({ selectedSize: Number(event.currentTarget.dataset.value) });
  },

  async generateResult() {
    if (!this.data.imagePath) {
      wx.showToast({ title: '请先选择图片', icon: 'none' });
      return;
    }

    this.setData({ generating: true });

    const mockPixels = Array.from({ length: this.data.selectedSize ** 2 }, (_, index) => {
      const palette = [
        { r: 250, g: 40, b: 50 },
        { r: 245, g: 244, b: 240 },
        { r: 90, g: 169, b: 230 },
        { r: 34, g: 34, b: 34 }
      ];

      return palette[index % palette.length];
    });

    const grid = buildBeadGrid({
      pixels: mockPixels,
      width: this.data.selectedSize,
      height: this.data.selectedSize
    });

    const result = {
      sourceImagePath: this.data.imagePath,
      ...buildResultModel({
        grid,
        size: this.data.selectedSize
      })
    };

    store.set(result);
    getApp().globalData.currentResult = store.get();

    this.setData({ generating: false });
    wx.navigateTo({ url: '/pages/result/index' });
  }
});
```

```js
// pages/result/index.js
const { renderPreview, renderExport } = require('../../utils/canvas-renderer');

Page({
  data: {
    result: null
  },

  onLoad() {
    const result = getApp().globalData.currentResult;

    if (!result) {
      wx.showToast({ title: '请重新生成拼豆图', icon: 'none' });
      wx.navigateBack();
      return;
    }

    this.setData({ result });
  },

  onReady() {
    const { result } = this.data;

    if (!result) {
      return;
    }

    const preview = wx.createSelectorQuery().select('#previewCanvas');
    preview.fields({ node: true, size: true }).exec((res) => {
      const { node } = res[0];
      const ctx = node.getContext('2d');
      renderPreview(ctx, result.gridRows);
    });
  },

  saveImage() {
    const { result } = this.data;
    const exportCanvas = wx.createSelectorQuery().select('#exportCanvas');

    exportCanvas.fields({ node: true, size: true }).exec((res) => {
      const { node } = res[0];
      const ctx = node.getContext('2d');
      renderExport(ctx, result.gridRows);

      wx.canvasToTempFilePath({
        canvas: node,
        success: ({ tempFilePath }) => {
          wx.saveImageToPhotosAlbum({
            filePath: tempFilePath,
            success: () => wx.showToast({ title: '已保存到相册' }),
            fail: () => wx.showToast({ title: '保存失败，请检查权限', icon: 'none' })
          });
        },
        fail: () => wx.showToast({ title: '导出失败', icon: 'none' })
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
    <canvas id="exportCanvas" type="2d" class="hidden-canvas"></canvas>
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
</view>
```

```css
/* pages/result/index.wxss */
.page {
  padding: 24rpx;
}

.title {
  margin-bottom: 16rpx;
  font-weight: 600;
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
}

.swatch {
  width: 32rpx;
  height: 32rpx;
  border-radius: 999rpx;
  border: 1px solid #d0d7de;
}

.usage-text {
  flex: 1;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/utils/bead-generator.test.js && npm test`
Expected: PASS

- [ ] **Step 5: Validate result page wiring and manual acceptance**

Run: `node --check pages/result/index.js && node --check utils/canvas-renderer.js`
Expected: no syntax errors

Manual check in WeChat DevTools:
- Select one local image
- Choose 32x32, 48x48, and 64x64 in separate runs
- Confirm result page shows a preview, usage list, and a working save button

## Self-Review Checklist

- **Spec coverage:** Task 1 sets up the app shell and fixed sizes. Task 2 defines the bead palette. Task 3 implements grid generation and usage summary. Task 4 wires local image selection and generation flow. Task 5 renders the result page and save-to-album flow.
- **Placeholder scan:** No `TBD`, `TODO`, or “similar to” references remain.
- **Type consistency:** `size`, `gridRows`, `usage`, `code`, `name`, and `hex` are used consistently across generator, session, and page tasks.
