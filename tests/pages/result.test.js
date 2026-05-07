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
  previewGridRows: [[{ code: 'F4', name: '正红', hex: '#FC283C', label: '1-1' }]],
  gridRows: [[{ code: 'F4', name: '正红', hex: '#FC283C', label: '1-1' }]],
  usage: [{ code: 'F4', name: '正红', hex: '#FC283C', count: 1 }]
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

    assert.equal(typeof page.onLoad, 'function');
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

test('result page renders preview from the compact grid and guide/export from the board grid', () => {
  const originalPage = global.Page;
  const originalWx = global.wx;
  const originalGetApp = global.getApp;
  const registrations = [];
  const previewGridRows = [[{ code: 'F4', name: '正红', hex: '#FC283C', label: '1-1' }]];
  const boardGridRows = [
    [
      { code: 'BLANK', name: 'Blank Board', hex: '#f3efe8', label: '1-1', isBlank: true },
      { code: 'BLANK', name: 'Blank Board', hex: '#f3efe8', label: '1-2', isBlank: true }
    ],
    [
      { code: 'BLANK', name: 'Blank Board', hex: '#f3efe8', label: '2-1', isBlank: true },
      { code: 'F4', name: '正红', hex: '#FC283C', label: '2-2' }
    ]
  ];
  const renderInputs = [];

  global.Page = (definition) => {
    registrations.push(definition);
  };
  global.getApp = () => ({
    globalData: {
      currentResult: {
        ...payload,
        size: 2,
        previewGridRows,
        gridRows: boardGridRows
      }
    }
  });
  global.wx = {
    createSelectorQuery() {
      return {
        select() {
          return this;
        },
        fields() {
          return this;
        },
        exec(callback) {
          callback([{
            node: {
              getContext() {
                return { marker: 'ctx' };
              }
            },
            width: 0,
            height: 0
          }]);
        }
      };
    },
    canvasToTempFilePath({ success, canvas }) {
      success({ tempFilePath: canvas.tempFilePath || 'images/export.png' });
    },
    saveImageToPhotosAlbum({ success }) {
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
        result: {
          ...payload,
          size: 2,
          previewGridRows,
          gridRows: boardGridRows
        }
      },
      setData(update) {
        Object.assign(this.data, update);
      }
    };
    const previewRenderer = (ctx, gridRows) => {
      renderInputs.push({ type: 'preview', ctx, gridRows });
    };
    const guideRenderer = (ctx, gridRows) => {
      renderInputs.push({ type: 'guide', ctx, gridRows });
    };
    const exportRenderer = (ctx, gridRows) => {
      renderInputs.push({ type: 'export', ctx, gridRows });
    };

    page.renderCanvas.call(instance, '#previewCanvas', 10, previewRenderer);
    page.renderCanvas.call(instance, '#guideCanvas', 10, guideRenderer);
    page.renderCanvas.call(instance, '#exportCanvas', 24, exportRenderer);

    assert.deepEqual(renderInputs, [
      { type: 'preview', ctx: { marker: 'ctx' }, gridRows: previewGridRows },
      { type: 'guide', ctx: { marker: 'ctx' }, gridRows: boardGridRows },
      { type: 'export', ctx: { marker: 'ctx' }, gridRows: boardGridRows }
    ]);
  } finally {
    global.Page = originalPage;
    global.wx = originalWx;
    global.getApp = originalGetApp;
    delete require.cache[require.resolve(resultPageJs)];
  }
});

test('result page keeps portrait detail in preview while guide keeps centered board blanks', () => {
  const originalPage = global.Page;
  const originalWx = global.wx;
  const originalGetApp = global.getApp;
  const registrations = [];
  const previewGridRows = [
    [
      { code: 'H2', name: '米白', hex: '#F5F1E6', label: '1-1' },
      { code: 'G4', name: '浅棕', hex: '#B08F68', label: '1-2' }
    ]
  ];
  const boardGridRows = [
    [
      { code: 'BLANK', name: 'Blank Board', hex: '#f3efe8', label: '1-1', isBlank: true },
      { code: 'BLANK', name: 'Blank Board', hex: '#f3efe8', label: '1-2', isBlank: true }
    ],
    [
      { code: 'BLANK', name: 'Blank Board', hex: '#f3efe8', label: '2-1', isBlank: true },
      { code: 'G4', name: '浅棕', hex: '#B08F68', label: '2-2' }
    ]
  ];
  const renderInputs = [];

  global.Page = (definition) => {
    registrations.push(definition);
  };
  global.getApp = () => ({
    globalData: {
      currentResult: {
        ...payload,
        size: 2,
        previewGridRows,
        gridRows: boardGridRows
      }
    }
  });
  global.wx = {
    createSelectorQuery() {
      return {
        select() {
          return this;
        },
        fields() {
          return this;
        },
        exec(callback) {
          callback([{
            node: {
              getContext() {
                return { marker: 'ctx' };
              }
            },
            width: 0,
            height: 0
          }]);
        }
      };
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
        result: {
          ...payload,
          size: 2,
          previewGridRows,
          gridRows: boardGridRows
        }
      },
      setData(update) {
        Object.assign(this.data, update);
      }
    };
    const previewRenderer = (ctx, gridRows) => {
      renderInputs.push({ type: 'preview', ctx, gridRows });
    };
    const guideRenderer = (ctx, gridRows) => {
      renderInputs.push({ type: 'guide', ctx, gridRows });
    };

    page.renderCanvas.call(instance, '#previewCanvas', 10, previewRenderer);
    page.renderCanvas.call(instance, '#guideCanvas', 10, guideRenderer);

    assert.deepEqual(renderInputs, [
      { type: 'preview', ctx: { marker: 'ctx' }, gridRows: previewGridRows },
      { type: 'guide', ctx: { marker: 'ctx' }, gridRows: boardGridRows }
    ]);
    assert.equal(renderInputs[0].gridRows[0][1].code, 'G4');
    assert.equal(renderInputs[1].gridRows[0][0].isBlank, true);
  } finally {
    global.Page = originalPage;
    global.wx = originalWx;
    global.getApp = originalGetApp;
    delete require.cache[require.resolve(resultPageJs)];
  }
});

test('result page template includes preview, guide and export canvases only', () => {
  const template = fs.readFileSync(resultPageWxml, 'utf8');
  const styles = fs.readFileSync(resultPageWxss, 'utf8');

  assert.match(template, /class="result-hero"/);
  assert.match(template, /class="display-card display-card--preview"/);
  assert.match(template, /class="display-card display-card--guide"/);
  assert.match(template, /class="usage-card"/);
  assert.match(template, /class="save-panel"/);
  assert.match(template, /id="previewCanvas"/);
  assert.doesNotMatch(template, /id="pegboardCanvas"/);
  assert.match(template, /id="guideCanvas"/);
  assert.match(template, /id="exportCanvas"/);
  assert.match(styles, /preview-canvas/);
});
