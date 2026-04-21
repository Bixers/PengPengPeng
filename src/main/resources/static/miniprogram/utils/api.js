function request(path, method, data) {
  const app = getApp();
  const baseUrl = app && app.globalData && app.globalData.apiBaseUrl ? app.globalData.apiBaseUrl : '';
  const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}${path}` : path;

  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method,
      data,
      header: {
        'content-type': 'application/json'
      },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
          return;
        }
        reject(new Error(`HTTP ${res.statusCode}`));
      },
      fail(err) {
        reject(err);
      }
    });
  });
}

function get(path, data) {
  return request(path, 'GET', data);
}

function post(path, data) {
  return request(path, 'POST', data);
}

module.exports = {
  get,
  post
};
