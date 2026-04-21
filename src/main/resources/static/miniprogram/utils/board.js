function shuffle(list) {
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = list[i];
    list[i] = list[j];
    list[j] = temp;
  }
  return list;
}

function syncPosition(tile, row, col) {
  if (!tile) {
    return;
  }
  tile.row = row;
  tile.col = col;
}

function flatten(board) {
  const tiles = [];
  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      if (board[row][col]) {
        tiles.push(board[row][col]);
      }
    }
  }
  return tiles;
}

function findAnotherTileByType(board, type, exceptRow, exceptCol) {
  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      const tile = board[row][col];
      if (!tile || tile.type !== type) {
        continue;
      }
      if (row === exceptRow && col === exceptCol) {
        continue;
      }
      return { tile, row, col };
    }
  }
  return null;
}

function ensureAdjacentPair(board) {
  const rows = board.length;
  const cols = board[0].length;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const tile = board[row][col];
      if (!tile) {
        continue;
      }
      const neighbors = [
        [row, col + 1],
        [row + 1, col]
      ];
      for (let i = 0; i < neighbors.length; i += 1) {
        const nextRow = neighbors[i][0];
        const nextCol = neighbors[i][1];
        if (nextRow >= rows || nextCol >= cols) {
          continue;
        }
        const other = board[nextRow][nextCol];
        if (other && other.type === tile.type) {
          return true;
        }
        const swapSource = findAnotherTileByType(board, tile.type, row, col);
        if (swapSource) {
          const temp = board[nextRow][nextCol];
          board[nextRow][nextCol] = swapSource.tile;
          board[swapSource.row][swapSource.col] = temp;
          syncPosition(board[nextRow][nextCol], nextRow, nextCol);
          syncPosition(board[swapSource.row][swapSource.col], swapSource.row, swapSource.col);
          return true;
        }
      }
    }
  }
  return false;
}

function createBoard(rows, cols, uniqueTypes, forceAdjacentPair) {
  const totalPairs = (rows * cols) / 2;
  const pool = [];
  for (let i = 0; i < totalPairs; i += 1) {
    const type = i % uniqueTypes;
    pool.push(type, type);
  }
  shuffle(pool);

  const board = [];
  let cursor = 0;
  let idSeed = 1;
  for (let row = 0; row < rows; row += 1) {
    const line = [];
    for (let col = 0; col < cols; col += 1) {
      line.push({
        id: idSeed,
        key: `t-${idSeed}`,
        type: pool[cursor],
        row,
        col
      });
      idSeed += 1;
      cursor += 1;
    }
    board.push(line);
  }

  if (forceAdjacentPair) {
    ensureAdjacentPair(board);
  }

  return board;
}

function hasAdjacentPair(board) {
  const rows = board.length;
  const cols = board[0].length;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const tile = board[row][col];
      if (!tile) {
        continue;
      }
      if (col + 1 < cols && board[row][col + 1] && board[row][col + 1].type === tile.type) {
        return true;
      }
      if (row + 1 < rows && board[row + 1][col] && board[row + 1][col].type === tile.type) {
        return true;
      }
    }
  }
  return false;
}

function clearBetween(board, row1, col1, row2, col2) {
  if (row1 === row2) {
    const start = Math.min(col1, col2) + 1;
    const end = Math.max(col1, col2) - 1;
    for (let col = start; col <= end; col += 1) {
      if (board[row1][col]) {
        return false;
      }
    }
    return true;
  }
  if (col1 === col2) {
    const start = Math.min(row1, row2) + 1;
    const end = Math.max(row1, row2) - 1;
    for (let row = start; row <= end; row += 1) {
      if (board[row][col1]) {
        return false;
      }
    }
    return true;
  }
  return false;
}

function hasLinePair(board) {
  const rows = board.length;
  const cols = board[0].length;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const tile = board[row][col];
      if (!tile) {
        continue;
      }
      for (let nextCol = col + 1; nextCol < cols; nextCol += 1) {
        const other = board[row][nextCol];
        if (!other) {
          continue;
        }
        if (other.type === tile.type && clearBetween(board, row, col, row, nextCol)) {
          return true;
        }
        break;
      }
      for (let nextRow = row + 1; nextRow < rows; nextRow += 1) {
        const other = board[nextRow][col];
        if (!other) {
          continue;
        }
        if (other.type === tile.type && clearBetween(board, row, col, nextRow, col)) {
          return true;
        }
        break;
      }
    }
  }
  return false;
}

function hasAnyMove(board) {
  return hasAdjacentPair(board) || hasLinePair(board);
}

function findTapPair(board, row, col) {
  const tile = board[row][col];
  if (!tile) {
    return null;
  }
  const neighbors = [
    [row, col - 1],
    [row, col + 1],
    [row - 1, col],
    [row + 1, col]
  ];
  for (let i = 0; i < neighbors.length; i += 1) {
    const nextRow = neighbors[i][0];
    const nextCol = neighbors[i][1];
    if (nextRow < 0 || nextCol < 0 || nextRow >= board.length || nextCol >= board[0].length) {
      continue;
    }
    const other = board[nextRow][nextCol];
    if (other && other.type === tile.type) {
      return other;
    }
  }
  return null;
}

function findLinePair(board, row, col, axis) {
  const tile = board[row][col];
  if (!tile) {
    return null;
  }
  if (axis === 'horizontal') {
    for (let nextCol = col - 1; nextCol >= 0; nextCol -= 1) {
      const other = board[row][nextCol];
      if (!other) {
        continue;
      }
      if (other.type === tile.type && clearBetween(board, row, col, row, nextCol)) {
        return other;
      }
      break;
    }
    for (let nextCol = col + 1; nextCol < board[0].length; nextCol += 1) {
      const other = board[row][nextCol];
      if (!other) {
        continue;
      }
      if (other.type === tile.type && clearBetween(board, row, col, row, nextCol)) {
        return other;
      }
      break;
    }
    return null;
  }
  for (let nextRow = row - 1; nextRow >= 0; nextRow -= 1) {
    const other = board[nextRow][col];
    if (!other) {
      continue;
    }
    if (other.type === tile.type && clearBetween(board, row, col, nextRow, col)) {
      return other;
    }
    break;
  }
  for (let nextRow = row + 1; nextRow < board.length; nextRow += 1) {
    const other = board[nextRow][col];
    if (!other) {
      continue;
    }
    if (other.type === tile.type && clearBetween(board, row, col, nextRow, col)) {
      return other;
    }
    break;
  }
  return null;
}

function removeTiles(board, keyA, keyB) {
  let removed = 0;
  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      const tile = board[row][col];
      if (!tile) {
        continue;
      }
      if (tile.key === keyA || tile.key === keyB) {
        board[row][col] = null;
        removed += 1;
      }
    }
  }
  return removed;
}

function countTiles(board) {
  return flatten(board).length;
}

function findFirstEmptyInDirection(board, row, col, step, axis) {
  if (axis === 'horizontal') {
    let cursor = col + step;
    while (cursor >= 0 && cursor < board[0].length) {
      if (!board[row][cursor]) {
        return cursor;
      }
      cursor += step;
    }
    return -1;
  }
  let cursor = row + step;
  while (cursor >= 0 && cursor < board.length) {
    if (!board[cursor][col]) {
      return cursor;
    }
    cursor += step;
  }
  return -1;
}

function countFreeSteps(board, row, col, step, axis) {
  let count = 0;
  if (axis === 'horizontal') {
    let cursor = col + step;
    while (cursor >= 0 && cursor < board[0].length) {
      if (board[row][cursor]) {
        break;
      }
      count += 1;
      cursor += step;
    }
    return count;
  }
  let cursor = row + step;
  while (cursor >= 0 && cursor < board.length) {
    if (board[cursor][col]) {
      break;
    }
    count += 1;
    cursor += step;
  }
  return count;
}

function shiftOneStep(board, row, col, axis, step) {
  const empty = findFirstEmptyInDirection(board, row, col, step, axis);
  if (empty === -1) {
    return null;
  }

  if (axis === 'horizontal') {
    for (let cursor = empty; cursor !== col; cursor -= step) {
      board[row][cursor] = board[row][cursor - step];
      syncPosition(board[row][cursor], row, cursor);
    }
    board[row][col] = null;
    const moved = board[row][col + step];
    syncPosition(moved, row, col + step);
    return moved;
  }

  for (let cursor = empty; cursor !== row; cursor -= step) {
    board[cursor][col] = board[cursor - step][col];
    syncPosition(board[cursor][col], cursor, col);
  }
  board[row][col] = null;
  const moved = board[row + step][col];
  syncPosition(moved, row + step, col);
  return moved;
}

function shiftLine(board, row, col, axis, step, count) {
  let currentRow = row;
  let currentCol = col;
  let moved = null;
  const steps = Math.max(1, count || 1);

  for (let i = 0; i < steps; i += 1) {
    moved = shiftOneStep(board, currentRow, currentCol, axis, step);
    if (!moved) {
      return null;
    }
    currentRow = moved.row;
    currentCol = moved.col;
  }

  return moved;
}

function shuffleBoard(board, requireAdjacentPair) {
  const tiles = flatten(board);
  if (tiles.length === 0) {
    return true;
  }
  const types = tiles.map((tile) => tile.type);
  for (let attempt = 0; attempt < 200; attempt += 1) {
    shuffle(types);
    let cursor = 0;
    for (let row = 0; row < board.length; row += 1) {
      for (let col = 0; col < board[row].length; col += 1) {
        if (!board[row][col]) {
          continue;
        }
        board[row][col].type = types[cursor];
        cursor += 1;
      }
    }
    if (hasAnyMove(board) && (!requireAdjacentPair || hasAdjacentPair(board))) {
      return true;
    }
  }
  return false;
}

module.exports = {
  createBoard,
  countTiles,
  ensureAdjacentPair,
  findFirstEmptyInDirection,
  findLinePair,
  findTapPair,
  countFreeSteps,
  flatten,
  hasAdjacentPair,
  hasAnyMove,
  hasLinePair,
  removeTiles,
  shiftLine,
  shuffleBoard,
  syncPosition
};
