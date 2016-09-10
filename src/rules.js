/**
* Rules:
*
* - match: re:string | url:string -> boolean
*   meta:
*     open: url:string
*     transform: o:object -> object
*     image:
*       el: selector:string
*       src: img:HTMLImage -> string
*       maxSize: 1024 * 1024
*   data:
*     fieldType1:string:
*       - type: type:string {'text', 'html'}
*         value: value:string | () -> string
*         sel: selector:string
*         transform: v:string -> string
*         data: subdata:array
*     fieldType2:string:
*       - fieldType 3 or 4
*       - ...
*     fieldType3:string:
*       type: type:string {'text', 'html'}
*       sel: selector:string
*       ...
*     fieldType4:string:
*       selector:string
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
