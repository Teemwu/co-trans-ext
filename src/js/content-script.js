/* eslint-disable max-len */
/** ******************* 插件用到的元素模板 *************** */
// 插件注入的页面结构
const transExt = $(`
<co-div class="trans-ext">
  <co-div class="trans-ext__trans-btn"></co-div>
  <co-div class="trans-ext__popup-arrow">
    <co-div></co-div>
    <co-div></co-div>
  </co-div>
  <co-div class="trans-ext__popup">
    <co-div class="trans-ext__title-bar">
      <co-div class="trans-ext__title-center">
        <co-i class="co-iconfont co-icon-sogou trans-ext__tool" data-trans-tool="sogou" title="搜狗翻译"></co-i>
        <co-i class="co-iconfont co-icon-baidu trans-ext__tool" data-trans-tool="baidu" title="百度翻译"></co-i>
        <co-i class="co-iconfont co-icon-youdao trans-ext__tool" data-trans-tool="youdao" title="有道翻译"></co-i>
        <co-i class="co-iconfont co-icon-kingsoft trans-ext__tool" data-trans-tool="kingsoft" title="金山词霸"></co-i>
        <co-i class="co-iconfont co-icon-google1 trans-ext__tool" data-trans-tool="google" title="谷歌翻译"></co-i>
      </co-div>
      <co-div class="trans-ext__title-right">
        <co-i class="co-iconfont co-icon-zhankai1 trans-ext__tool-down" title="显示更多"></co-i>
        <co-i class="co-iconfont co-icon-shouqi trans-ext__tool-up" title="收起更多"></co-i>
        <co-i class="co-iconfont co-icon-xiangyoujiantou trans-ext__tool-right" title="固定到右边"></co-i>
        <co-i class="co-iconfont co-icon-xiangzuojiantou-copy trans-ext__tool-left" title="固定到左边"></co-i>
        <co-i class="co-iconfont co-icon-suoxiao1 trans-ext__tool-position" title="取消固定"></co-i>
        <co-i class="co-iconfont co-icon-guanbi trans-ext__tool-close" title="关闭"></co-i>
      </co-div>
    </co-div>
    <iframe class="trans-ext__iframe"></iframe>
  </co-div>
</co-div>
`);

/** ******************** 初始化相关 ********************** */

// 存储选中的文本内容
let selectedText;
// 获取数据操作对象
const data = new ExtData();

// 弹窗移动相关数据
// 翻译弹窗的移动
let isMoving = false;

// 当前是否处于固定右侧状态
let isLockPosition = false;

// 移入翻译图标相关数据
let hoverTimeoutId;
let isTriggerByHover = false;

// 打开弹窗延时，避免hover弹出时点击导致弹窗隐藏
let waitingForPopupShow = false;

// 后续需要操作的相关元素
const transBtn = transExt.find('.trans-ext__trans-btn');
transBtn.hide();
const transPopup = transExt.find('.trans-ext__popup');
transPopup.hide();
const transIframe = transExt.find('.trans-ext__iframe');
const arrow = transExt.find('.trans-ext__popup-arrow');
arrow.hide();
// 默认显示展开按钮
transExt.find('.trans-ext__tool-up').hide();
// 默认显示 固定到右侧按钮
transExt.find('.trans-ext__tool-left').hide();
transExt.find('.trans-ext__tool-position').hide();

// 获取并高亮当前使用的搜索工具
data.get('transTool', (val) => {
  const activeTransTool = transExt.find(
    `.trans-ext__tool[data-trans-tool=${val}]`
  );

  activeTransTool.addClass('active');
});

/** ************************ 事件处理 ********************** */

// 谷歌分析
function ga(...args) {
  args.push({
    page: '/'
  });
  chrome.extension.sendRequest({
    ga: args
  });
}

// iframe 加载超时处理
let iframeTimer;
const IFRAME_TIMEOUT = 6000;
function iframeTimeOut() {
  // eslint-disable-next-line no-console
  console.log('iframe加载超时了');
  window.stop();
}
function startLoadIframe() {
  // 超时处理
  iframeTimer = setTimeout(iframeTimeOut, IFRAME_TIMEOUT);
  transIframe[0].onload = () => {
    clearTimeout(iframeTimer);
  };
}

// 切换是否显示输入内容、翻译语言切换等界面元素
transExt.find('.trans-ext__tool-down').click(() => {
  ga('send', 'event', 'input-view', 'show');
  transIframe.eq(0)[0].contentWindow.postMessage(
    {
      op: 'showDetail'
    },
    '*'
  );
  transExt.find('.trans-ext__tool-down').hide();
  transExt.find('.trans-ext__tool-up').show();
});
transExt.find('.trans-ext__tool-up').click(() => {
  ga('send', 'event', 'input-view', 'hide');
  transIframe.eq(0)[0].contentWindow.postMessage(
    {
      op: 'hideDetail'
    },
    '*'
  );
  transExt.find('.trans-ext__tool-down').show();
  transExt.find('.trans-ext__tool-up').hide();
});

// 固定到右边
transExt.find('.trans-ext__tool-right').click(() => {
  ga('send', 'event', 'lock-right', 'lock');
  isLockPosition = true;
  transExt.find('.trans-ext__tool-right').hide();
  transExt.find('.trans-ext__tool-left').show();
  $('html').addClass('co-transition').addClass('co-fixed-r');
  arrow.hide();
});
// 固定到左边
transExt.find('.trans-ext__tool-left').click(() => {
  ga('send', 'event', 'lock-left', 'lock');
  transExt.find('.trans-ext__tool-left').hide();
  transExt.find('.trans-ext__tool-position').show();
  $('html').removeClass('co-fixed-r').addClass('co-fixed-l');
  arrow.hide();
});

// 样式初始化
function resetStyle() {
  isLockPosition = false;
  transExt.find('.trans-ext__tool-left').hide();
  transExt.find('.trans-ext__tool-position').hide();
  transExt.find('.trans-ext__tool-right').show();
  $('html').removeClass('co-fixed-r co-fixed-l');
  setTimeout(() => {
    $('html').removeClass('co-transition');
  }, 200);
}

// 取消固定
transExt.find('.trans-ext__tool-position').click(() => {
  transPopup.css({
    top: $(document).scrollTop(),
    left: '0'
  });
  resetStyle();
});

// 处理拖动过程中事件可能被iframe捕获而丢失事件的问题
// https://blog.csdn.net/zgrbsbf/article/details/71423401
function setIsMoving(moving) {
  isMoving = moving;
  if (moving) {
    transIframe.css('pointer-events', 'none');
  } else {
    transIframe.css('pointer-events', 'auto');
  }
}

// 关闭 popup 的相关操作
function handleClosePopup() {
  // 如果没有选中文本，确保隐藏插件内容
  transBtn.hide();
  transPopup.hide();
  arrow.hide();
  transIframe.attr('src', '');
  resetStyle();

  // 恢复是否显示详情的箭头
  transExt.find('.trans-ext__tool-down').show();
  transExt.find('.trans-ext__tool-up').hide();

  setIsMoving(false);

  isTriggerByHover = false;
}

// 切换翻译工具
let changeTransToolTimer;
function changeTransTool(transTool, keyword) {
  clearTimeout(changeTransToolTimer);
  clearTimeout(iframeTimer);
  // 切换后先清空页面
  transIframe.attr('src', '');

  // 避免页面错误时丢失 keyword 的问题
  selectedText = keyword || selectedText;
  transExt.find('.trans-ext__tool').removeClass('active');
  transExt
    .find(`.trans-ext__tool[data-trans-tool=${transTool}]`)
    .addClass('active');
  data.set('transTool', transTool);
  data.get(transTool, (val) => {
    let iframeURL = val;
    iframeURL = iframeURL.replace('KEYWORD', encodeURIComponent(selectedText));
    iframeURL = iframeURL.replace(
      'SHOWDETAIL',
      transExt.find('.trans-ext__tool-up').is(':visible')
    );
    startLoadIframe();
    transIframe.attr('src', iframeURL);
  });
}


// 监听关闭 popup 按钮点击事件
transExt.find('.trans-ext__tool-close').click(handleClosePopup);

// 监听 popup 中翻译切换图标的点击事件
transExt.find('.trans-ext__tool').click((event) => {
  const transTool = $(event.target).data('trans-tool');
  // 避免 iframe 内页面出现异常、跳转验证页面等导致 iframe-message.js 无法加载进而导致无法切换其它翻译的问题
  changeTransToolTimer = setTimeout(() => {
    changeTransTool(transTool, '');
  }, 200);
  transIframe.eq(0)[0].contentWindow.postMessage({ changeTransTool: transTool }, '*');
  ga('send', 'event', 'trans-tool', 'change', transTool);
});

// 获取 iframe 内输入值后切换 翻译
window.addEventListener('message', (event) => {
  const transTool = event.data.changeTransTool;
  if (transTool) {
    selectedText = event.data.keyword;
    changeTransTool(transTool, selectedText);
  }
});

// 点击翻译按钮时防止划选的文本消失掉
transExt.on('mousedown mouseup', (event) => {
  event.preventDefault();
  event.stopPropagation();
});

// 获取所选内容边界
// 参考 https://stackoverflow.com/questions/12603397/calculate-width-height-of-the-selected-text-javascript
function getSelectionDimensions() {
  let sel = document.selection;
  let range;
  let width = 0;
  let height = 0;
  let top = 0;
  let left = 0;
  let special = false;
  if (sel) {
    if (sel.type !== 'Control') {
      range = sel.createRange();
      width = range.boundingWidth;
      height = range.boundingHeight;
      top = range.boundingTop;
      left = range.boundingLeft;
    }
  } else if (window.getSelection) {
    sel = window.getSelection();
    if (sel.rangeCount) {
      range = sel.getRangeAt(0).cloneRange();
      if (range.getBoundingClientRect) {
        const rect = range.getBoundingClientRect();
        width = rect.right - rect.left;
        height = rect.bottom - rect.top;
        top = rect.top;
        left = rect.left;
      }
    }
  }
  // input 和 area 获取不到位置信息，需要特别处理
  if (width === 0 && height === 0) {
    width = transBtn.width();
    height = transBtn.height();
    // 获取transBtn位置并减去transBtn的偏移
    top = transBtn.position().top - $(document).scrollTop() - 15;
    left = transBtn.position().left - $(document).scrollLeft() - 15;
    special = true;
  }
  return {
    width, height, top, left, special
  };
}

// 计算 popup 初始位置
function calcInitPopupPosition() {
  const arrowChilds = transExt.find('.trans-ext__popup-arrow>co-div');
  const arrowChild = transExt.find('.trans-ext__popup-arrow>co-div:last-child');
  const selectedRect = getSelectionDimensions();
  // 相对于浏览器的中心点位置
  const selectedCenter = {
    x: selectedRect.left + selectedRect.width / 2,
    y: selectedRect.top + selectedRect.height / 2
  };
  const arrowHeight = 8;
  const arrowWidth = 16;

  // 假设选中文字下方空间足够容纳弹窗
  let popTop = $(document).scrollTop() + selectedRect.top + selectedRect.height + arrowHeight;
  let popLeft = $(document).scrollLeft() + selectedRect.left + (selectedRect.width - transPopup.width()) / 2;
  let arrowTop = popTop - arrowHeight;

  // 选中文本下部能否放下弹窗
  const canPlaceBottom = selectedRect.top + selectedRect.height + transPopup.height() < window.innerHeight;
  const canPlaceTop = selectedRect.top > transPopup.height();
  if (!canPlaceBottom && canPlaceTop) {
    // 下方放不下弹窗，定位到上方
    popTop = $(document).scrollTop() + selectedRect.top - transPopup.height() - arrowHeight;
    arrowTop = $(document).scrollTop() + selectedRect.top - arrowHeight;
    arrowChilds.css({ transform: 'rotate(180deg)' });
    arrowChild.css({
      borderColor: 'rgb(255, 255, 255) transparent',
      top: '-1px'
    });
  } else {
    arrowChilds.css({ transform: 'rotate(0deg)' });
    arrowChild.css({
      borderColor: `${transExt.find('.trans-ext__title-bar').css('background-color')} transparent`,
      top: '1px'
    });
  }

  // 左边是否能容纳弹窗
  const disableLeft = selectedCenter.x < transPopup.width() / 2;
  if (disableLeft) {
    popLeft = $(document).scrollLeft() + selectedCenter.x - arrowWidth;
  }

  // 右边是否能容纳弹窗
  const disableRigth = selectedCenter.x > window.innerWidth - transPopup.width() / 2;
  if (disableRigth) {
    popLeft = $(document).scrollLeft() + selectedCenter.x - transPopup.width() + arrowWidth;
  }

  // 弹出位置
  transPopup.css({
    top: popTop,
    left: popLeft
  });

  // arrow 位置
  arrow.css({
    top: arrowTop,
    left: selectedCenter.x + $(document).scrollLeft()
  });

  // 弹出翻译窗，隐藏翻译按钮
  transBtn.hide();
  transPopup.show();
  arrow.show();
}

// 移入翻译按钮 500ms 自动弹出
transBtn.mouseenter(() => {
  hoverTimeoutId = setTimeout(() => {
    isTriggerByHover = true;
    transBtn.mouseup();
    waitingForPopupShow = true;
    // 设置延时，避免刚好弹出时用户点击而又没有点击中弹窗的情况
    setTimeout(() => {
      waitingForPopupShow = false;
    }, 700);
  }, 500);
});

transBtn.mouseleave(() => {
  clearTimeout(hoverTimeoutId);
});

// 点击“译”字显示翻译内容页 popup
transBtn.mouseup((event) => {
  clearTimeout(hoverTimeoutId);
  event.stopPropagation();
  ga('send', 'pageview');
  if (isTriggerByHover) {
    ga('send', 'event', 'trans-button', 'hover-translate');
  } else {
    ga('send', 'event', 'trans-button', 'translate');
  }
  // 加载图标
  loadCSS(chrome.extension.getURL('src/css/iconfont/iconfont.css'), 'iconfont');

  data.get('transTool', (val) => {
    // 初始化并设置active
    transExt.find('.trans-ext__tool').removeClass('active');
    const activeTransTool = transExt.find(
      `.trans-ext__tool[data-trans-tool=${val}]`
    );
    activeTransTool.addClass('active');

    data.get(val, (val2) => {
      startLoadIframe();
      transIframe.attr(
        'src',
        val2
          .replace('KEYWORD', encodeURIComponent(selectedText))
          .replace('SHOWDETAIL', false)
      );
    });
  });
  calcInitPopupPosition(event);
});

// 监听是否需要显示译字或者隐藏popup等
$(document).mouseup((event) => {
  // 测试发现：选中文本后，再次keyup选中区域内内容才取消选中，keydown选中区域外内容马上取消选中
  // 猜测：这是为了处理拖拽选中内容而这样设计的吧
  // 异步获取选中的文本（会产生适当的延时），避免再次点击上次选中文本区域内时获取到上次选中内容的情况
  setTimeout(() => {
    // 获取选中的文本
    selectedText = window
      .getSelection()
      .toString()
      .trim();
    if (isLockPosition) {
      if (selectedText) {
        // 直接翻译
        data.get('transTool', (transTool) => {
          data.get(transTool, (val) => {
            let iframeURL = val;
            iframeURL = iframeURL.replace('KEYWORD', encodeURIComponent(selectedText));
            iframeURL = iframeURL.replace(
              'SHOWDETAIL',
              transExt.find('.trans-ext__tool-up').is(':visible')
            );
            startLoadIframe();
            transIframe.attr('src', iframeURL);
          });
        });
      }
      return;
    }

    if (selectedText) {
      // 如果有选中的文本，显示“译”按钮
      if (!$('body').find(transExt).length) {
        $('body').append(transExt);
      }

      transBtn.css({
        top: event.pageY + 15,
        left: event.pageX + 15
      });
      transPopup.hide();
      arrow.hide();
      transIframe.attr('src', '');
      transBtn.show();
    } else if (!waitingForPopupShow) {
      handleClosePopup();
    }
  }, 0);
});

/** ******************** popup 拖拽处理 ********************** */
let startX = 0;
let startY = 0;
let startTop = 0;
let startLeft = 0;

// popup 拖拽开始
$(transPopup).on('mousedown', '.trans-ext__title-bar', (event) => {
  if (isLockPosition || !$(event.target).hasClass('trans-ext__title-bar')) {
    return;
  }
  setIsMoving(true);
  startX = event.clientX;
  startY = event.clientY;
  startTop = transPopup.position().top;
  startLeft = transPopup.position().left;
});

// popup 拖拽过程中
$(document).on('mousemove', (event) => {
  if (isMoving) {
    const moveX = event.clientX - startX;
    const moveY = event.clientY - startY;

    // 避免出现滚动条
    let maxWidth = $(document.body).width();
    let maxHeight = $(document.body).height();
    if (maxWidth < $(window).width()) {
      maxWidth = $(window).width();
    }
    if (maxHeight < $(window).height()) {
      maxHeight = $(window).height();
    }

    let realTopPos = startTop + moveY;
    let realLeftPos = startLeft + moveX;

    const heightDiff = realTopPos + transPopup.height() - maxHeight;
    const widthDiff = realLeftPos + transPopup.width() - maxWidth;

    if (heightDiff > 0) {
      realTopPos -= heightDiff;
    }

    if (widthDiff > 0) {
      realLeftPos -= widthDiff;
    }
    transPopup.css({
      top: realTopPos,
      left: realLeftPos
    });
    // 移动时，隐藏箭头
    if (Math.abs(moveX) > 0 || Math.abs(moveY) > 0) {
      arrow.hide();
    }
  }
});

// popup 拖拽结束
$(document).on('mouseup', () => {
  setIsMoving(false);
});
// popup 拖拽结束
// transPopup事件已经被阻止冒泡了，所以，document监听不到，需要额外监听
$(transPopup).on('mouseup', () => {
  setIsMoving(false);
});
