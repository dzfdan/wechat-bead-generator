const test = require('node:test');
const assert = require('node:assert/strict');

const { imageDataToPixels, sampleImagePixels } = require('../../utils/image-sampler');
const { enhanceImageData } = require('../../utils/image-preprocess');

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

test('samples pixels from the selected image path', async () => {
  const calls = [];
  let assignedSrc;
  const imageData = {
    data: new Uint8ClampedArray([
      220, 180, 190, 255,
      200, 160, 170, 255,
      180, 140, 150, 255,
      160, 120, 130, 255
    ]),
    width: 2,
    height: 2
  };
  const expectedEnhanced = enhanceImageData({
    width: imageData.width,
    height: imageData.height,
    data: new Uint8ClampedArray(imageData.data)
  });
  const expectedReturnedPixels = imageDataToPixels(expectedEnhanced);

  expectedReturnedPixels[0] = { r: 1, g: 2, b: 3 };

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
          assert.equal(args[0], imageData);
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
  assert.deepEqual(calls.map(([name]) => name), ['clearRect', 'drawImage', 'getImageData', 'putImageData']);
  assert.equal(calls[1][1].width, 800);
  assert.equal(calls[1][1].height, 1200);
  assert.deepEqual(calls[1].slice(2), [0, 200, 800, 800, 0, 0, 2, 2]);
  assert.deepEqual(calls[3].slice(1), [calls[3][1], 0, 0]);
  assert.deepEqual(imageDataToPixels(imageData), imageDataToPixels(expectedEnhanced));
  assert.deepEqual(pixels, imageDataToPixels(expectedEnhanced));
});
