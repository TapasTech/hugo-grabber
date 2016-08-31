/*
 * Allowed rule types:
 *
 * 1. String: '#js_content'
 *
 *    A selector, the default `_type` will be 'text'.
 *
 * 2. Object: {selector: '#js_content', _type: 'html'}
 *
 *    The detailed mode.
 *
 * 3. Array: ['#media', '#js_content']
 *
 *    Each of them can be a String or Object type rule.
 *
 * 4. Nested array: {_type: 'html', _data: ['#media', '#js_content']}
 *
 *    If `_data` attribute is shown, the `_data` array will be regarded as
 *    Array type rule, with other attributes added to each of them as
 *    additional options.
 *
 */
var rules = [{
  match: url => /^https?:\/\/mp\.weixin\.qq\.com\/s\?/.test(url),
  data: {
    title: 'h2.rich_media_title',
    content: {
      _type: 'html',
      _data: ['#media', '#js_content'],
    },
    origin_website: '#post-user',
    author: '#post-date+.rich_media_meta_text',
    origin_date: '#post-date',
    _image: {
      getElements: 'img',
      getSrc: img => img.dataset.src || img.src,
    },
  },
}];
