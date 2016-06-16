function readHost() {
  investHost = localStorage.getItem(KEY_HOST) || 'https://backend-invest.dtcj.com';
}

function checkTab(tab) {
  if (findRule(tab.url)) {
    chrome.pageAction.show(tab.id);
  } else {
    chrome.pageAction.hide(tab.id);
  }
}

function checkUpdate() {
  fetch('https://api.github.com/repos/TapasTech/HugoInvestGrabber/releases/latest')
  .then(res => res.json())
  .then(data => {
    var localVersion = versionInfo.version.split('.');
    var remoteVersion = data.tag_name.slice(1).split('.');
    var i = 0;
    while (1) {
      var lv = localVersion[i];
      var rv = remoteVersion[i];
      var nlv = +lv || 0;
      var nrv = +rv || 0;
      if (!lv && !rv || nlv > nrv) return Promise.reject();
      if (nlv < nrv) return data.tag_name;
      i ++;
    }
  })
  .then(newVersion => {
    versionInfo.name = newVersion;
  }, () => {
    versionInfo.name = null;
  })
  .then(() => {
    localStorage.setItem(KEY_VERSION, JSON.stringify(versionInfo));
    setTimeout(checkUpdate, 3 * 60 * 60 * 1000);
  });
}

function parseRules() {
  return rules.map(rule => ({
    match: rule.match,
    data: Object.keys(rule.data).reduce((res, key) => {
      var value = rule.data[key];
      if (key.startsWith('_')) {
        res[key] = value;
      } else {
        var meta, data;
        if (Array.isArray(value)) {
          data = value;
        } else if (typeof value === 'object' && value._data) {
          meta = Object.keys(value).reduce((meta, key) => {
            if (key !== '_data') meta[key] = value[key];
            return meta;
          }, {});
          data = value._data;
        } else {
          data = [value];
        }
        res[key] = data.map(item => {
          if (typeof item === 'string') item = {selector: item};
          else if (typeof item === 'function') item = {value: item};
          return Object.assign(item, meta);
        });
      }
      return res;
    }, {}),
  }));
}

var KEY_VERSION = 'versionInfo';
var KEY_HOST = 'investHost';
var investHost;
readHost();
var parsedRules = parseRules();

var versionInfo = {};
fetch('manifest.json')
.then(res => res.json())
.then(data => {
  try {
    versionInfo = JSON.parse(localStorage.getItem(KEY_VERSION));
  } catch (e) {}
  versionInfo = versionInfo || {};
  versionInfo.version = data.version;
  checkUpdate();
});

var findRule = function () {
  var cache = {};
  return function (url) {
    var rule = cache[url];
    if (rule) return rule;
    rule = parsedRules.find(rule => !rule.match || rule.match(url));
    if (rule) {
      cache[url] = rule;
      setTimeout(() => {
        delete cache[url];
      }, 3000);
    }
    return rule;
  };
}();

var tabUpdates = function () {
  function add(tabId, article) {
    var item = {
      id: tabId,
      article,
    };
    hash[tabId] = item;
    item.timer = setTimeout(cancel, 1000, item);
  }
  function cancel(item) {
    if (item.timer) {
      clearTimeout(item.timer);
      item.timer = null;
    }
    delete hash[item.id];
  }
  function get(tabId) {
    return hash[tabId];
  }
  var hash = {};
  return {
    add,
    get,
  };
}();

chrome.runtime.onMessage.addListener(function (req, src, callback) {
  if (req.cmd === 'grabbed') {
    var article = req.article;
    article.origin_url = article.origin_url || src.url.split('#')[0];
    article.compose_organization = article.compose_organization || '第一财经｜CBN';
    chrome.tabs.create({
      url: investHost + '/draft/columns/_new',
    }, tab => tabUpdates.add(tab.id, article));
  } else if (req.cmd === 'checkVersion') {
    callback(versionInfo);
  } else if (req.cmd === 'setHost') {
    localStorage.setItem(KEY_HOST, req.data);
    readHost();
  } else if (req.cmd === 'getArticle') {
    var item = tabUpdates.get(src.tab.id);
    item && callback(item.article);
  }
});

chrome.pageAction.onClicked.addListener(tab => {
  var rule = findRule(tab.url);
  rule && rule.data && chrome.tabs.executeScript(tab.id, {
    file: 'inject.js',
    runAt: 'document_start',
  }, () => {
    chrome.tabs.executeScript(tab.id, {
      code: 'grab(' + serialize(rule.data) + ')',
      runAt: 'document_start',
    });
  });
});

chrome.tabs.query({}, tabs => {
  tabs.forEach(checkTab);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  checkTab(tab);
});

// XXX fix for Chrome 48
chrome.tabs.onCreated.addListener(tab => {
  checkTab(tab);
});
