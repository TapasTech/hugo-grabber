window.grab = window.grab || function () {
  function cleanHTML(html, meta) {
    var imageRule = Object.assign({
      el: 'img[src]',
      src: function (img) {return img.src;},
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
    ignoreTags.forEach(function (tag) {
      Array.prototype.forEach.call(div.querySelectorAll(tag), function (el) {el.remove();});
    });
    if (!imageRule.el) return div.innerHTML;
    var els = typeof imageRule.el === 'string' ? div.querySelectorAll(imageRule.el) : imageRule.el(div);
    return Promise.all(Array.prototype.map.call(els, function (img) {
      return fetch(imageRule.src(img))
      .then(function (res) {return res.blob();})
      .then(function (blob) {return blob.size > imageRule.maxSize ? Promise.reject() : blob;})
      .then(function (blob) {
        return new Promise(function (resolve, reject) {
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
        });
      })
      .catch(function () {img.remove();});
    })).then(function () {return div.innerHTML;});
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
    return Promise.all(group.map(function (item) {return extractOne(item, meta);}))
    .then(function (contents) {
      return contents.filter(function (content) {return content;}).join('\n');
    });
  }

  function grab(rule) {
    if (inProgress) return;
    var finish = showHint();
    var meta = rule.meta;
    var data = rule.data;
    inProgress = true;
    var promises = Object.keys(data)
    .filter(function (key) {return key[0] !== '_';})
    .map(function (key) {
      return extract(data[key], meta)
      .then(function (data) {
        return [key, data];
      }, function (err) {
        console.warn(err);
      });
    });
    Promise.all(promises)
    .then(function (pairs) {
      return pairs.reduce(function (res, item) {
        res[item[0]] = item[1];
        return res;
      }, {});
    })
    .then(function (article) {
      if (meta.transform) article = meta.transform(article) || article;
      chrome.runtime.sendMessage({
        cmd: 'grabbed',
        data: {
          open: meta.open,
          article: article,
        },
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
      setTimeout(function () {div.remove();}, 3000);
    };
  }

  var inProgress;

  return grab;
}();
