const api = require('../../utils/api');
const boardUtils = require('../../utils/board');

const TOTAL_TIME = 12 * 60;
const TILE_LABELS = ['一筒', '二筒', '三筒', '四筒', '五筒', '六筒', '七筒', '八筒', '九筒', '东', '南', '西', '北', '中', '发', '白', '春', '夏', '秋', '冬'];
const LEVELS = [
  { level: 1, rows: 4, cols: 4, uniqueTypes: 4 },
  { level: 2, rows: 10, cols: 12, uniqueTypes: 12 }
];

Page({
  data: {
    nickname: '',
    levelLabel: '1 / 2',
    timeText: '12:00',
    score: 0,
    remainingTiles: 16,
    boardWidth: 0,
    boardHeight: 0,
    tiles: [],
    resultVisible: false,
    resultTitle: '',
    resultDesc: ''
  },

  onLoad(options) {
    const nickname = decodeURIComponent(options.nickname || wx.getStorageSync('ppp_nickname') || '玩家');
    this.nickname = nickname;
    this.currentLevelIndex = 0;
    this.timeLeft = TOTAL_TIME;
    this.score = 0;
    this.removedPairs = 0;
    this.timer = null;
    this.dragState = null;
    this.board = [];
    this.selectedKey = '';
    this.hintKeys = [];
    this.gameFinished = false;
    this.setData({ nickname });
    this.initGame();
  },

  onUnload() {
    this.stopTimer();
  },

  initGame() {
    this.stopTimer();
    this.timeLeft = TOTAL_TIME;
    this.score = 0;
    this.removedPairs = 0;
    this.currentLevelIndex = 0;
    this.gameFinished = false;
    this.hideResult();
    this.startLevel(0, true);
    this.startTimer();
  },

  startTimer() {
    this.stopTimer();
    this.timer = setInterval(() => {
      if (this.gameFinished) {
        return;
      }
      this.timeLeft -= 1;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.updateTimeText();
        this.finishGame(false, '时间到了');
        return;
      }
      this.updateTimeText();
    }, 1000);
  },

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  startLevel(levelIndex, requireAdjacentPair) {
    const level = LEVELS[levelIndex];
    this.currentLevel = level;
    this.currentLevelIndex = levelIndex;
    this.board = boardUtils.createBoard(level.rows, level.cols, level.uniqueTypes, requireAdjacentPair);
    this.selectedKey = '';
    this.hintKeys = [];
    this.recalculateLayout();
    this.renderBoard();
    this.updateStatus();
  },

  recalculateLayout() {
    const info = wx.getSystemInfoSync();
    const screenWidth = info.windowWidth;
    const screenHeight = info.windowHeight;
    const level = this.currentLevel;
    const usableWidth = screenWidth - 40;
    const usableHeight = screenHeight - 320;
    const tileSize = Math.floor(Math.min(usableWidth / level.cols, usableHeight / level.rows));
    this.tileSize = tileSize;
    this.boardPadding = 8;
    this.setData({
      boardWidth: tileSize * level.cols + 16,
      boardHeight: tileSize * level.rows + 16
    });
  },

  updateTimeText() {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    this.setData({
      timeText: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    });
  },

  updateStatus() {
    this.updateTimeText();
    this.setData({
      levelLabel: `${this.currentLevelIndex + 1} / ${LEVELS.length}`,
      score: this.score,
      remainingTiles: boardUtils.countTiles(this.board)
    });
  },

  renderBoard() {
    const tiles = [];
    for (let row = 0; row < this.board.length; row += 1) {
      for (let col = 0; col < this.board[row].length; col += 1) {
        const tile = this.board[row][col];
        if (!tile) {
          continue;
        }
        const left = this.boardPadding + col * this.tileSize;
        const top = this.boardPadding + row * this.tileSize;
        tiles.push({
          id: tile.id,
          key: tile.key,
          row,
          col,
          type: tile.type,
          label: TILE_LABELS[tile.type % TILE_LABELS.length],
          selected: tile.key === this.selectedKey,
          hinted: this.hintKeys.indexOf(tile.key) !== -1,
          typeClass: this.getTypeClass(tile.type),
          style: `left:${left}px;top:${top}px;width:${this.tileSize - 6}px;height:${this.tileSize - 6}px;line-height:${this.tileSize - 6}px;`
        });
      }
    }
    this.setData({
      tiles,
      remainingTiles: boardUtils.countTiles(this.board),
      score: this.score
    });
  },

  getTypeClass(type) {
    const classes = ['type-red', 'type-green', 'type-black', 'type-gold'];
    return classes[type % classes.length];
  },

  goBack() {
    wx.navigateBack({ delta: 1 });
  },

  goHome() {
    wx.redirectTo({
      url: '/pages/index/index'
    });
  },

  restartGame() {
    this.initGame();
  },

  hideResult() {
    this.setData({
      resultVisible: false,
      resultTitle: '',
      resultDesc: ''
    });
  },

  onTileTouchStart(e) {
    if (this.gameFinished) {
      return;
    }
    const { row, col, key } = e.currentTarget.dataset;
    this.dragState = {
      row,
      col,
      key,
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      dx: 0,
      dy: 0,
      moved: false
    };
    this.selectedKey = key;
    this.hintKeys = [];
    this.renderBoard();
  },

  onTileTouchMove(e) {
    if (!this.dragState || this.gameFinished) {
      return;
    }
    this.dragState.dx = e.touches[0].clientX - this.dragState.startX;
    this.dragState.dy = e.touches[0].clientY - this.dragState.startY;
    if (Math.abs(this.dragState.dx) > 8 || Math.abs(this.dragState.dy) > 8) {
      this.dragState.moved = true;
    }
  },

  onTileTouchEnd() {
    if (!this.dragState || this.gameFinished) {
      return;
    }
    const state = this.dragState;
    this.dragState = null;
    if (!state.moved) {
      this.handleTap(state.row, state.col, state.key);
      return;
    }
    this.handleDrag(state);
  },

  handleTap(row, col, key) {
    const tile = this.getTile(row, col);
    if (!tile) {
      this.selectedKey = '';
      this.renderBoard();
      return;
    }
    if (this.selectedKey === key) {
      this.selectedKey = '';
      this.renderBoard();
      return;
    }

    const selected = this.findTileByKey(this.selectedKey);
    if (selected && selected.type === tile.type && this.isAdjacent(selected.row, selected.col, row, col)) {
      this.removePair(selected, tile);
      return;
    }

    this.selectedKey = key;
    this.renderBoard();
  },

  handleDrag(state) {
    const absX = Math.abs(state.dx);
    const absY = Math.abs(state.dy);
    const axis = absX >= absY ? 'horizontal' : 'vertical';
    const step = axis === 'horizontal' ? (state.dx > 0 ? 1 : -1) : (state.dy > 0 ? 1 : -1);
    const tile = this.getTile(state.row, state.col);
    if (!tile) {
      this.selectedKey = '';
      return;
    }

    const moved = boardUtils.shiftLine(this.board, state.row, state.col, axis, step);
    if (!moved) {
      this.selectedKey = '';
      this.ensurePlayable();
      this.renderBoard();
      this.updateStatus();
      return;
    }

    const match = boardUtils.findLinePair(this.board, moved.row, moved.col, axis);
    if (match && match.type === moved.type) {
      this.removePair(moved, match);
      return;
    }

    this.selectedKey = moved.key;
    this.ensurePlayable();
    this.renderBoard();
    this.updateStatus();
  },

  ensurePlayable() {
    if (this.gameFinished) {
      return;
    }
    if (!boardUtils.hasAnyMove(this.board)) {
      const shuffled = boardUtils.shuffleBoard(this.board, false);
      if (!shuffled) {
        boardUtils.ensureAdjacentPair(this.board);
      }
      this.hintKeys = [];
      this.selectedKey = '';
    }
  },

  onShuffle() {
    if (this.gameFinished) {
      return;
    }
    boardUtils.shuffleBoard(this.board, false);
    this.selectedKey = '';
    this.hintKeys = [];
    this.renderBoard();
    this.updateStatus();
  },

  onHint() {
    if (this.gameFinished) {
      return;
    }
    const hint = this.findHint();
    if (!hint) {
      wx.showToast({ title: '暂无提示', icon: 'none' });
      return;
    }
    this.hintKeys = [hint.a.key, hint.b.key];
    this.selectedKey = '';
    this.renderBoard();
    wx.showToast({ title: '已标记提示', icon: 'none' });
  },

  onEliminate() {
    if (this.gameFinished) {
      return;
    }
    const selected = this.findTileByKey(this.selectedKey);
    if (!selected) {
      const hint = this.findHint();
      if (!hint) {
        wx.showToast({ title: '先选择两张同牌', icon: 'none' });
        return;
      }
      this.removePair(hint.a, hint.b);
      return;
    }
    const match = boardUtils.findTapPair(this.board, selected.row, selected.col);
    if (match) {
      this.removePair(selected, match);
      return;
    }
    const lineMatch = boardUtils.findLinePair(this.board, selected.row, selected.col, 'horizontal') || boardUtils.findLinePair(this.board, selected.row, selected.col, 'vertical');
    if (lineMatch) {
      this.removePair(selected, lineMatch);
      return;
    }
    wx.showToast({ title: '没有可消除的目标', icon: 'none' });
  },

  findHint() {
    for (let row = 0; row < this.board.length; row += 1) {
      for (let col = 0; col < this.board[row].length; col += 1) {
        const tile = this.board[row][col];
        if (!tile) {
          continue;
        }
        const tapPair = boardUtils.findTapPair(this.board, row, col);
        if (tapPair) {
          return { a: tile, b: tapPair };
        }
        const horizontal = boardUtils.findLinePair(this.board, row, col, 'horizontal');
        if (horizontal) {
          return { a: tile, b: horizontal };
        }
        const vertical = boardUtils.findLinePair(this.board, row, col, 'vertical');
        if (vertical) {
          return { a: tile, b: vertical };
        }
      }
    }
    return null;
  },

  removePair(a, b) {
    if (!a || !b) {
      return;
    }
    boardUtils.removeTiles(this.board, a.key, b.key);
    this.selectedKey = '';
    this.hintKeys = [];
    this.score += 120;
    this.removedPairs += 1;
    this.renderBoard();
    this.updateStatus();
    this.afterBoardChange();
  },

  afterBoardChange() {
    if (boardUtils.countTiles(this.board) === 0) {
      this.advanceLevel();
      return;
    }
    if (!boardUtils.hasAnyMove(this.board)) {
      boardUtils.shuffleBoard(this.board, false);
      if (!boardUtils.hasAnyMove(this.board)) {
        boardUtils.ensureAdjacentPair(this.board);
      }
      this.renderBoard();
    }
  },

  advanceLevel() {
    if (this.currentLevelIndex + 1 < LEVELS.length) {
      this.score += 300;
      this.setData({
        resultVisible: false
      });
      this.startLevel(this.currentLevelIndex + 1, true);
      this.renderBoard();
      this.updateStatus();
      wx.showToast({ title: '进入第二关', icon: 'none' });
      return;
    }
    this.finishGame(true, '两关都完成了');
  },

  finishGame(cleared, reason) {
    if (this.gameFinished) {
      return;
    }
    this.gameFinished = true;
    this.stopTimer();
    this.score += cleared ? Math.max(0, this.timeLeft * 2) : 0;
    this.renderBoard();
    this.updateStatus();
    this.setData({
      resultVisible: true,
      resultTitle: cleared ? '通关成功' : '挑战失败',
      resultDesc: reason || (cleared ? '你把两关都清完了' : '时间结束，挑战失败')
    });
    this.submitRecord(cleared);
  },

  submitRecord(cleared) {
    api.post('/api/game/records', {
      nickname: this.nickname,
      score: this.score,
      cleared,
      levelReached: cleared ? 2 : this.currentLevelIndex + 1,
      elapsedSeconds: TOTAL_TIME - this.timeLeft
    }).catch(() => {});
  },

  getTile(row, col) {
    if (row < 0 || col < 0 || row >= this.board.length || col >= this.board[0].length) {
      return null;
    }
    return this.board[row][col];
  },

  findTileByKey(key) {
    if (!key) {
      return null;
    }
    for (let row = 0; row < this.board.length; row += 1) {
      for (let col = 0; col < this.board[row].length; col += 1) {
        const tile = this.board[row][col];
        if (tile && tile.key === key) {
          return tile;
        }
      }
    }
    return null;
  },

  isAdjacent(row1, col1, row2, col2) {
    return Math.abs(row1 - row2) + Math.abs(col1 - col2) === 1;
  }
});
