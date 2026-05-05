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
  const componentKeys = new Set(component.map(([row, col]) => `${row}:${col}`));
  const borderCounts = new Map();

  component.forEach(([row, col]) => {
    getNeighborPositions(grid, row, col).forEach(([neighborRow, neighborCol]) => {
      const key = `${neighborRow}:${neighborCol}`;

      if (componentKeys.has(key)) {
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
  let hasTie = false;
  borderCounts.forEach((entry) => {
    if (!best || entry.count > best.count) {
      best = entry;
      hasTie = false;
      return;
    }

    if (entry.count === best.count) {
      hasTie = true;
    }
  });

  if (hasTie) {
    return null;
  }

  return best;
}

function getComponentCenterDistance(grid, component) {
  const rowCenter = (grid.length - 1) / 2;
  const colCenter = (grid[0].length - 1) / 2;
  const totals = component.reduce((result, [row, col]) => ({
    row: result.row + row,
    col: result.col + col
  }), { row: 0, col: 0 });
  const row = totals.row / component.length;
  const col = totals.col / component.length;

  return Math.abs(row - rowCenter) + Math.abs(col - colCenter);
}

function parseHexChannel(value) {
  return Number.parseInt(value, 16);
}

function getHexRgb(hex) {
  if (typeof hex !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return null;
  }

  return {
    red: parseHexChannel(hex.slice(1, 3)),
    green: parseHexChannel(hex.slice(3, 5)),
    blue: parseHexChannel(hex.slice(5, 7))
  };
}

function getHexLuminance(hex) {
  const rgb = getHexRgb(hex);

  if (!rgb) {
    return null;
  }

  return (rgb.red * 0.299) + (rgb.green * 0.587) + (rgb.blue * 0.114);
}

function isBackgroundLikeCell(cell) {
  if (!cell) {
    return false;
  }

  if (/^(W\d+|N\d+|GY\d+)$/i.test(cell.code)) {
    return true;
  }

  if (typeof cell.name === 'string' && /(white|beige|gray|grey)/i.test(cell.name)) {
    return true;
  }

  const rgb = getHexRgb(cell.hex);
  const luminance = getHexLuminance(cell.hex);

  if (!rgb || luminance === null) {
    return false;
  }

  const channelSpread = Math.max(rgb.red, rgb.green, rgb.blue) - Math.min(rgb.red, rgb.green, rgb.blue);

  return luminance >= 170 && channelSpread <= 24;
}

function isCompactCenteredPair(component) {
  if (component.length !== 2) {
    return false;
  }

  const [[firstRow, firstCol], [secondRow, secondCol]] = component;

  return Math.abs(firstRow - secondRow) <= 1
    && Math.abs(firstCol - secondCol) <= 1
    && !(firstRow === secondRow && firstCol === secondCol);
}

function borderTouchesBackground(grid, component, dominantBorder) {
  const componentKeys = new Set(component.map(([row, col]) => `${row}:${col}`));

  return component.some(([row, col]) => getNeighborPositions(grid, row, col).some(([neighborRow, neighborCol]) => {
    const neighborKey = `${neighborRow}:${neighborCol}`;

    if (componentKeys.has(neighborKey)) {
      return false;
    }

    if (grid[neighborRow][neighborCol].code !== dominantBorder.cell.code) {
      return false;
    }

    return getNeighborPositions(grid, neighborRow, neighborCol).some(([borderRow, borderCol]) => {
      const borderKey = `${borderRow}:${borderCol}`;

      if (componentKeys.has(borderKey)) {
        return false;
      }

      return isBackgroundLikeCell(grid[borderRow][borderCol]);
    });
  }));
}

function hasAnchoringSubjectDetail(grid, component, dominantBorder) {
  const componentKeys = new Set(component.map(([row, col]) => `${row}:${col}`));

  return component.some(([row, col]) => getNeighborPositions(grid, row, col).some(([neighborRow, neighborCol]) => {
    const neighborKey = `${neighborRow}:${neighborCol}`;

    if (componentKeys.has(neighborKey)) {
      return false;
    }

    const neighbor = grid[neighborRow][neighborCol];

    return !isBackgroundLikeCell(neighbor) && neighbor.code !== dominantBorder.cell.code;
  }));
}

function getComponentPreservationContext(grid, component, dominantBorder) {
  const [row, col] = component[0];
  const current = grid[row][col];
  const currentLuminance = getHexLuminance(current.hex);
  const borderLuminance = dominantBorder ? getHexLuminance(dominantBorder.cell.hex) : null;

  return {
    current,
    isNearCenter: getComponentCenterDistance(grid, component) <= Math.max(1, Math.floor(Math.min(grid.length, grid[0].length) / 4)),
    isBackgroundBorder: dominantBorder ? isBackgroundLikeCell(dominantBorder.cell) : false,
    contrast: currentLuminance !== null && borderLuminance !== null
      ? Math.abs(currentLuminance - borderLuminance)
      : null
  };
}

function shouldPreserveCompactSubjectCluster(grid, component, dominantBorder) {
  if (!dominantBorder || !isCompactCenteredPair(component)) {
    return false;
  }

  const { current, isNearCenter, isBackgroundBorder, contrast } = getComponentPreservationContext(grid, component, dominantBorder);
  const hasSkinLikeCode = /^S\d+$/i.test(current.code);

  return isNearCenter
    && !isBackgroundBorder
    && hasSkinLikeCode
    && contrast !== null
    && contrast >= 45
    && hasAnchoringSubjectDetail(grid, component, dominantBorder);
}

function shouldPreserveComponent(grid, component, dominantBorder) {
  if (!dominantBorder || component.length !== 1) {
    return false;
  }

  const { isNearCenter, isBackgroundBorder, contrast } = getComponentPreservationContext(grid, component, dominantBorder);
  const borderHasBackgroundContext = borderTouchesBackground(grid, component, dominantBorder);

  return isNearCenter && contrast !== null && contrast >= 45 && !isBackgroundBorder && borderHasBackgroundContext;
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

      if (shouldPreserveComponent(grid, component, dominantBorder)) {
        continue;
      }

      if (shouldPreserveCompactSubjectCluster(grid, component, dominantBorder)) {
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
