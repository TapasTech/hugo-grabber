!function () {
  function serialize(obj) {
    if (typeof obj === 'function') {
      return obj.toString();
    } else if (obj === null || typeof obj !== 'object') {
      return JSON.stringify(obj);
    } else {
      return Array.isArray(obj) ? (
        '[' + obj.map(function (item) {return serialize(item);}).join(',') + ']'
      ) : (
        '{' + Object.keys(obj).map(function (key) {return JSON.stringify(key) + ':' + serialize(obj[key]);}).join(',') + '}'
      );
    }
  }
  function normalize(str, url) {
    function normalizeObject(obj) {
      if (Array.isArray(obj)) return obj.map(normalizeObject);
      if (!obj || typeof obj !== 'object') return obj;
      return Object.keys(obj).reduce(function (res, key) {
        var value = obj[key];
        var m = key.match(reFunc);
        if (m) {
          // no space between parameters is allowed
          var args = m[2].split(',')
            .filter(function (a) {return a;});
          args.push(value);
          res[m[1]] = Function.apply(null, args);
        } else {
          res[key] = normalizeObject(value);
        }
        return res;
      }, {});
    }
    if (reFile.test(url)) return str;
    try {
      var list = JSON.parse(str);
    } catch (e) {
      throw 'JSON data required for remote data!';
    }
    if (!Array.isArray(list)) throw 'Invalid data!';
    return serialize(normalizeObject(list));
  }
  function deserialize(str) {
    try {
      return (0, eval)(str);
    } catch (e) {
      // ignore
    }
  }
  var reFile = /^file:\/\//;
  var reFunc = /^(\w+)\((.*?)\)$/;
  window.serialize = serialize;
  window.deserialize = deserialize;
  window.normalizeRules = normalize;
}();
