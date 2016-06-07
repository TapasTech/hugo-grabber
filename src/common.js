function serialize(obj) {
  if (typeof obj === 'function') {
    return obj.toString();
  } else if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  } else {
    return Array.isArray(obj) ? (
      '[' + obj.map(item => serialize(item)).join(',') + ']'
    ) : (
      '{' + Object.keys(obj).map(key => JSON.stringify(key) + ':' + serialize(obj[key])).join(',') + '}'
    );
  }
}
