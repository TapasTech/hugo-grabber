function inject(script) {
  const el = document.createElement('script');
  el.innerHTML = script;
  const parent = document.body || document.documentElement;
  parent.appendChild(el);
  parent.removeChild(el);
}

function getScript(func, args) {
  return ';(' + func.toString() + ').apply(null,' + serialize(args || []) + ');';
}

function editAs(article) {
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
  inject(script);
}

function setNewVersion(ver) {
  sessionStorage.setItem('newVersion', ver);
}

chrome.runtime.sendMessage({cmd: 'checkVersion'}, ver => {
  if (ver && ver.name) {
    inject(getScript(setNewVersion, [ver.name]));
  }
});

chrome.runtime.sendMessage({cmd: 'setHost', data: location.origin});
