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

test('lightly smooths and rebalances channels without changing geometry or alpha', () => {
  const imageData = {
    width: 2,
    height: 2,
    data: new Uint8ClampedArray([
      240, 200, 210, 12,
      30, 30, 30, 34,
      240, 200, 210, 56,
      240, 200, 210, 78
    ])
  };
  const originalData = new Uint8ClampedArray(imageData.data);

  const result = enhanceImageData(imageData);

  assert.equal(result.width, 2);
  assert.equal(result.height, 2);
  assert.equal(result.data.length, imageData.data.length);
  assert.notEqual(result.data, imageData.data);
  assert.deepEqual(
    [result.data[3], result.data[7], result.data[11], result.data[15]],
    [12, 34, 56, 78]
  );
  assert.deepEqual(Array.from(imageData.data), Array.from(originalData));
  assert.equal(result.data[0] < 240, true);
  assert.equal(result.data[4] > 30, true);
  assert.equal(result.data[5] > 30, true);
  assert.equal(result.data[6] > 30, true);
});
