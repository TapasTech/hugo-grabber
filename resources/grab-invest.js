[{
  match: '^https?://mp\.weixin\.qq\.com/s\?',
  meta: {
    open: 'https://backend-invest.dtcj.com/draft/columns/_new',
    transform: function (article) {
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
      src: function (img) {return img.dataset.src || img.src;},
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
      value: function (window) {return window.location.href.split('#')[0];},
    },
    compose_organization: {
      value: '第一财经｜CBN',
    },
    author: '#post-date+.rich_media_meta_text',
    origin_date: '#post-date',
  },
}]
