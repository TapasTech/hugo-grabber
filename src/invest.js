function init() {
  function pop(key) {
    var val = data[key];
    delete data[key];
    return val;
  }
  function set(key, val) {
    data[key] = val;
  }
  if (window._hgi) return;
  var data = {};
  pop.set = set;
  window._hgi = pop;
}

function inject(script) {
  var el = document.createElement('script');
  el.innerHTML = script;
  var parent = document.body || document.documentElement;
  parent.appendChild(el);
  parent.removeChild(el);
}

function getScript(func, args) {
  return ';(' + func.toString() + ').apply(null,' + serialize(args || []) + ');';
}

function editAs(article) {
  inject(getScript(function (article) {
    window._hgi.set('editAs:columns', article);
  }, [article]));
}

function setVersion(ver) {
  ver && inject(getScript(function (ver) {
    window._hgi.set('version', ver.version);
    ver.name && window._hgi.set('newVersion', ver.name);
  }, [ver]));
}

inject(getScript(init));

chrome.runtime.sendMessage({cmd: 'checkVersion'}, ver => {
  ver && setVersion(ver);
});

chrome.runtime.sendMessage({cmd: 'setHost', data: location.origin});

chrome.runtime.sendMessage({cmd: 'getArticle'}, article => {
  article && editAs(article);
});
