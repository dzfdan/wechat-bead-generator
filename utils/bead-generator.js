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
  const addLabels = (rows) => rows.map((row, rowIndex) => row.map((cell, colIndex) => ({
    ...cell,
    label: `${rowIndex + 1}-${colIndex + 1}`
  })));

  return {
    size,
    previewGridRows: addLabels(grid),
    gridRows: addLabels(boardGrid),
    usage: summarizeUsage(boardGrid)
  };
}

module.exports = {
  buildBeadGrid,
  summarizeUsage,
  buildResultModel
};
