const data = new extData();

function init() {
  // 显示当前是否启用分析
  data.get('isEnabledAnalytics', val => {
    $('#isEnabledAnalytics').attr('checked', val);
  });
}

init();

$('#isEnabledAnalytics').change(event => {
  const checked = event.target.checked;
  data.set('isEnabledAnalytics', checked);
});

// 接收iframe内部通过postMessage传递过来的数据
window.addEventListener('message', function(event) {
  if (event.data.iframeHeight) {
    if (event.data.iframeHeight < 400) {
      $('.reward__list').height(event.data.iframeHeight);
    } else {
      $('.reward__list').height(400);
    }
  }
});
