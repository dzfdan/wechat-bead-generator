const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const indexPageJs = path.join(__dirname, '../../pages/index/index.js');
const indexPageWxml = path.join(__dirname, '../../pages/index/index.wxml');
const imageSampler = require('../../utils/image-sampler');

function createPageInstance(page) {
  return {
    data: {
      ...page.data
    },
    setData(update) {
      Object.assign(this.data, update);
    }
  };
}

test('index page includes a hidden canvas for image sampling', () => {
  const wxml = fs.readFileSync(indexPageWxml, 'utf8');

  assert.match(wxml, /<canvas[^>]*id="sourceCanvas"/);
});

test('generateResult samples pixels from the selected image before building the bead grid', async () => {
  const originalPage = global.Page;
  const originalGetApp = global.getApp;
  const originalWx = global.wx;
  const originalSampleImagePixels = imageSampler.sampleImagePixels;
  const registrations = [];
  const sampledPixels = [
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
  const app = {
    globalData: {}
  };
  let sampleArgs = null;
  let navigatedUrl = null;

  imageSampler.sampleImagePixels = async (args) => {
    sampleArgs = args;
    return sampledPixels;
  };

  global.Page = (definition) => {
    registrations.push(definition);
  };
  global.getApp = () => app;
  global.wx = {
    navigateTo({ url }) {
      navigatedUrl = url;
    },
    showToast() {}
  };

  try {
    delete require.cache[require.resolve(indexPageJs)];
    require(indexPageJs);

    const page = registrations[0];
    const instance = createPageInstance(page);
    instance.data.imagePath = 'images/source.png';
    instance.data.selectedSize = 3;

    await page.generateResult.call(instance);

    assert.equal(sampleArgs.imagePath, 'images/source.png');
    assert.equal(sampleArgs.size, 3);
    assert.equal(app.globalData.currentResult.size, 3);
    assert.equal(app.globalData.currentResult.gridRows[0][0].isBlank, true);
    assert.equal(app.globalData.currentResult.gridRows[1][1].code, 'K01');
    assert.equal(app.globalData.currentResult.gridRows[1][1].label, '2-2');
    assert.equal(app.globalData.currentResult.gridRows[2][2].code, 'K01');
    assert.equal(app.globalData.currentResult.usage[0].code, 'K01');
    assert.equal(app.globalData.currentResult.usage[0].count, 4);
    assert.equal(navigatedUrl, '/pages/result/index');
  } finally {
    imageSampler.sampleImagePixels = originalSampleImagePixels;
    global.Page = originalPage;
    global.getApp = originalGetApp;
    global.wx = originalWx;
    delete require.cache[require.resolve(indexPageJs)];
  }
});

test('generateResult shows the parse failure message when image decoding fails', async () => {
  const originalPage = global.Page;
  const originalGetApp = global.getApp;
  const originalWx = global.wx;
  const originalSampleImagePixels = imageSampler.sampleImagePixels;
  const registrations = [];
  const toasts = [];

  imageSampler.sampleImagePixels = async () => {
    throw new Error('decode failed');
  };

  global.Page = (definition) => {
    registrations.push(definition);
  };
  global.getApp = () => ({
    globalData: {}
  });
  global.wx = {
    navigateTo() {
      throw new Error('should not navigate on parse failure');
    },
    showToast(options) {
      toasts.push(options);
    }
  };

  try {
    delete require.cache[require.resolve(indexPageJs)];
    require(indexPageJs);

    const page = registrations[0];
    const instance = createPageInstance(page);
    instance.data.imagePath = 'images/source.png';
    instance.data.selectedSize = 32;

    await page.generateResult.call(instance);

    assert.equal(toasts.at(-1).title, '图片解析失败，请重新选择');
    assert.equal(instance.data.generating, false);
  } finally {
    imageSampler.sampleImagePixels = originalSampleImagePixels;
    global.Page = originalPage;
    global.getApp = originalGetApp;
    global.wx = originalWx;
    delete require.cache[require.resolve(indexPageJs)];
  }
});

test('generateResult shows the generation failure message when bead generation fails', async () => {
  const originalPage = global.Page;
  const originalGetApp = global.getApp;
  const originalWx = global.wx;
  const originalSampleImagePixels = imageSampler.sampleImagePixels;
  const registrations = [];
  const toasts = [];

  imageSampler.sampleImagePixels = async () => Array.from({ length: 3 }, () => ({ r: 1, g: 2, b: 3 }));

  global.Page = (definition) => {
    registrations.push(definition);
  };
  global.getApp = () => ({
    globalData: {}
  });
  global.wx = {
    navigateTo() {
      throw new Error('should not navigate on generation failure');
    },
    showToast(options) {
      toasts.push(options);
    }
  };

  try {
    delete require.cache[require.resolve(indexPageJs)];
    require(indexPageJs);

    const page = registrations[0];
    const instance = createPageInstance(page);
    instance.data.imagePath = 'images/source.png';
    instance.data.selectedSize = 2;

    await page.generateResult.call(instance);

    assert.equal(toasts.at(-1).title, '拼豆图生成失败，请重试');
    assert.equal(instance.data.generating, false);
  } finally {
    imageSampler.sampleImagePixels = originalSampleImagePixels;
    global.Page = originalPage;
    global.getApp = originalGetApp;
    global.wx = originalWx;
    delete require.cache[require.resolve(indexPageJs)];
  }
});
