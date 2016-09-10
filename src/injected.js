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

function setEdit(article) {
  inject(getScript(function (GLOBAL_KEY, article) {
    window[GLOBAL_KEY].set('grabbed', article);
    // DEPRECATED
    window[GLOBAL_KEY].set('editAs:columns', article);
  }, [GLOBAL_KEY, article]));
}

function setVersion(ver) {
  ver && inject(getScript(function (GLOBAL_KEY, ver) {
    window[GLOBAL_KEY].set('version', ver.version);
    ver.name && window[GLOBAL_KEY].set('newVersion', ver.name);
  }, [GLOBAL_KEY, ver]));
}

var GLOBAL_KEY = '_hgi';
inject(getScript(init, [GLOBAL_KEY]));

chrome.runtime.sendMessage({cmd: 'checkVersion'}, function (ver) {
  ver && setVersion(ver);
});

chrome.runtime.sendMessage({cmd: 'getArticle'}, function (article) {
  article && setEdit(article);
});
