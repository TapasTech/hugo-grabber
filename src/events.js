!function () {
  function checkTab(tab) {
    if (rules.find(tab.url)) {
      chrome.pageAction.show(tab.id);
    } else {
      chrome.pageAction.hide(tab.id);
    }
  }
  function fetchByXHR(url) {
    function buildRes(text) {
      return {
        text: function () {return text;},
        json: function () {return JSON.parse(text);},
      };
    }
    return new Promise(function (resolve, reject) {
      var x = new XMLHttpRequest;
      x.open('GET', url);
      x.onloadend = function () {
        if (x.status > 300) return reject();
        resolve(buildRes(x.responseText));
      };
      x.send();
    });
  }

  var version = function () {
    function hasUpdates(local, remote) {
      local = local.split('.');
      remote = remote.split('.');
      for (var i = 0, lv, rv; lv = local[i], rv = remote[i], lv || rv; i ++) {
        var nlv = +lv || 0;
        var nrv = +rv || 0;
        if (nlv !== nrv) return nlv < nrv;
      }
      return false;
    }
    function check() {
      fetchByXHR('https://api.github.com/repos/TapasTech/hugo-grabber/releases/latest')
      .then(function (res) {return res.json();})
      .then(function (data) {
        var latest = data.tag_name.slice(1);
        info.update = hasUpdates(info.version, latest) ? latest : null;
      })
      .then(function () {
        localStorage.setItem(KEY_VERSION, JSON.stringify(info));
        setTimeout(check, 3 * 60 * 60 * 1000);
      });
    }
    function init() {
      fetchByXHR('/manifest.json')
      .then(function (res) {return res.json();})
      .then(function (data) {
        try {
          info = JSON.parse(localStorage.getItem(KEY_VERSION));
        } catch (e) {
          // ignore
        }
        info = info || {};
        info.version = data.version;
        check();
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
    function getRE(s) {
      var re = recache[s];
      if (!re) re = recache[s] = new RegExp(s);
      return re;
    }
    function find(url) {
      var rule = cache[url];
      if (rule) return rule;
      rule = rules.find(function (rule) {
        var type = typeof rule.match;
        if (type === 'string') return getRE(rule.match).test(url);
        if (type === 'function') return rule.match(url);
        return !rule.match;
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
      var rules = window.deserialize(localStorage.getItem(KEY_RULES + ':' + id));
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
          url: 'https://backend-invest.test.dtcj.com/node/data/grab-invest.json',
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
      return state.checking = fetchByXHR(url)
      .then(function (res) {return res.text();})
      .then(function (data) {
        data = window.normalizeRules(data, url);
        item.lastCheck = Date.now();
        saveMeta();
        saveData(id, data);
      })
      .catch(function (e) {
        console.warn(e);
      })
      .then(function () {
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
        return item.disabled ? res : res.concat(loadData(item.id));
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
    function updateMeta(data) {
      var item = getItem(data.id);
      var changed = false;
      [
        'disabled',
      ].forEach(function (key) {
        var value = data[key];
        if (value != null) {
          item[key] = value;
          changed = true;
        }
      });
      if (changed) {
        updateState(data.id);
        updateTabState();
        saveMeta();
      }
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
    var rules;
    var cache = {};
    var recache = {};
    var states = {};
    updateTabState();
    setTimeout(checkUpdates, 20 * 1000);
    return {
      find: find,
      remove: remove,
      update: update,
      updateMeta: updateMeta,
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
    updateRuleMeta: function (meta) {
      meta && rules.updateMeta(meta);
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
      file: 'grab.js',
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
