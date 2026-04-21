const api = require('../../utils/api');

Page({
  data: {
    nickname: '',
    rankings: [],
    loading: false
  },

  onLoad() {
    const nickname = wx.getStorageSync('ppp_nickname') || `玩家${Math.floor(Math.random() * 9000 + 1000)}`;
    this.setData({ nickname });
    this.loadRankings();
  },

  onShow() {
    const nickname = wx.getStorageSync('ppp_nickname');
    if (nickname && nickname !== this.data.nickname) {
      this.setData({ nickname });
    }
  },

  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value });
  },

  startGame() {
    const nickname = (this.data.nickname || '').trim() || `玩家${Math.floor(Math.random() * 9000 + 1000)}`;
    wx.setStorageSync('ppp_nickname', nickname);
    wx.navigateTo({
      url: `/pages/game/index?nickname=${encodeURIComponent(nickname)}`
    });
  },

  loadRankings() {
    this.setData({ loading: true });
    api.get('/api/game/rankings', { limit: 10 })
      .then((res) => {
        if (res && res.code === 0) {
          this.setData({ rankings: res.data || [] });
        }
      })
      .catch(() => {
        this.setData({ rankings: [] });
      })
      .finally(() => {
        this.setData({ loading: false });
      });
  }
});
