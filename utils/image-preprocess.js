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

      const weight = currentX === x && currentY === y ? 4 : 1;

      total += data[((currentY * width) + currentX) * 4 + channel] * weight;
      count += weight;
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
