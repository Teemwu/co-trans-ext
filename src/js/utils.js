/* eslint-disable no-unused-vars */
// 动态加载css
function loadCSS(file, id) {
  const linkObj = document.getElementById(id);
  if (linkObj) {
    return;
  }
  const link = document.createElement('link');
  link.href = file;
  link.id = id;
  link.type = 'text/css';
  link.rel = 'stylesheet';
  document.getElementsByTagName('head')[0].appendChild(link);
}

// 移除css
function unloadCSS(id) {
  const cssNode = document.getElementById(id);
  if (cssNode) {
    cssNode.parentNode.removeChild(cssNode);
  }
}

// 获取 query 参数
function getQueryVariable(url, variable) {
  const strArr = new URL(url).search.split('?');
  if (strArr[1]) {
    const query = strArr[1];
    const vars = query.split('&');
    for (let i = 0; i < vars.length; i++) {
      const pair = vars[i].split('=');
      if (pair[0] === variable) {
        return pair[1];
      }
    }
  }
  return undefined;
}
