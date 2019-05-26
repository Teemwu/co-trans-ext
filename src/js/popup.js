const data = new ExtData();
const transExt = $('.trans-ext__popup');
const transIframe = $('.trans-ext__iframe');
let keyword = '';

// 加载图标
loadCSS(chrome.extension.getURL('src/css/iconfont/iconfont.css'), 'iconfont');

data.get('transTool', (val) => {
  data.get(val, (val2) => {
    transIframe.attr(
      'src',
      val2.replace('KEYWORD', '').replace('SHOWDETAIL', true)
    );
  });
});

// 获取并高亮当前使用的搜索工具
data.get('transTool', (val) => {
  const activeTransTool = transExt.find(
    `.trans-ext__tool[data-trans-tool=${val}]`
  );

  activeTransTool.addClass('active');
});

// 添加搜索工具图标点击事件
transExt.find('.trans-ext__tool').click((event) => {
  const transTool = $(event.target).data('trans-tool');
  transIframe.eq(0)[0].contentWindow.postMessage({ changeTransTool: transTool }, '*');
  ga('send', 'event', 'trans-tool', 'change', transTool);
});

// 获取 iframe 内输入值后切换 翻译
window.addEventListener('message', (event) => {
  const transTool = event.data.changeTransTool;
  if (transTool) {
    keyword = event.data.keyword;
    transExt.find('.trans-ext__tool').removeClass('active');
    transExt
      .find(`.trans-ext__tool[data-trans-tool=${transTool}]`)
      .addClass('active');
    data.set('transTool', transTool);
    data.get('transTool', (val) => {
      data.get(val, (val2) => {
        transIframe.attr(
          'src',
          val2.replace('KEYWORD', keyword).replace('SHOWDETAIL', true)
        );
      });
    });
  }
});

// 网页翻译
transExt.find('.trans-ext__trans-page-tool').click((event) => {
  const transTool = $(event.target).data('trans-tool');
  ga('send', 'event', 'page-trans-tool', 'translate', transTool);
  chrome.tabs.getSelected(null, (tab) => {
    if (transTool === 'yandex') {
      window.open(
        `https://translate.yandex.com/translate?url=${tab.url}&lang=en-zh`
      );
    } else if (transTool === 'youdao') {
      // 有道网页翻译
      chrome.tabs.executeScript(tab.id, {
        file: 'src/lib/youdao-web-translate/web2/seed.js'
      });
      chrome.tabs.insertCSS(tab.id, {
        file: 'src/lib/youdao-web-translate/web2/styles/cover.css'
      });
    }
  });
});