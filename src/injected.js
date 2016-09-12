!function () {
  function init(GLOBAL_KEY, EVT_TYPE) {
    function pop(key, options) {
      var val = data[key];
      delete data[key];
      post({
        action: 'pop',
        key: key,
        options: options,
      });
      return val;
    }
    function set(key, val) {
      data[key] = val;
    }
    function post(data) {
      var evt = new CustomEvent(EVT_TYPE, {
        detail: data,
      });
      document.dispatchEvent(evt);
    }
    if (window[GLOBAL_KEY]) return;
    var data = {};
    pop.set = set;
    window[GLOBAL_KEY] = pop;
  }

  function inject(script) {
    var el = document.createElement('script');
    el.innerHTML = script;
    var parent = document.body || document.documentElement;
    parent.appendChild(el);
    parent.removeChild(el);
  }

  function getScript(func, args) {
    if (!args) args = [];
    else if (!Array.isArray(args)) args = [args];
    return ';(' + func.toString() + ').apply(null,' + window.serialize(args) + ');';
  }

  function showHint(msg) {
    function create() {
      div = document.createElement('div');
      div.setAttribute('style', [
        'position: fixed',
        'top: 1em',
        'right: 1em',
        'padding: 1em',
        'background: rgba(0,0,0,.8)',
        'color: white',
        'font-size: 14px',
        'font-weight: 300',
        'border-radius: .5em',
        'z-index: 20000',
        'opacity: 0',
        'transition: opacity .3s',
      ].join(';'));
      set(msg);
      div.addEventListener('click', remove);
      (document.body || document.documentElement).appendChild(div);
      setTimeout(function () {
        div.style.opacity = 1;
      });
    }
    function set(msg) {
      div.innerHTML = msg;
    }
    function remove() {
      div.style.opacity = 0;
      setTimeout(function () {
        div.remove();
      }, 300);
    }
    function removeLater(delay, msg) {
      msg && set(msg);
      setTimeout(remove, delay || 3000);
    }
    var div;
    create();
    return {
      set: set,
      remove: remove,
      removeLater: removeLater,
    };
  }

  function setEdit(article) {
    inject(getScript(function (GLOBAL_KEY, article) {
      window[GLOBAL_KEY].set('grabbed', article);
      // DEPRECATED
      window[GLOBAL_KEY].set('editAs:columns', article);
    }, [GLOBAL_KEY, article]));
    chrome.runtime.sendMessage({cmd: 'checkVersion'}, function (ver) {
      ver && setVersion(ver);
    });
  }

  function setVersion(ver) {
    if (!ver) return;
    notifyUpdate = ver.update && function () {
      showHint('您的插件版本过旧，请及时更新！');
      notifyUpdate = null;
    };
    inject(getScript(function (GLOBAL_KEY, ver) {
      var g = window[GLOBAL_KEY];
      g.set('version', ver.version);
      g.set('update', ver.update);
    }, [GLOBAL_KEY, ver]));
  }

  function handlePop(detail) {
    switch (detail.key) {
    case 'version':
      if (detail.options && detail.options.noNotification) {
        notifyUpdate = null;
      }
      notifyUpdate && notifyUpdate();
      break;
    }
  }

  var notifyUpdate;
  var GLOBAL_KEY = '_hgi';
  var EVT_TYPE = 'hg-' + Math.random().toString(16).slice(2, 8);
  inject(getScript(init, [GLOBAL_KEY, EVT_TYPE]));
  window.showHint = showHint;

  var handlers = {
    pop: handlePop,
  };
  document.addEventListener(EVT_TYPE, function (e) {
    var detail = e.detail;
    var handle = handlers[detail && detail.action];
    handle && handle(detail);
  });

  chrome.runtime.sendMessage({cmd: 'getArticle'}, function (article) {
    article && setEdit(article);
  });
}();
