!function () {
  function checkTab(tab) {
    if (rules.find(tab.url)) {
      chrome.pageAction.show(tab.id);
    } else {
      chrome.pageAction.hide(tab.id);
    }
  }

  var version = function () {
    // function check() {
    //   fetch('https://api.github.com/repos/TapasTech/HugoInvestGrabber/releases/latest')
    //   .then(function (res) {return res.json();})
    //   .then(function (data) {
    //     var localVersion = info.version.split('.');
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
    //   .then(function (newVersion) {
    //     info.name = newVersion;
    //   }, function () {
    //     info.name = null;
    //   })
    //   .then(function () {
    //     localStorage.setItem(KEY_VERSION, JSON.stringify(info));
    //     setTimeout(check, 3 * 60 * 60 * 1000);
    //   });
    // }
    function init() {
      fetch('manifest.json')
      .then(function (res) {return res.json();})
      .then(function (data) {
        try {
          info = JSON.parse(localStorage.getItem(KEY_VERSION));
        } catch (e) {
          // ignore
        }
        info = info || {};
        info.version = data.version;
        // check();
      });
    }
    var KEY_VERSION = 'versionInfo';
    var info = {};
    init();
    return {
      info: function () {return info;},
    };
  }();

  var rules = function () {
    function find(url) {
      var rule = cache[url];
      if (rule) return rule;
      rule = rules.find(function (rule) {
        return !rule.match || rule.match(url);
      });
      if (rule) {
        cache[url] = rule;
        setTimeout(function () {
          delete cache[url];
        }, 3000);
      }
      return rule;
    }
    function loadData(id) {
      var rules;
      try {
        rules = (0, eval)(localStorage.getItem(KEY_RULES + ':' + id));
      } catch (e) {
        // ignore
      }
      if (!Array.isArray(rules)) rules = [];
      return window.parseRules(rules);
    }
    function saveData(id, data) {
      localStorage.setItem(KEY_RULES + ':' + id, data);
    }
    function loadMeta() {
      var meta;
      try {
        meta = JSON.parse(localStorage.getItem(KEY_RULES));
      } catch (e) {
        // ignore
      }
      meta = meta || {};
      if (!meta.list) {
        meta.list = [{
          id: 1,
          url: 'https://backend-invest.test.dtcj.com/node/data/grab-invest.js',
        }];
        // fetch default lists
        setTimeout(checkUpdates);
      }
      return meta;
    }
    function saveMeta() {
      localStorage.setItem(KEY_RULES, JSON.stringify(meta));
    }
    function getItem(id) {
      return id && meta.list.find(function (item) {return item.id === id;});
    }
    function fetchData(url, id) {
      var item = getItem(id);
      if (!item) {
        var lastItem = meta.list[meta.list.length - 1];
        id = (lastItem && lastItem.id || 0) + 1;
        item = {
          id: id,
          url: url,
        };
        meta.list.push(item);
      }
      var state = states[id] = states[id] || {};
      if (state.checking) return state.checking;
      updateState(id);
      return state.checking = fetch(url)
      .then(function (res) {
        return res.text();
      })
      .then(function (data) {
        item.lastCheck = Date.now();
        saveMeta();
        saveData(id, data);
        state.checking = null;
        updateState(id);
        updateTabState();
      });
    }
    function update(id) {
      var item = meta.list.find(function (item) {
        return item.id === id;
      });
      item && fetchData(item.url, item.id);
    }
    function checkUpdates() {
      var now = Date.now();
      return Promise.all(meta.list.map(function (item) {
        return (!item.lastCheck || item.lastCheck + 10 * 60 * 1000 < now) && fetchData(item.url, item.id);
      }))
      .then(function () {
        meta.lastCheck = Date.now();
        saveMeta();
        return new Promise(function (resolve) {
          setTimeout(resolve, 2 * 60 * 60 * 1000);
        });
      })
      .then(checkUpdates);
    }
    function remove(id) {
      var i = meta.list.findIndex(function (item) {
        return item.id === id;
      });
      delete states[id];
      localStorage.removeItem(KEY_RULES + ':' + id);
      if (~i) {
        meta.list.splice(i, 1);
        saveMeta();
      }
      updateState(id);
      updateTabState();
    }
    function loadAll() {
      return meta.list.reduce(function (res, item) {
        return res.concat(loadData(item.id));
      }, []);
    }
    function normalize(item) {
      return item && Object.assign({}, item, {
        checking: !!(states[item.id] && states[item.id].checking),
      });
    }
    function getNormalizedItem(id) {
      return normalize(getItem(id));
    }
    var updateState = function () {
      function update() {
        timer = null;
        var items = toUpdate.map(function (id) {
          return getNormalizedItem(id) || {id: id};
        });
        chrome.runtime.sendMessage({
          cmd: 'updateItems',
          data: items,
        });
      }
      var toUpdate = [];
      var timer;
      return function (id) {
        toUpdate.indexOf(id) < 0 && toUpdate.push(id);
        if (!timer) timer = setTimeout(update);
      };
    }();
    var updateTabState = function () {
      function update() {
        timer = null;
        rules = loadAll();
        chrome.tabs.query({}, function (tabs) {
          tabs.forEach(checkTab);
        });
      }
      var timer;
      return function () {
        if (!timer) timer = setTimeout(update);
      };
    }();
    var KEY_RULES = 'rules';
    var meta = loadMeta();
    var rules = loadAll();
    var cache = {};
    var states = {};
    setTimeout(checkUpdates, 20 * 1000);
    return {
      find: find,
      remove: remove,
      update: update,
      item: getNormalizedItem,
      list: function () {return meta.list.map(normalize);},
      subscribe: function (url) {
        if (meta.list.find(function (item) {return item.url === url;})) return;
        fetchData(url);
      },
    };
  }();

  var tabUpdates = function () {
    function add(tabId, article) {
      var item = {
        article: article,
        id: tabId,
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
      add: add,
      get: get,
      remove: remove,
    };
  }();

  var handlers = {
    grabbed: function (data) {
      chrome.tabs.create({
        url: data.open,
      }, function (tab) {
        tabUpdates.add(tab.id, data.article);
      });
    },
    checkVersion: function (_data, _src, callback) {
      callback(version.info());
    },
    getArticle: function (_data, src, callback) {
      var item = tabUpdates.get(src.tab.id);
      item && callback(item.article);
      tabUpdates.remove(src.tab.id);
    },
    getRuleList: function (_data, _src, callback) {
      callback(rules.list());
    },
    updateRule: function (id) {
      rules.update(id);
    },
    removeRule: function (id) {
      rules.remove(id);
    },
    subscribe: function (url) {
      rules.subscribe(url);
    },
  };
  chrome.runtime.onMessage.addListener(function (req, src, callback) {
    var handle = handlers[req.cmd];
    return handle && handle(req.data, src, callback);
  });

  chrome.pageAction.onClicked.addListener(function (tab) {
    var rule = rules.find(tab.url);
    rule && rule.data && chrome.tabs.executeScript(tab.id, {
      file: 'inject.js',
      runAt: 'document_start',
    }, function () {
      chrome.tabs.executeScript(tab.id, {
        code: 'grab(' + window.serialize(rule) + ')',
        runAt: 'document_start',
      });
    });
  });

  chrome.tabs.onUpdated.addListener(function (_tabId, _changeInfo, tab) {
    checkTab(tab);
  });

  chrome.tabs.onRemoved.addListener(function (tabId, _removeInfo) {
    tabUpdates.remove(tabId);
  });

  // XXX fix for Chrome 48
  chrome.tabs.onActivated.addListener(function (activeInfo) {
    chrome.tabs.get(activeInfo.tabId, function (tab) {checkTab(tab);});
  });
}();
