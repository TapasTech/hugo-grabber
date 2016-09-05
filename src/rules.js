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

var parsedRules = function parseRules(rules) {
  // proto MUST be assigned to the object to make it serializable
  function normalizeRule(rule, proto) {
    // type 1 and 2
    if (Array.isArray(rule)) {
      return rule.reduce((res, item) => {
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
  return rules.map(rule => ({
    match: rule.match,
    meta: rule.meta,
    data: Object.keys(rule.data).reduce((res, key) => {
      var value = rule.data[key];
      res[key] = key.startsWith('_') ? value : normalizeRule(value);
      return res;
    }, {}),
  }));
}([{
  match: url => /^https?:\/\/mp\.weixin\.qq\.com\/s\?/.test(url),
  meta: {
    open: 'https://backend-invest.dtcj.com/draft/columns/_new',
    transform: article => {
      if (~[
        '无马金融',
        'A股探秘',
        '小财技',
        '好有财',
      ].indexOf(article.origin_website)) {
        article.compose_organization = '新钱New Money';
        article.content += '<p>（更多精彩内容，请关注蚂蚁聚宝“新钱NewMoney”）</p>';
      }
    },
    image: {
      el: 'img',
      src: img => img.dataset.src || img.src,
      maxSize: 1024 * 1024,
    },
  },
  data: {
    title: 'h2.rich_media_title',
    content: {
      type: 'html',
      data: ['#media', '#js_content'],
    },
    origin_website: '#post-user',
    origin_url: {
      value: window => window.location.href.split('#')[0],
    },
    compose_organization: {
      value: () => '第一财经｜CBN',
    },
    author: '#post-date+.rich_media_meta_text',
    origin_date: '#post-date',
  },
}]);
