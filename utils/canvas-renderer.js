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
