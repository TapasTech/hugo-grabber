/**
* Rules:
*
* - match: {String} url => {Boolean}
*   meta:
*     open: {String} url
*     transform: {Object} => {Object}
*     image:
*       el: {String} selector
*       src: {HTMLImage} img => {String}
*       maxSize: 1024 * 1024
*   data:
*     {String} fieldType1:
*       - type: {String: ['text' | 'html']} type
*         value: () => {String}
*         sel: {String}
*         transform: {String} => {String}
*         data: {Array} subdata
*     {String} fieldType2:
*       - fieldType 3 or 4
*       - ...
*     {String} fieldType3:
*       type: {String: ['text' | 'html']} type
*       sel: {String}
*       ...
*     {String} fieldType4:
*       {String} selector
* - ...
*
*/

window.parseRules = function parseRules(rules) {
  // proto MUST be assigned to the object to make it serializable
  function normalizeRule(rule, proto) {
    // type 1 and 2
    if (Array.isArray(rule)) {
      return rule.reduce(function (res, item) {
        res = res.concat(normalizeRule(item, proto));
        return res;
      }, []);
    }
    // type 4
    if (typeof rule === 'string') {
      return [Object.assign({sel: rule}, proto)];
    }
    // type 3
    var meta = Object.assign({}, rule, {data: null}, proto);
    return Array.isArray(rule.data) ? normalizeRule(rule.data, meta) : [meta];
  }
  return rules.map(function (rule) {
    return {
      match: rule.match,
      meta: rule.meta,
      data: Object.keys(rule.data).reduce(function (res, key) {
        var value = rule.data[key];
        res[key] = key.startsWith('_') ? value : normalizeRule(value);
        return res;
      }, {}),
    };
  });
};
