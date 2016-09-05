new Vue({
  el: document.getElementById('app'),
  data: {
    url: null,
    list: [],
  },
  mounted() {
    var _this = this;
    chrome.runtime.sendMessage({
      cmd: 'getRuleList',
    }, function (list) {
      _this.list = list;
    });
    chrome.runtime.onMessage.addListener(function (req, src, callback) {
      if (req.cmd === 'updateItems') {
        req.data.forEach(function (item) {
          var i = _this.list.findIndex(function (listItem) {
            return listItem.id === item.id;
          });
          if (i < 0) {
            _this.list.push(item);
          } else {
            Vue.set(_this.list, i, item);
          }
        });
      }
    });
  },
  methods: {
    refresh(item) {
      chrome.runtime.sendMessage({
        cmd: 'updateRule',
        data: item.id,
      });
    },
    remove(item) {
      chrome.runtime.sendMessage({
        cmd: 'removeRule',
        data: item.id,
      });
    },
    subscribe() {
      var _this = this;
      chrome.runtime.sendMessage({
        cmd: 'subscribe',
        data: _this.url,
      }, function () {
        _this.url = null;
      });
    },
  },
});
