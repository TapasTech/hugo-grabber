window.grab = window.grab || function () {
  function cleanHTML(html, rule) {
    const div = document.createElement('div');
    div.innerHTML = html.trim();
    'script noscript style textarea video audio iframe object'.split(' ')
    .forEach(tag => {
      [].forEach.call(div.querySelectorAll(tag), el => el.remove());
    });
    const imageRule = Object.assign({}, rule._image);
    imageRule.els = imageRule.els || 'img[src]';
    if (typeof imageRule.els === 'string') {
      imageRule.els = function (selector) {
        return div => div.querySelectorAll(selector);
      }(imageRule.els);
    }
    imageRule.getSrc = imageRule.getSrc || (img => img.src);
    return Promise.all([].map.call(imageRule.els(div), img => {
      return fetch(imageRule.getSrc(img))
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
          const image = new Image;
          image.src = this.result;
          img.parentNode.replaceChild(image, img);
          resolve();
        };
        reader.onerror = function () {
          reject();
        };
        reader.readAsDataURL(blob);
      }))
      .catch(() => {});
    })).then(() => div.innerHTML);
  }

  function extract(value, rule) {
    if (Array.isArray(value)) {
      return Promise.all(value.map(item => extract(item, rule)))
      .then(contents => contents.filter(content => content).join('\n'));
    } else if (typeof value === 'function') {
      return Promise.resolve(value());
    } else {
      if (typeof value === 'string') {
        value = {selector: value};
      }
      return Promise.resolve().then(() => {
        const el = document.querySelector(value.selector);
        if (el) {
          return value._type === 'text' ? el.textContent : cleanHTML(el.innerHTML, rule);
        } else return '';
      });
    }
  }

  function grab(rule) {
    const article = {};
    const promises = [];
    Object.keys(rule).forEach(key => {
      key && key[0] !== '_' && promises.push(extract(rule[key], rule).then(data => {
        article[key] = data;
      }, err => {
        console.warn(err);
      }));
    });
    Promise.all(promises).then(() => {
      chrome.runtime.sendMessage({
        cmd: 'grabbed',
        article,
      });
    });
  }

  return grab;
}();
