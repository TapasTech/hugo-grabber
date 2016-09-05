new Vue({
  el: document.getElementById('app'),
  data: {
    url: null,
    list: [],
  },
  mounted: function () {
    var _this = this;
    chrome.runtime.sendMessage({
      cmd: 'getRuleList',
    }, function (list) {
      _this.list = list;
    });
    chrome.runtime.onMessage.addListener(function (req, _src, _callback) {
      if (req.cmd === 'updateItems') {
        req.data.forEach(function (item) {
          var i = _this.list.findIndex(function (listItem) {
            return listItem.id === item.id;
          });
          if (!item.url) {
            ~i && _this.list.splice(i, 1);
          } else if (i < 0) {
            _this.list.push(item);
          } else {
            Vue.set(_this.list, i, item);
          }
        });
      }
    });
  },
  methods: {
    refresh: function (item) {
      chrome.runtime.sendMessage({
        cmd: 'updateRule',
        data: item.id,
      });
    },
    remove: function (item) {
      confirm('Do you really want to remove it?') &&
      chrome.runtime.sendMessage({
        cmd: 'removeRule',
        data: item.id,
      });
    },
    subscribe: function () {
      var _this = this;
      _this.url && chrome.runtime.sendMessage({
        cmd: 'subscribe',
        data: _this.url,
      }, function () {
        _this.url = null;
      });
    },
    lastCheck: function (item) {
      if (!item.lastCheck) return;
      var d = new Date(item.lastCheck);
      return 'Last updated at: ' + d.toLocaleTimeString();
    },
  },
});
