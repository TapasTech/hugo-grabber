!function () {
  function $(selector) {
    return document.querySelector(selector);
  }
  function request(options) {
    function wrap(callback) {
      return function () {
        callback && callback(this);
      };
    }
    var xhr = new XMLHttpRequest;
    xhr.open(options.method || 'GET', options.url, true);
    xhr.onload = wrap(options.onload);
    xhr.onerror = wrap(options.onerror);
    xhr.send();
  }
  function renderReleases(releases) {
    var ul = $('#download-list');
    var limit = 4;
    var items = releases.slice(0, limit).map(function (item) {
      var asset = item.assets[0];
      var name = item.name || item.tag_name;
      if (asset) {
        name = '<a href="' + encodeURI(asset.browser_download_url) + '">' + name + '</a>';
      }
      var publishedAt = new Date(item.published_at);
      name += ' [' + publishedAt.getFullYear() + '/' + (publishedAt.getMonth() + 1) + '/' + publishedAt.getDate() + ']';
      return '<li>' + name + '</li>';
    });
    if (releases.length > limit) items.push('<li><a href="https://github.com/TapasTech/HugoInvestGrabber/releases" target=_blank>更多</a></li>');
    ul.innerHTML = items.join('');
  }
  request({
    url: 'https://api.github.com/repos/TapasTech/HugoInvestGrabber/releases/latest',
    onload: function (xhr) {
      renderReleases([JSON.parse(xhr.responseText)]);
    },
  });
  // request({
  //   url: 'https://api.github.com/repos/TapasTech/HugoInvestGrabber/releases',
  //   onload: function (xhr) {
  //     renderReleases(JSON.parse(xhr.responseText));
  //   },
  // });
}();
