const rules = [{
  match: url => url.startsWith('http://mp.weixin.qq.com/s?'),
  data: {
    title: 'h2.rich_media_title',
    content: '#js_content',
    origin_website: '#post-user',
    author: '#post-date+.rich_media_meta_text',
    origin_date: '#post-date',
    _image: {
      els: 'img',
      getSrc: img => img.dataset.src || img.src,
    },
  },
}];
