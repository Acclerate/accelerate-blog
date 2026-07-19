'use strict';

/**
 * 在生成的 HTML <head> 中注入 <meta name="referrer" content="no-referrer">
 * 解决语雀图片在博客上因 Referer 防盗链显示不出来的问题。
 *
 * 该脚本不动主题文件（主题是通过 npm 安装的，升级会被覆盖）。
 * Hexo 会自动加载 scripts/ 目录下的 .js 文件。
 */

hexo.extend.filter.register('after_render:html', function (str) {
  // 已经有了就不再重复注入
  if (/name=["']referrer["']/i.test(str)) return str;

  // 在 <head> 后面插入 meta；若找不到 head，则附加到文档开头
  if (/<head[^>]*>/i.test(str)) {
    return str.replace(/<head[^>]*>/i, (match) =>
      match + '<meta name="referrer" content="no-referrer" />'
    );
  }
  return '<meta name="referrer" content="no-referrer" />' + str;
});
