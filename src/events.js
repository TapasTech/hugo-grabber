function checkTab(tab) {
  if (findRule(tab.url)) {
    chrome.pageAction.show(tab.id);
  } else {
    chrome.pageAction.hide(tab.id);
  }
}

function serialize(obj) {
  if (Array.isArray(obj) || typeof obj !== 'object') {
    return JSON.stringify(obj);
  } else {
    const results = [];
    for (let k in obj) {
      results.push(JSON.stringify(k) + ':' + serialize(obj[k]));
    }
    return '{' + results.join(',') + '}';
  }
}

function getScript(func, args) {
  return '!' + func.toString() + '.apply(null,' + serialize(args || []) + ');';
}

function prepareData(article) {
  function inject(script) {
    const el = document.createElement('script');
    el.innerHTML = script;
    const parent = document.body || document.documentElement;
    parent.appendChild(el);
    parent.removeChild(el);
  }

  const script = getScript(function (article) {
    function getMethod(name, retry) {
      return new Promise(function (resolve, reject) {
        var method = window[prefix + name];
        if (method) resolve(method);
        else if (retry) {
          if (retry > 0) retry --;
          setTimeout(function () {
            resolve(getMethod(name, retry));
          }, 500);
        } else {
          reject();
        }
      });
    }
    var prefix = '//hugo//';
    getMethod('editAs', 10).then(function (editAs) {
      editAs('columns', article);
    });
  }, [article]);
  return getScript(inject, [script]);
}

function grabData(rule) {
  return 'grab(' + serialize(rule) + ')';
}

const findRule = function () {
  const cache = {};
  return function (url) {
    var rule = cache[url];
    if (rule) return rule;
    rule = rules.find(rule => !rule.match || rule.match(url));
    if (rule) {
      cache[url] = rule;
      setTimeout(() => {
        delete cache[url];
      }, 3000);
    }
    return rule;
  };
}();

const CONST_URL_NEW = 'http://localhost:4002/draft/columns/_new';

chrome.runtime.onMessage.addListener(function (req, src, callback) {
  if (req.cmd === 'grabbed') {
    const article = req.article;
    article.origin_url = article.origin_url || src.url.split('#')[0];
    article.compose_organization = article.compose_organization || '第一财经｜CBN';
    chrome.tabs.create({
      url: CONST_URL_NEW,
    }, tab => {
      chrome.tabs.executeScript(tab.id, {
        code: prepareData(article),
        runAt: 'document_end',
      });
    });
  }
});

chrome.pageAction.onClicked.addListener(tab => {
  const rule = findRule(tab.url);
  rule && rule.data && chrome.tabs.executeScript(tab.id, {
    code: grabData(rule.data),
    runAt: 'document_start',
  });
});

chrome.windows.getAll(windows => {
  windows.forEach(win => {
    chrome.tabs.getAllInWindow(win.id, tabs => {
      tabs.forEach(checkTab);
    });
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  checkTab(tab);
});
