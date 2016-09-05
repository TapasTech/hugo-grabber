function checkTab(tab) {
  if (findRule(tab.url)) {
    chrome.pageAction.show(tab.id);
  } else {
    chrome.pageAction.hide(tab.id);
  }
}

// function checkUpdate() {
//   fetch('https://api.github.com/repos/TapasTech/HugoInvestGrabber/releases/latest')
//   .then(res => res.json())
//   .then(data => {
//     var localVersion = versionInfo.version.split('.');
//     var remoteVersion = data.tag_name.slice(1).split('.');
//     var i = 0;
//     while (1) {
//       var lv = localVersion[i];
//       var rv = remoteVersion[i];
//       var nlv = +lv || 0;
//       var nrv = +rv || 0;
//       if (!lv && !rv || nlv > nrv) return Promise.reject();
//       if (nlv < nrv) return data.tag_name;
//       i ++;
//     }
//   })
//   .then(newVersion => {
//     versionInfo.name = newVersion;
//   }, () => {
//     versionInfo.name = null;
//   })
//   .then(() => {
//     localStorage.setItem(KEY_VERSION, JSON.stringify(versionInfo));
//     setTimeout(checkUpdate, 3 * 60 * 60 * 1000);
//   });
// }

var KEY_VERSION = 'versionInfo';

var versionInfo = {};
fetch('manifest.json')
.then(res => res.json())
.then(data => {
  try {
    versionInfo = JSON.parse(localStorage.getItem(KEY_VERSION));
  } catch (e) {}
  versionInfo = versionInfo || {};
  versionInfo.version = data.version;
  // checkUpdate();
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
  }
  function remove(tabId) {
    delete hash[tabId];
  }
  function get(tabId) {
    return hash[tabId];
  }
  var hash = {};
  return {
    add,
    get,
    remove,
  };
}();

chrome.runtime.onMessage.addListener(function (req, src, callback) {
  if (req.cmd === 'grabbed') {
    chrome.tabs.create({
      url: req.open,
    }, tab => {
      tabUpdates.add(tab.id, req.article);
    });
  } else if (req.cmd === 'checkVersion') {
    callback(versionInfo);
  } else if (req.cmd === 'getArticle') {
    var item = tabUpdates.get(src.tab.id);
    item && callback(item.article);
    tabUpdates.remove(src.tab.id);
  }
});

chrome.pageAction.onClicked.addListener(tab => {
  var rule = findRule(tab.url);
  rule && rule.data && chrome.tabs.executeScript(tab.id, {
    file: 'inject.js',
    runAt: 'document_start',
  }, () => {
    chrome.tabs.executeScript(tab.id, {
      code: 'grab(' + serialize(rule) + ')',
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

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  tabUpdates.remove(tabId);
});

// XXX fix for Chrome 48
chrome.tabs.onActivated.addListener(activeInfo => {
  chrome.tabs.get(activeInfo.tabId, tab => checkTab(tab));
});
