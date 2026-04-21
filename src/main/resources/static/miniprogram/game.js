const boardUtils = require('./utils/board');

const TOTAL_TIME = 12 * 60;
const TILE_LABELS = ['一筒', '二筒', '三筒', '四筒', '五筒', '六筒', '七筒', '八筒', '九筒', '东', '南', '西', '北', '中', '发', '白', '春', '夏', '秋', '冬'];
const LEVELS = [
  { level: 1, rows: 4, cols: 4, uniqueTypes: 4 },
  { level: 2, rows: 10, cols: 12, uniqueTypes: 12 }
];

const state = {
  nickname: '玩家',
  currentLevelIndex: 0,
  timeLeft: TOTAL_TIME,
  score: 0,
  board: [],
  selectedKey: '',
  hintKeys: [],
  dragState: null,
  dragAnimation: null,
  gameFinished: false,
  shufflePrompt: null,
  resultTitle: '',
  resultDesc: ''
};

let canvas;
let ctx;
let width = 0;
let height = 0;
let dpr = 1;
let timer = null;
let rafHandle = null;
let touchTarget = null;
let shuffleTimer = null;

function init() {
  canvas = wx.createCanvas();
  ctx = canvas.getContext('2d');

  const info = wx.getSystemInfoSync();
  width = info.windowWidth;
  height = info.windowHeight;
  dpr = info.pixelRatio || 1;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  if (ctx.scale) {
    ctx.scale(dpr, dpr);
  }

  bindTouchEvents();
  startGame();
  loop();
  startTimer();
}

function bindTouchEvents() {
  const handlerStart = handleTouchStart;
  const handlerMove = handleTouchMove;
  const handlerEnd = handleTouchEnd;

  if (canvas && canvas.addEventListener) {
    canvas.addEventListener('touchstart', handlerStart);
    canvas.addEventListener('touchmove', handlerMove);
    canvas.addEventListener('touchend', handlerEnd);
    canvas.addEventListener('touchcancel', handlerEnd);
    return;
  }

  if (wx.onTouchStart) {
    wx.onTouchStart(handlerStart);
    wx.onTouchMove(handlerMove);
    wx.onTouchEnd(handlerEnd);
    wx.onTouchCancel(handlerEnd);
  }
}

function startGame() {
  state.currentLevelIndex = 0;
  state.timeLeft = TOTAL_TIME;
  state.score = 0;
  state.gameFinished = false;
  state.selectedKey = '';
  state.hintKeys = [];
  state.dragState = null;
  state.dragAnimation = null;
  state.shufflePrompt = null;
  state.resultTitle = '';
  state.resultDesc = '';
  clearShuffleTimer();
  startLevel(0, true);
}

function startLevel(levelIndex, requireAdjacentPair) {
  const level = LEVELS[levelIndex];
  state.currentLevelIndex = levelIndex;
  state.board = boardUtils.createBoard(level.rows, level.cols, level.uniqueTypes, requireAdjacentPair);
  state.selectedKey = '';
  state.hintKeys = [];
  state.dragState = null;
  state.dragAnimation = null;
  state.shufflePrompt = null;
  recalcLayout();
}

function recalcLayout() {
  const level = LEVELS[state.currentLevelIndex];
  const boardAreaWidth = width - 40;
  const boardAreaHeight = height - 240;
  const tileSize = Math.floor(Math.min(boardAreaWidth / level.cols, boardAreaHeight / level.rows));
  state.tileSize = Math.max(24, tileSize);
  state.boardPadding = 8;
  state.boardWidth = state.tileSize * level.cols + 16;
  state.boardHeight = state.tileSize * level.rows + 16;
  state.boardX = Math.floor((width - state.boardWidth) / 2);
  state.boardY = 110;
  state.buttonY = state.boardY + state.boardHeight + 20;
  state.buttonWidth = 92;
  state.buttonHeight = 34;
}

function startTimer() {
  stopTimer();
  timer = setInterval(() => {
    if (state.gameFinished) {
      return;
    }
    state.timeLeft -= 1;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      finishGame(false, '时间到了');
    }
  }, 1000);
}

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function loop() {
  render();
  rafHandle = requestAnimationFrame(loop);
}

function render() {
  updateDragAnimation();
  ctx.clearRect(0, 0, width, height);
  drawBackground();
  drawHeader();
  drawBoard();
  drawActions();
  drawPrompt();
  if (state.gameFinished) {
    drawOverlay();
  }
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#0d6f6a');
  gradient.addColorStop(1, '#073b39');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.beginPath();
  ctx.arc(width * 0.2, 70, 110, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(width * 0.8, 140, 90, 0, Math.PI * 2);
  ctx.fill();
}

function drawHeader() {
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('碰碰砰', 20, 34);
  ctx.font = '16px sans-serif';
  ctx.fillStyle = 'rgba(236,255,249,0.9)';
  ctx.fillText(`玩家：${state.nickname}`, 20, 58);
  ctx.fillText(`关卡 ${state.currentLevelIndex + 1} / ${LEVELS.length}`, 20, 82);

  const timeText = formatTime(state.timeLeft);
  const scoreText = `分数 ${state.score}`;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillText(timeText, width - 92, 34);
  ctx.fillText(scoreText, width - 120, 58);
  ctx.fillText(`剩余 ${boardUtils.countTiles(state.board)}`, width - 120, 82);
}

function drawBoard() {
  const x = state.boardX;
  const y = state.boardY;
  const boardWidth = state.boardWidth;
  const boardHeight = state.boardHeight;

  roundRect(ctx, x, y, boardWidth, boardHeight, 18, '#18443e', 'rgba(255,255,255,0.16)');

  for (let row = 0; row < state.board.length; row += 1) {
    for (let col = 0; col < state.board[row].length; col += 1) {
      const tile = state.board[row][col];
      if (!tile) {
        continue;
      }
      const cellX = x + state.boardPadding + col * state.tileSize;
      const cellY = y + state.boardPadding + row * state.tileSize;
      const tileSize = state.tileSize - 6;
      const highlighted = state.hintKeys.indexOf(tile.key) !== -1;
      const selected = tile.key === state.selectedKey;
      const offset = getTileOffset(tile);
      drawTile(cellX + offset.dx, cellY + offset.dy, tileSize, tile, highlighted, selected);
    }
  }
}

function drawTile(x, y, size, tile, highlighted, selected) {
  const colors = ['#8e1520', '#2f6d3f', '#1e1e1e', '#9a6a12'];
  const fill = selected ? '#fff3d8' : '#fffaf1';
  const stroke = highlighted ? '#d2692f' : 'rgba(83,58,29,0.32)';
  roundRect(ctx, x, y, size, size, 12, fill, stroke);
  if (selected) {
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#d2692f';
    roundRect(ctx, x - 2, y - 2, size + 4, size + 4, 12, null, null, true);
    ctx.restore();
  }
  ctx.fillStyle = colors[tile.type % colors.length];
  ctx.font = `${Math.max(18, Math.floor(size * 0.38))}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(TILE_LABELS[tile.type % TILE_LABELS.length], x + size / 2, y + size / 2);
}

function drawActions() {
  const buttons = [
    { key: 'shuffle', text: '刷新', x: width / 2 - 116 },
    { key: 'eliminate', text: '消除', x: width / 2 - 46 },
    { key: 'hint', text: '提示', x: width / 2 + 24 }
  ];
  buttons.forEach((button) => {
    const y = state.buttonY;
    roundRect(ctx, button.x, y, state.buttonWidth, state.buttonHeight, 16, 'rgba(255,255,255,0.12)', 'rgba(255,255,255,0.26)');
    ctx.fillStyle = '#effff9';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(button.text, button.x + state.buttonWidth / 2, y + state.buttonHeight / 2);
  });
}

function drawOverlay() {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.fillRect(0, 0, width, height);
  roundRect(ctx, 40, height / 2 - 110, width - 80, 220, 22, 'rgba(10,37,34,0.9)', 'rgba(255,255,255,0.12)');
  ctx.fillStyle = '#ecfff9';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(state.resultTitle || '挑战结束', width / 2, height / 2 - 50);
  ctx.font = '18px sans-serif';
  ctx.fillText(state.resultDesc || '', width / 2, height / 2 - 18);
  ctx.fillText(`得分 ${state.score}`, width / 2, height / 2 + 20);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText('点击屏幕重新开始', width / 2, height / 2 + 64);
  ctx.restore();
}

function drawPrompt() {
  if (!state.shufflePrompt) {
    return;
  }
  const prompt = state.shufflePrompt;
  const boxWidth = Math.min(width - 60, 300);
  const boxHeight = 110;
  const x = (width - boxWidth) / 2;
  const y = height / 2 - 55;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.fillRect(0, 0, width, height);
  roundRect(ctx, x, y, boxWidth, boxHeight, 20, 'rgba(10,37,34,0.95)', 'rgba(255,255,255,0.14)');
  ctx.fillStyle = '#ecfff9';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(prompt.title, width / 2, y + 38);
  ctx.font = '16px sans-serif';
  ctx.fillText(prompt.desc, width / 2, y + 72);
  ctx.restore();
}

function formatTime(seconds) {
  const minute = Math.floor(seconds / 60);
  const second = seconds % 60;
  return `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
}

function roundRect(context, x, y, w, h, r, fillStyle, strokeStyle, fillOnly) {
  context.save();
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + w, y, x + w, y + h, r);
  context.arcTo(x + w, y + h, x, y + h, r);
  context.arcTo(x, y + h, x, y, r);
  context.arcTo(x, y, x + w, y, r);
  context.closePath();
  if (fillStyle) {
    context.fillStyle = fillStyle;
    context.fill();
  }
  if (strokeStyle && !fillOnly) {
    context.strokeStyle = strokeStyle;
    context.lineWidth = 1;
    context.stroke();
  }
  context.restore();
}

function getTileAtPoint(x, y) {
  const localX = x - state.boardX - state.boardPadding;
  const localY = y - state.boardY - state.boardPadding;
  if (localX < 0 || localY < 0) {
    return null;
  }
  const col = Math.floor(localX / state.tileSize);
  const row = Math.floor(localY / state.tileSize);
  if (row < 0 || col < 0 || row >= state.board.length || col >= state.board[0].length) {
    return null;
  }
  const tile = state.board[row][col];
  if (!tile) {
    return null;
  }
  return { row, col, tile };
}

function handleTouchStart(e) {
  const touch = firstTouch(e);
  if (!touch) {
    return;
  }
  if (state.shufflePrompt) {
    return;
  }
  if (state.gameFinished) {
    startGame();
    return;
  }

  const point = { x: touch.clientX, y: touch.clientY };
  touchTarget = hitActionButton(point.x, point.y);
  if (touchTarget) {
    return;
  }

  const hit = getTileAtPoint(point.x, point.y);
  if (!hit) {
    state.selectedKey = '';
    return;
  }
  state.dragState = {
    row: hit.row,
    col: hit.col,
    key: hit.tile.key,
    startX: point.x,
    startY: point.y,
    dx: 0,
    dy: 0,
    moved: false
  };
  state.dragAnimation = null;
  state.hintKeys = [];
}

function handleTouchMove(e) {
  if (!state.dragState) {
    return;
  }
  const touch = firstTouch(e);
  if (!touch) {
    return;
  }
  state.dragState.dx = touch.clientX - state.dragState.startX;
  state.dragState.dy = touch.clientY - state.dragState.startY;
  if (Math.abs(state.dragState.dx) > 8 || Math.abs(state.dragState.dy) > 8) {
    state.dragState.moved = true;
  }
  updateDragPreview();
}

function handleTouchEnd(e) {
  const touch = firstTouch(e);
  if (touchTarget) {
    const action = touchTarget;
    touchTarget = null;
    performAction(action);
    return;
  }

  if (!state.dragState) {
    return;
  }
  const drag = state.dragState;
  if (!drag.moved) {
    state.dragState = null;
    handleTap(drag.row, drag.col, drag.key);
    return;
  }
  const plan = buildDragPlan(drag);
  if (!plan || plan.previewOffset < state.tileSize * 0.35) {
    startDragReturnAnimation();
    return;
  }
  if (!plan.autoPair) {
    startDragReturnAnimation();
    return;
  }
  state.dragState = null;
  state.dragAnimation = null;
  handleDrag(drag, plan);
}

function firstTouch(e) {
  if (e && e.touches && e.touches.length > 0) {
    return e.touches[0];
  }
  if (e && e.changedTouches && e.changedTouches.length > 0) {
    return e.changedTouches[0];
  }
  return null;
}

function hitActionButton(x, y) {
  const items = [
    { key: 'shuffle', x: width / 2 - 116 },
    { key: 'eliminate', x: width / 2 - 46 },
    { key: 'hint', x: width / 2 + 24 }
  ];
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    if (x >= item.x && x <= item.x + state.buttonWidth && y >= state.buttonY && y <= state.buttonY + state.buttonHeight) {
      return item.key;
    }
  }
  return null;
}

function performAction(action) {
  if (action === 'shuffle') {
    shuffleBoardWithPrompt(false);
    return;
  }
  if (action === 'hint') {
    const hint = findHint();
    if (hint) {
      state.hintKeys = [hint.a.key, hint.b.key];
    }
    return;
  }
  if (action === 'eliminate') {
    if (state.selectedKey) {
      const selected = findTileByKey(state.selectedKey);
      if (selected) {
        const match = boardUtils.findTapPair(state.board, selected.row, selected.col) ||
          boardUtils.findLinePair(state.board, selected.row, selected.col, 'horizontal') ||
          boardUtils.findLinePair(state.board, selected.row, selected.col, 'vertical');
        if (match) {
          removePair(selected, match);
          return;
        }
      }
    }
    const hint = findHint();
    if (hint) {
      removePair(hint.a, hint.b);
    }
  }
}

function handleTap(row, col, key) {
  const tile = state.board[row][col];
  if (!tile) {
    state.selectedKey = '';
    return;
  }

  const pair = boardUtils.findTapPair(state.board, row, col);
  if (pair) {
    removePair(tile, pair);
    return;
  }

  state.selectedKey = key;
}

function handleDrag(drag, plan) {
  const previewBoard = boardUtils.cloneBoard(state.board);
  const moved = boardUtils.shiftLine(previewBoard, drag.row, drag.col, plan.axis, plan.step, plan.steps);
  state.selectedKey = '';
  if (!moved) {
    ensurePlayable();
    return;
  }
  const match = boardUtils.findLinePair(previewBoard, moved.row, moved.col, plan.axis);
  if (match && match.type === moved.type) {
    boardUtils.shiftLine(state.board, drag.row, drag.col, plan.axis, plan.step, plan.steps);
    removePair({ key: drag.key }, { key: match.key });
    return;
  }
  startDragReturnAnimation();
}

function removePair(a, b) {
  if (!a || !b) {
    return;
  }
  boardUtils.removeTiles(state.board, a.key, b.key);
  state.score += 120;
  state.selectedKey = '';
  state.hintKeys = [];
  afterBoardChange();
}

function afterBoardChange() {
  if (boardUtils.countTiles(state.board) === 0) {
    advanceLevel();
    return;
  }
  ensurePlayable();
}

function buildDragPlan(drag) {
  const absX = Math.abs(drag.dx);
  const absY = Math.abs(drag.dy);
  const axis = absX >= absY ? 'horizontal' : 'vertical';
  const primaryDelta = axis === 'horizontal' ? drag.dx : drag.dy;
  const step = primaryDelta > 0 ? 1 : -1;
  const distance = Math.min(Math.abs(primaryDelta), state.tileSize);
  const previewOffset = distance * step;
  const freeSteps = boardUtils.countFreeSteps(state.board, drag.row, drag.col, step, axis);
  const rawSteps = Math.max(1, Math.round(Math.abs(primaryDelta) / state.tileSize));
  const steps = Math.max(1, Math.min(freeSteps, rawSteps));
  const emptyIndex = boardUtils.findFirstEmptyInDirection(state.board, drag.row, drag.col, step, axis);
  const autoPair = detectDragPair(drag, axis, step, steps);
  return {
    axis,
    step,
    steps,
    previewOffset,
    emptyIndex,
    autoPair
  };
}

function updateDragPreview() {
  if (!state.dragState) {
    return;
  }
  const plan = buildDragPlan(state.dragState);
  state.dragState.axis = plan.axis;
  state.dragState.step = plan.step;
  state.dragState.steps = plan.steps;
  state.dragState.previewOffset = plan.previewOffset;
  state.dragState.emptyIndex = plan.emptyIndex;
  state.dragState.autoPair = plan.autoPair;
}

function detectDragPair(drag, axis, step, steps) {
  const previewBoard = boardUtils.cloneBoard(state.board);
  const moved = boardUtils.shiftLine(previewBoard, drag.row, drag.col, axis, step, steps);
  if (!moved) {
    return null;
  }
  const match = boardUtils.findLinePair(previewBoard, moved.row, moved.col, axis);
  if (!match || match.type !== moved.type) {
    return null;
  }
  return {
    key: moved.key,
    pairKey: match.key
  };
}

function getTileOffset(tile) {
  const drag = state.dragState;
  if (!drag || !drag.previewOffset) {
    return { dx: 0, dy: 0 };
  }

  const offset = drag.previewOffset;
  if (drag.axis === 'horizontal') {
    if (tile.row !== drag.row) {
      return { dx: 0, dy: 0 };
    }
    if (drag.emptyIndex === -1) {
      return tile.key === drag.key ? { dx: offset, dy: 0 } : { dx: 0, dy: 0 };
    }
    if (drag.step > 0 && tile.col >= drag.col && tile.col < drag.emptyIndex) {
      return { dx: offset, dy: 0 };
    }
    if (drag.step < 0 && tile.col <= drag.col && tile.col > drag.emptyIndex) {
      return { dx: offset, dy: 0 };
    }
    return { dx: 0, dy: 0 };
  }

  if (tile.col !== drag.col) {
    return { dx: 0, dy: 0 };
  }
  if (drag.emptyIndex === -1) {
    return tile.key === drag.key ? { dx: 0, dy: offset } : { dx: 0, dy: 0 };
  }
  if (drag.step > 0 && tile.row >= drag.row && tile.row < drag.emptyIndex) {
    return { dx: 0, dy: offset };
  }
  if (drag.step < 0 && tile.row <= drag.row && tile.row > drag.emptyIndex) {
    return { dx: 0, dy: offset };
  }
  return { dx: 0, dy: 0 };
}

function startDragReturnAnimation() {
  if (!state.dragState) {
    return;
  }
  state.dragAnimation = {
    from: state.dragState.previewOffset || 0,
    startAt: Date.now(),
    duration: 180
  };
}

function updateDragAnimation() {
  if (!state.dragAnimation || !state.dragState) {
    return;
  }
  const elapsed = Date.now() - state.dragAnimation.startAt;
  const t = Math.min(1, elapsed / state.dragAnimation.duration);
  const eased = 1 - Math.pow(1 - t, 3);
  const from = state.dragAnimation.from;
  state.dragState.previewOffset = from + (0 - from) * eased;
  if (t >= 1) {
    state.dragAnimation = null;
    state.dragState = null;
  }
}

function ensurePlayable() {
  if (state.gameFinished) {
    return;
  }
  if (!boardUtils.hasAnyMove(state.board)) {
    scheduleShufflePrompt();
  }
}

function scheduleShufflePrompt() {
  if (state.shufflePrompt) {
    return;
  }
  state.shufflePrompt = {
    title: '无可消除',
    desc: '正在重新打乱...'
  };
  clearShuffleTimer();
  shuffleTimer = setTimeout(() => {
    shuffleBoardWithPrompt(true);
  }, 700);
}

function clearShuffleTimer() {
  if (shuffleTimer) {
    clearTimeout(shuffleTimer);
    shuffleTimer = null;
  }
}

function shuffleBoardWithPrompt(requireAdjacentPair) {
  clearShuffleTimer();
  state.shufflePrompt = null;
  state.selectedKey = '';
  state.hintKeys = [];
  let ok = false;
  for (let i = 0; i < 200; i += 1) {
    ok = boardUtils.shuffleBoard(state.board, requireAdjacentPair);
    if (ok && boardUtils.hasAnyMove(state.board)) {
      break;
    }
  }
  if (!ok || !boardUtils.hasAnyMove(state.board)) {
    boardUtils.ensureAdjacentPair(state.board);
    if (!boardUtils.hasAnyMove(state.board)) {
      scheduleShufflePrompt();
    }
  }
}

function findHint() {
  for (let row = 0; row < state.board.length; row += 1) {
    for (let col = 0; col < state.board[row].length; col += 1) {
      const tile = state.board[row][col];
      if (!tile) {
        continue;
      }
      const tapPair = boardUtils.findTapPair(state.board, row, col);
      if (tapPair) {
        return { a: tile, b: tapPair };
      }
      const horizontal = boardUtils.findLinePair(state.board, row, col, 'horizontal');
      if (horizontal) {
        return { a: tile, b: horizontal };
      }
      const vertical = boardUtils.findLinePair(state.board, row, col, 'vertical');
      if (vertical) {
        return { a: tile, b: vertical };
      }
    }
  }
  return null;
}

function findTileByKey(key) {
  if (!key) {
    return null;
  }
  for (let row = 0; row < state.board.length; row += 1) {
    for (let col = 0; col < state.board[row].length; col += 1) {
      const tile = state.board[row][col];
      if (tile && tile.key === key) {
        return tile;
      }
    }
  }
  return null;
}

function isAdjacent(row1, col1, row2, col2) {
  return Math.abs(row1 - row2) + Math.abs(col1 - col2) === 1;
}

function advanceLevel() {
  if (state.currentLevelIndex + 1 < LEVELS.length) {
    state.score += 300;
    startLevel(state.currentLevelIndex + 1, true);
    return;
  }
  finishGame(true, '两关都完成了');
}

function finishGame(cleared, reason) {
  state.gameFinished = true;
  clearShuffleTimer();
  stopTimer();
  if (cleared) {
    state.score += Math.max(0, state.timeLeft * 2);
  }
  state.resultTitle = cleared ? '通关成功' : '挑战失败';
  state.resultDesc = reason || (cleared ? '你把两关都清完了' : '时间结束，挑战失败');
}

function resetAfterGame() {
  state.gameFinished = false;
  startGame();
  startTimer();
}

function shutdown() {
  stopTimer();
  if (rafHandle && cancelAnimationFrame) {
    cancelAnimationFrame(rafHandle);
  }
}

wx.onShow && wx.onShow(() => {});
wx.onHide && wx.onHide(() => {});
wx.onError && wx.onError((err) => {
  console.error(err);
});

init();
