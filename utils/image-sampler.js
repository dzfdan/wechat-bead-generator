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

          const imageData = ctx.getImageData(0, 0, size, size);
          const enhanced = enhanceImageData(imageData);

          imageData.data.set(enhanced.data);
          ctx.putImageData(imageData, 0, 0);
          resolve(imageDataToPixels(imageData));
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
