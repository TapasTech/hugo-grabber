!function () {
  function init(GLOBAL_KEY) {
    function pop(key) {
      var val = data[key];
      delete data[key];
      return val;
    }
    function set(key, val) {
      data[key] = val;
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
      ].join(';'));
      div.innerHTML = msg;
      div.addEventListener('click', remove);
      (document.body || document.documentElement).appendChild(div);
    }
    function set(msg) {
      div.innerHTML = msg;
    }
    function remove() {
      div.remove();
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
    inject(getScript(function (GLOBAL_KEY, ver) {
      window[GLOBAL_KEY].set('version', ver.version);
    }, [GLOBAL_KEY, ver]));
    ver.update && showHint('您的插件版本过旧，请及时更新！');
  }

  var GLOBAL_KEY = '_hgi';
  inject(getScript(init, [GLOBAL_KEY]));
  window.showHint = showHint;

  chrome.runtime.sendMessage({cmd: 'getArticle'}, function (article) {
    article && setEdit(article);
  });
}();
