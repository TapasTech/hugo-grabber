window.grab = window.grab || function () {
  function cleanHTML(html, meta) {
    var imageRule = Object.assign({
      el: 'img[src]',
      src: img => img.src,
      maxSize: 1024 * 1024,
    }, meta.image);
    var div = document.createElement('div');
    div.innerHTML = html.trim();
    var ignoreTags = [
      'script',
      'noscript',
      'style',
      'textarea',
      'video',
      'audio',
      'iframe',
      'object',
    ];
    if (!imageRule.el) ignoreTags.push('img');
    ignoreTags.forEach(tag => {
      Array.prototype.forEach.call(div.querySelectorAll(tag), el => el.remove());
    });
    if (!imageRule.el) return div.innerHTML;
    var els = typeof imageRule.el === 'string' ? div.querySelectorAll(imageRule.el) : imageRule.el(div);
    return Promise.all(Array.prototype.map.call(els, img => {
      return fetch(imageRule.src(img))
      .then(res => res.blob())
      .then(blob => blob.size > imageRule.maxSize ? Promise.reject() : blob)
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
      .catch(() => img.remove());
    })).then(() => div.innerHTML);
  }

  function extractOne(item, meta) {
    if (item.value) return item.value(window);
    var el = document.querySelector(item.sel);
    var str = el ? (
      item.type === 'html' ? cleanHTML(el.innerHTML, meta) : el.textContent.trim()
    ) : '';
    if (item.transform) str = item.transform(str);
    return str;
  }

  function extract(group, meta) {
    return Promise.all(group.map(item => extractOne(item, meta)))
    .then(contents => contents.filter(content => content).join('\n'));
  }

  function grab(rule) {
    if (inProgress) return;
    var finish = showHint();
    var meta = rule.meta;
    var data = rule.data;
    inProgress = true;
    var promises = Object.keys(data).filter(key => key[0] !== '_')
    .map(key => extract(data[key], meta).then(data => [key, data], err => console.warn(err)));
    Promise.all(promises)
    .then(pairs => pairs.reduce((res, item) => {
      res[item[0]] = item[1];
      return res;
    }, {}))
    .then(article => {
      if (meta.transform) article = meta.transform(article) || article;
      chrome.runtime.sendMessage({
        cmd: 'grabbed',
        open: meta.open,
        article,
      });
      inProgress = false;
      finish();
    });
  }

  function showHint() {
    var div = document.createElement('div');
    div.setAttribute('style', [
      'position: fixed',
      'top: 1em',
      'right: 1em',
      'padding: 1em',
      'background: rgba(0,0,0,.6)',
      'color: white',
      'font-size: 14px',
      'font-weight: 300',
      'border-radius: .5em',
    ].join(';'));
    div.innerHTML = '正在抓取...';
    document.body.appendChild(div);
    return function () {
      div.innerHTML = '抓取完成';
      setTimeout(() => div.remove(), 3000);
    };
  }

  var inProgress;

  return grab;
}();
