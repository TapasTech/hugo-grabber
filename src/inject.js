window.grab = window.grab || function () {
  function cleanHTML(html, rule) {
    var div = document.createElement('div');
    div.innerHTML = html.trim();
    'script noscript style textarea video audio iframe object'.split(' ')
    .forEach(tag => {
      [].forEach.call(div.querySelectorAll(tag), el => el.remove());
    });
    var imageRule = Object.assign({}, rule._image);
    var getElements = imageRule.getElements || 'img[src]';
    if (typeof getElements === 'string') {
      getElements = function (selector) {
        return div => div.querySelectorAll(selector);
      }(getElements);
    }
    imageRule.getSrc = imageRule.getSrc || (img => img.src);
    return Promise.all([].map.call(getElements(div), img => {
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
        var reader = new FileReader;
        reader.onload = function () {
          var image = new Image;
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

  function extractOne(item, rule) {
    if (item.value) return item.value();
    var el = document.querySelector(item.selector);
    if (el) {
      return item._type === 'html' ? cleanHTML(el.innerHTML, rule) : el.textContent.trim();
    } else return '';
  }

  function extract(value, rule) {
    return Promise.all(value.map(item => extractOne(item, rule)))
    .then(contents => contents.filter(content => content).join('\n'));
  }

  function grab(rule) {
    if (inProgress) return;
    inProgress = true;
    var article = {};
    var promises = [];
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
      inProgress = false;
    });
  }

  var inProgress;

  return grab;
}();
