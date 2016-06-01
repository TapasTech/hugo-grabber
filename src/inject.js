function cleanHTML(html) {
  const div = document.createElement('div');
  div.innerHTML = html.trim();
  return Promise.all([].map.call(div.querySelectorAll('img[src]'), img => {
    return fetch(img.src)
    .then(res => res.blob())
    .then(blob => {
      if (blob.size > 1024 * 1024) {
        img.remove();
        return Promise.reject();
      }
      return blob;
    })
    .then(blob => new Promise((resolve, reject) => {
      const reader = new FileReader;
      reader.onload = function () {
        img.src = this.result;
        resolve();
      };
      reader.onerror = function () {
        reject();
      };
      reader.readAsDataURL(blob);
    }));
  })).then(() => div.innerHTML);
}

function extract(rule) {
  if (typeof rule === 'function') {
    return Promise.resolve(rule());
  } else {
    if (typeof rule === 'string') {
      rule = {selector: rule};
    }
    return Promise.resolve().then(() => {
      const el = document.querySelector(rule.selector);
      if (el) {
        return rule.type === 'text' ? el.textContent : cleanHTML(el.innerHTML);
      } else return '';
    });
  }
}

function grab(rules) {
  const article = {};
  const promises = [];
  for (let key in rules) {
    promises.push(extract(rules[key]).then(data => {
      article[key] = data;
    }));
  }
  Promise.all(promises).then(() => {
    chrome.runtime.sendMessage({
      cmd: 'grabbed',
      article,
    });
  });
}
