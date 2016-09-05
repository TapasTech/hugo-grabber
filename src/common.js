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
  window.serialize = serialize;
}();
