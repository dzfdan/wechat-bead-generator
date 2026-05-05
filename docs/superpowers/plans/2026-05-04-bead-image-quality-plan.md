# 拼豆图生成效果优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve portrait bead output quality by expanding the palette, adding crop-aware image preprocessing, and cleaning noisy grid artifacts while keeping the current page flow and export behavior unchanged.

**Architecture:** Keep the Mini Program page layer thin and move all quality improvements into utility modules. Introduce a dedicated preprocessing module for crop and channel adjustments, a grid cleanup module for small noisy regions, and integrate both into the existing sampling and bead generation pipeline with Node tests covering each stage.

**Tech Stack:** WeChat Mini Program (JavaScript/WXML/WXSS), Canvas 2D, Node.js built-in test runner (`node:test`)

---

## Repository Notes

- Current workspace is not a git repository, so this plan intentionally omits commit steps.
- Existing page-level behavior should remain compatible: `pages/index/index.js` still calls `sampleImagePixels()` and `buildBeadGrid()`, and `pages/result/index.js` still renders the resulting `gridRows`.

## Planned File Structure

- Modify: `utils/palette.js` — expand the bead palette and replace the raw RGB distance with a luminance-aware weighted distance.
- Modify: `tests/utils/palette.test.js` — verify the expanded portrait palette and improved color matching.
- Create: `utils/image-preprocess.js` — pure helpers for cover-crop math and light pixel enhancement.
- Create: `tests/utils/image-preprocess.test.js` — unit tests for cover crop and pixel enhancement behavior.
- Modify: `utils/image-sampler.js` — use cover-crop drawing and enhancement before converting image data to pixels.
- Modify: `tests/utils/image-sampler.test.js` — verify crop-aware drawing and enhanced sampling still returns the expected pixel structure.
- Create: `utils/grid-cleanup.js` — remove isolated noise cells and tiny islands while preserving stable features.
- Create: `tests/utils/grid-cleanup.test.js` — unit tests for isolated-cell cleanup and preservation of multi-cell features.
- Modify: `utils/bead-generator.js` — run cleanup after initial color mapping and before building the result model.
- Modify: `tests/utils/bead-generator.test.js` — verify integrated cleanup behavior and unchanged result model shape.

### Task 1: Expand the portrait palette and improve nearest-color matching

**Files:**
- Modify: `utils/palette.js`
- Modify: `tests/utils/palette.test.js`

- [ ] **Step 1: Write the failing test**

```js
// tests/utils/palette.test.js
const test = require('node:test');
const assert = require('node:assert/strict');

const { BEAD_PALETTE, pickNearestBeadColor } = require('../../utils/palette');

test('includes an expanded portrait-friendly bead palette', () => {
  const codes = BEAD_PALETTE.map((item) => item.code);

  assert.equal(BEAD_PALETTE.length >= 24, true);
  assert.deepEqual(
    codes.slice(0, 6),
    ['W01', 'W02', 'W03', 'K01', 'K02', 'N01']
  );
  assert.equal(codes.includes('S01'), true);
  assert.equal(codes.includes('P04'), true);
  assert.equal(codes.includes('H03'), true);
});

test('returns the nearest bead color for a bright red pixel', () => {
  const result = pickNearestBeadColor({ r: 250, g: 40, b: 50 });

  assert.equal(result.code, 'R01');
  assert.equal(result.name, 'Cherry Red');
});

test('returns the best portrait skin tone for a warm fair pixel', () => {
  const result = pickNearestBeadColor({ r: 244, g: 214, b: 198 });

  assert.equal(result.code, 'S02');
});

test('returns a soft pink instead of flattening into white', () => {
  const result = pickNearestBeadColor({ r: 244, g: 198, b: 215 });

  assert.equal(result.code, 'P02');
});

test('returns a deep outline color for dark brown shadow pixels', () => {
  const result = pickNearestBeadColor({ r: 78, g: 58, b: 52 });

  assert.equal(result.code, 'H03');
});

test('returns white for a near-white pixel', () => {
  const result = pickNearestBeadColor({ r: 245, g: 244, b: 240 });

  assert.equal(result.code, 'W01');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/utils/palette.test.js`
Expected: FAIL because `BEAD_PALETTE.length >= 24` is false and the new portrait color assertions do not match the current 7-color palette.

- [ ] **Step 3: Write minimal implementation**

```js
// utils/palette.js
const BEAD_PALETTE = [
  { code: 'W01', name: 'Snow White', hex: '#f5f5f0', rgb: [245, 245, 240] },
  { code: 'W02', name: 'Warm White', hex: '#efe6da', rgb: [239, 230, 218] },
  { code: 'W03', name: 'Cool White', hex: '#e4e8ef', rgb: [228, 232, 239] },
  { code: 'K01', name: 'Jet Black', hex: '#222222', rgb: [34, 34, 34] },
  { code: 'K02', name: 'Soft Black', hex: '#3b3537', rgb: [59, 53, 55] },
  { code: 'N01', name: 'Soft Beige', hex: '#d8c3a5', rgb: [216, 195, 165] },
  { code: 'N02', name: 'Warm Beige', hex: '#cda987', rgb: [205, 169, 135] },
  { code: 'S01', name: 'Light Skin', hex: '#f5d9c8', rgb: [245, 217, 200] },
  { code: 'S02', name: 'Warm Skin', hex: '#efc7b6', rgb: [239, 199, 182] },
  { code: 'S03', name: 'Rosy Skin', hex: '#e7b5a7', rgb: [231, 181, 167] },
  { code: 'S04', name: 'Shadow Skin', hex: '#c99582', rgb: [201, 149, 130] },
  { code: 'P01', name: 'Powder Pink', hex: '#f6dbe7', rgb: [246, 219, 231] },
  { code: 'P02', name: 'Soft Pink', hex: '#efbfd6', rgb: [239, 191, 214] },
  { code: 'P03', name: 'Rose Pink', hex: '#e89bb7', rgb: [232, 155, 183] },
  { code: 'P04', name: 'Peach Pink', hex: '#efb0a2', rgb: [239, 176, 162] },
  { code: 'R01', name: 'Cherry Red', hex: '#e23d48', rgb: [226, 61, 72] },
  { code: 'R02', name: 'Coral Red', hex: '#ef6f68', rgb: [239, 111, 104] },
  { code: 'Y01', name: 'Honey Yellow', hex: '#f5c542', rgb: [245, 197, 66] },
  { code: 'H01', name: 'Light Blonde', hex: '#ead7b2', rgb: [234, 215, 178] },
  { code: 'H02', name: 'Golden Blonde', hex: '#d7b07a', rgb: [215, 176, 122] },
  { code: 'H03', name: 'Deep Brown', hex: '#6a5249', rgb: [106, 82, 73] },
  { code: 'G01', name: 'Leaf Green', hex: '#4e9f5a', rgb: [78, 159, 90] },
  { code: 'B01', name: 'Sky Blue', hex: '#5aa9e6', rgb: [90, 169, 230] },
  { code: 'GY1', name: 'Light Gray', hex: '#d8d8dc', rgb: [216, 216, 220] },
  { code: 'GY2', name: 'Mid Gray', hex: '#a8a8b3', rgb: [168, 168, 179] },
  { code: 'GY3', name: 'Deep Gray', hex: '#787985', rgb: [120, 121, 133] }
];

function getLuma(input) {
  return (input.r * 0.299) + (input.g * 0.587) + (input.b * 0.114);
}

function weightedDistanceSquared(input, candidate) {
  const [r, g, b] = candidate.rgb;
  const dr = input.r - r;
  const dg = input.g - g;
  const db = input.b - b;
  const dl = getLuma(input) - getLuma({ r, g, b });

  return (
    (dr * dr * 3) +
    (dg * dg * 4) +
    (db * db * 2) +
    (dl * dl * 2)
  );
}

function pickNearestBeadColor(input) {
  return BEAD_PALETTE.reduce((best, item) => {
    if (!best) {
      return item;
    }

    return weightedDistanceSquared(input, item) < weightedDistanceSquared(input, best) ? item : best;
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

- [ ] **Step 5: Smoke-check palette usage in the full suite**

Run: `npm test`
Expected: PASS with the existing utility and page tests still green.

### Task 2: Add crop-aware preprocessing before pixel sampling

**Files:**
- Create: `utils/image-preprocess.js`
- Create: `tests/utils/image-preprocess.test.js`
- Modify: `utils/image-sampler.js`
- Modify: `tests/utils/image-sampler.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// tests/utils/image-preprocess.test.js
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  computeCoverCrop,
  enhanceImageData
} = require('../../utils/image-preprocess');

test('computes a centered cover crop for portrait source images', () => {
  assert.deepEqual(
    computeCoverCrop({
      sourceWidth: 800,
      sourceHeight: 1200,
      targetWidth: 32,
      targetHeight: 32
    }),
    {
      sx: 0,
      sy: 200,
      sWidth: 800,
      sHeight: 800,
      dx: 0,
      dy: 0,
      dWidth: 32,
      dHeight: 32
    }
  );
});

test('lightly smooths and rebalances channels without changing geometry', () => {
  const imageData = {
    width: 2,
    height: 2,
    data: new Uint8ClampedArray([
      240, 200, 210, 255,
      30, 30, 30, 255,
      240, 200, 210, 255,
      240, 200, 210, 255
    ])
  };

  const result = enhanceImageData(imageData);

  assert.equal(result.width, 2);
  assert.equal(result.height, 2);
  assert.equal(result.data.length, imageData.data.length);
  assert.equal(result.data[4] > 30, true);
  assert.equal(result.data[5] > 30, true);
  assert.equal(result.data[6] > 30, true);
});
```

```js
// tests/utils/image-sampler.test.js
const test = require('node:test');
const assert = require('node:assert/strict');

const { imageDataToPixels, sampleImagePixels } = require('../../utils/image-sampler');

test('converts canvas image data into rgb pixels', () => {
  const pixels = imageDataToPixels({
    data: new Uint8ClampedArray([
      250, 40, 50, 255,
      245, 244, 240, 128
    ]),
    width: 2,
    height: 1
  });

  assert.deepEqual(pixels, [
    { r: 250, g: 40, b: 50 },
    { r: 245, g: 244, b: 240 }
  ]);
});

test('rejects invalid canvas image data buffers', () => {
  assert.throws(
    () => imageDataToPixels({
      data: new Uint8ClampedArray([250, 40, 50]),
      width: 1,
      height: 1
    }),
    /Invalid image data buffer size/
  );
});

test('samples pixels from the selected image path using cover-crop drawing', async () => {
  const calls = [];
  let assignedSrc;
  const imageData = {
    data: new Uint8ClampedArray([
      10, 20, 30, 255,
      40, 50, 60, 255,
      70, 80, 90, 255,
      100, 110, 120, 255
    ]),
    width: 2,
    height: 2
  };

  const canvas = {
    width: 0,
    height: 0,
    createImage() {
      const image = {
        width: 800,
        height: 1200,
        onload: null,
        onerror: null
      };

      Object.defineProperty(image, 'src', {
        set(value) {
          assignedSrc = value;
          image.onload();
        }
      });

      return image;
    },
    getContext() {
      return {
        clearRect(...args) {
          calls.push(['clearRect', ...args]);
        },
        drawImage(...args) {
          calls.push(['drawImage', ...args]);
        },
        getImageData(...args) {
          calls.push(['getImageData', ...args]);
          return imageData;
        },
        putImageData(...args) {
          calls.push(['putImageData', ...args]);
        }
      };
    }
  };

  const pixels = await sampleImagePixels({
    page: {
      createSelectorQuery() {
        return {
          select() {
            return {
              fields() {
                return {
                  exec(callback) {
                    callback([{ node: canvas }]);
                  }
                };
              }
            };
          }
        };
      }
    },
    imagePath: '/assets/source.png',
    size: 2
  });

  assert.equal(assignedSrc, '/assets/source.png');
  assert.deepEqual(calls[1], ['drawImage', { width: 800, height: 1200, onload: calls[1]?.[1]?.onload, onerror: calls[1]?.[1]?.onerror }, 0, 200, 800, 800, 0, 0, 2, 2]);
  assert.deepEqual(calls.map(([name]) => name), ['clearRect', 'drawImage', 'getImageData', 'putImageData']);
  assert.deepEqual(pixels, [
    { r: 10, g: 20, b: 30 },
    { r: 40, g: 50, b: 60 },
    { r: 70, g: 80, b: 90 },
    { r: 100, g: 110, b: 120 }
  ]);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/utils/image-preprocess.test.js tests/utils/image-sampler.test.js`
Expected: FAIL with `Cannot find module '../../utils/image-preprocess'` and the sampler test failing because the current implementation uses the simple 5-argument `drawImage()` call and never calls `putImageData()`.

- [ ] **Step 3: Write minimal implementation**

```js
// utils/image-preprocess.js
function clamp(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function computeCoverCrop({ sourceWidth, sourceHeight, targetWidth, targetHeight }) {
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = targetWidth / targetHeight;

  if (sourceRatio > targetRatio) {
    const sWidth = Math.round(sourceHeight * targetRatio);
    const sx = Math.round((sourceWidth - sWidth) / 2);

    return {
      sx,
      sy: 0,
      sWidth,
      sHeight: sourceHeight,
      dx: 0,
      dy: 0,
      dWidth: targetWidth,
      dHeight: targetHeight
    };
  }

  const sHeight = Math.round(sourceWidth / targetRatio);
  const sy = Math.round((sourceHeight - sHeight) / 2);

  return {
    sx: 0,
    sy,
    sWidth: sourceWidth,
    sHeight,
    dx: 0,
    dy: 0,
    dWidth: targetWidth,
    dHeight: targetHeight
  };
}

function averageNeighborChannel(data, width, height, x, y, channel) {
  let total = 0;
  let count = 0;

  for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      const currentX = x + offsetX;
      const currentY = y + offsetY;

      if (currentX < 0 || currentX >= width || currentY < 0 || currentY >= height) {
        continue;
      }

      total += data[((currentY * width) + currentX) * 4 + channel];
      count += 1;
    }
  }

  return total / count;
}

function enhanceImageData(imageData) {
  const { width, height, data } = imageData;
  const next = new Uint8ClampedArray(data.length);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = ((y * width) + x) * 4;

      for (let channel = 0; channel < 3; channel += 1) {
        const smoothed = averageNeighborChannel(data, width, height, x, y, channel);
        const contrasted = ((smoothed - 128) * 1.08) + 132;
        next[index + channel] = clamp(contrasted);
      }

      next[index + 3] = data[index + 3];
    }
  }

  return {
    width,
    height,
    data: next
  };
}

module.exports = {
  computeCoverCrop,
  enhanceImageData
};
```

```js
// utils/image-sampler.js
const { computeCoverCrop, enhanceImageData } = require('./image-preprocess');

function imageDataToPixels(imageData) {
  const width = imageData && imageData.width;
  const height = imageData && imageData.height;
  const data = imageData && imageData.data;
  const expectedLength = width * height * 4;

  if (!data || data.length !== expectedLength) {
    throw new Error(`Invalid image data buffer size: expected ${expectedLength} entries but received ${data ? data.length : 0}`);
  }

  const pixels = [];

  for (let index = 0; index < expectedLength; index += 4) {
    pixels.push({
      r: data[index],
      g: data[index + 1],
      b: data[index + 2]
    });
  }

  return pixels;
}

function getSelectorQuery(page) {
  if (page && typeof page.createSelectorQuery === 'function') {
    return page.createSelectorQuery();
  }

  const query = wx.createSelectorQuery();
  return query && typeof query.in === 'function' && page ? query.in(page) : query;
}

function getCanvasNode({ page, selector }) {
  return new Promise((resolve, reject) => {
    const query = getSelectorQuery(page);

    query
      .select(selector)
      .fields({ node: true, size: true })
      .exec((res) => {
        const target = res && res[0];

        if (!target || !target.node) {
          reject(new Error('Canvas node not found'));
          return;
        }

        resolve(target.node);
      });
  });
}

function sampleImagePixels({ page, imagePath, size, selector = '#sourceCanvas' }) {
  return getCanvasNode({ page, selector }).then((canvas) => new Promise((resolve, reject) => {
    try {
      const ctx = canvas.getContext('2d');
      const image = canvas.createImage();

      image.onload = () => {
        try {
          const crop = computeCoverCrop({
            sourceWidth: image.width,
            sourceHeight: image.height,
            targetWidth: size,
            targetHeight: size
          });

          canvas.width = size;
          canvas.height = size;
          ctx.clearRect(0, 0, size, size);
          ctx.drawImage(
            image,
            crop.sx,
            crop.sy,
            crop.sWidth,
            crop.sHeight,
            crop.dx,
            crop.dy,
            crop.dWidth,
            crop.dHeight
          );

          const enhanced = enhanceImageData(ctx.getImageData(0, 0, size, size));
          ctx.putImageData(enhanced, 0, 0);
          resolve(imageDataToPixels(enhanced));
        } catch (error) {
          reject(error);
        }
      };

      image.onerror = () => {
        reject(new Error('Image decode failed'));
      };

      image.src = imagePath;
    } catch (error) {
      reject(error);
    }
  }));
}

module.exports = {
  imageDataToPixels,
  sampleImagePixels
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/utils/image-preprocess.test.js tests/utils/image-sampler.test.js`
Expected: PASS

- [ ] **Step 5: Validate the full utility suite after preprocessing changes**

Run: `npm test`
Expected: PASS with no page regression.

### Task 3: Clean isolated noise cells and tiny islands in the generated grid

**Files:**
- Create: `utils/grid-cleanup.js`
- Create: `tests/utils/grid-cleanup.test.js`

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/utils/grid-cleanup.test.js`
Expected: FAIL with `Cannot find module '../../utils/grid-cleanup'`.

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
  const borderCounts = new Map();

  component.forEach(([row, col]) => {
    getNeighborPositions(grid, row, col).forEach(([neighborRow, neighborCol]) => {
      const isInside = component.some(([componentRow, componentCol]) => componentRow === neighborRow && componentCol === neighborCol);

      if (isInside) {
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
  borderCounts.forEach((entry) => {
    if (!best || entry.count > best.count) {
      best = entry;
    }
  });

  return best;
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

- [ ] **Step 5: Check cleanup behavior stays deterministic**

Run: `node --test tests/utils/grid-cleanup.test.js tests/utils/palette.test.js`
Expected: PASS with no flaky output across repeated runs.

### Task 4: Integrate cleanup into bead generation and re-verify the app pipeline

**Files:**
- Modify: `utils/bead-generator.js`
- Modify: `tests/utils/bead-generator.test.js`
- Verify: `tests/pages/index.test.js`
- Verify: `tests/pages/result.test.js`

- [ ] **Step 1: Write the failing integration test**

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

test('merges isolated mapped colors before returning the grid', () => {
  const pixels = [
    { r: 245, g: 244, b: 240 }, { r: 245, g: 244, b: 240 }, { r: 245, g: 244, b: 240 },
    { r: 245, g: 244, b: 240 }, { r: 226, g: 61, b: 72 }, { r: 245, g: 244, b: 240 },
    { r: 245, g: 244, b: 240 }, { r: 245, g: 244, b: 240 }, { r: 245, g: 244, b: 240 }
  ];

  const grid = buildBeadGrid({
    pixels,
    width: 3,
    height: 3
  });

  assert.equal(grid[1][1].code, 'W01');
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
  assert.equal(result.gridRows.length, 2);
  assert.equal(result.usage.length, 4);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/utils/bead-generator.test.js`
Expected: FAIL because the current generator returns the raw mapped red center cell instead of a cleaned white center cell.

- [ ] **Step 3: Write minimal implementation**

```js
// utils/bead-generator.js
const { pickNearestBeadColor } = require('./palette');
const { cleanupGrid } = require('./grid-cleanup');

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

- [ ] **Step 4: Run tests to verify the integration passes**

Run: `node --test tests/utils/bead-generator.test.js tests/pages/index.test.js tests/pages/result.test.js`
Expected: PASS

- [ ] **Step 5: Run the full suite and do a manual visual check**

Run: `npm test`
Expected: PASS across all utility and page tests.

Manual check in WeChat DevTools:

- Select `微信图片_20260504132820_32_100.jpg`
- Generate a `32 x 32` result and compare against the current baseline
- Confirm the face outline, hair shading, and bow separation are visibly stronger than before
- Confirm the background contains fewer isolated noise colors and a cleaner block structure

## Self-Review Checklist

- **Spec coverage:** Task 1 covers expanded portrait colors and improved matching. Task 2 covers crop-aware preprocessing and light enhancement. Task 3 covers isolated-cell and tiny-island cleanup. Task 4 integrates cleanup into generation and verifies no page regressions.
- **Placeholder scan:** No `TBD`, `TODO`, or “similar to” references remain.
- **Type consistency:** The plan consistently uses `sampleImagePixels`, `buildBeadGrid`, `buildResultModel`, `cleanupGrid`, `computeCoverCrop`, and `enhanceImageData` across implementation and tests.
