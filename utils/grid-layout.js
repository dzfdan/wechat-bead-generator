const DEFAULT_BLANK_CELL = {
  code: 'BLANK',
  name: 'Blank Board',
  hex: '#f3efe8',
  isBlank: true
};

function cloneCell(cell) {
  return { ...cell };
}

function createBlankCell() {
  return cloneCell(DEFAULT_BLANK_CELL);
}

function createBlankBoard(size) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => createBlankCell()));
}

function resizeGridNearest(grid, targetSize) {
  const height = grid.length;
  const width = grid[0].length;
  const nextHeight = Math.max(1, Math.round((height / Math.max(width, height)) * targetSize));
  const nextWidth = Math.max(1, Math.round((width / Math.max(width, height)) * targetSize));

  return Array.from({ length: nextHeight }, (_, rowIndex) => {
    const sourceRow = Math.min(height - 1, Math.floor((rowIndex * height) / nextHeight));

    return Array.from({ length: nextWidth }, (_, colIndex) => {
      const sourceCol = Math.min(width - 1, Math.floor((colIndex * width) / nextWidth));
      return cloneCell(grid[sourceRow][sourceCol]);
    });
  });
}

function embedGridInBoard({ grid, boardSize, contentRatio = 0.66 }) {
  const subjectHeight = grid.length;
  const subjectWidth = subjectHeight > 0 ? grid[0].length : 0;
  const targetContentSize = Math.min(boardSize, Math.max(2, Math.floor(boardSize * contentRatio)));
  const shouldCompactFullBoard = subjectWidth === boardSize
    && subjectHeight === boardSize
    && targetContentSize < boardSize;

  if (subjectWidth > boardSize || subjectHeight > boardSize || targetContentSize > boardSize) {
    throw new Error(`Board size ${boardSize} cannot fit subject grid ${subjectHeight}x${subjectWidth}`);
  }

  const sourceGrid = grid.map((row) => row.map(cloneCell));
  const compactGrid = shouldCompactFullBoard
    ? resizeGridNearest(sourceGrid, targetContentSize)
    : sourceGrid;

  const compactHeight = compactGrid.length;
  const compactWidth = compactHeight > 0 ? compactGrid[0].length : 0;

  const board = createBlankBoard(boardSize);
  const offsetRow = Math.ceil((boardSize - compactHeight) / 2);
  const offsetCol = Math.ceil((boardSize - compactWidth) / 2);

  compactGrid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      board[offsetRow + rowIndex][offsetCol + colIndex] = cloneCell(cell);
    });
  });

  return board;
}

module.exports = {
  createBlankCell,
  embedGridInBoard
};
