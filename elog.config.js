/**
 * Elog 配置：语雀 → Hugo content/posts/yuque/
 *
 * 适配 Hugo + Linewise 主题：
 *   - front matter 用 YAML 格式（Hugo 原生支持，Linewise 也兼容）
 *   - 包含 Linewise 主题需要的 title / date / tags / description
 *   - 输出到 content/posts/yuque/，与手写文章隔离
 *   - 自动打标签（基于标题/内容关键词匹配）
 *
 * 文档：https://elog.1874.cool
 * 版本：@elog/cli 0.12.x
 */

const { autoTag } = require('./scripts/auto-tagger');

module.exports = {
  // ===== 写作平台：从哪里拉文章 =====
  write: {
    platform: 'yuque-pwd',
    // ⚠️ 注意：key 必须是 'yuque-pwd'（连字符），不是 yuquePwd（驼峰）
    // Elog 内部用 config.write['yuque-pwd'] 读取
    'yuque-pwd': {
      // 用户名（手机号）
      username: process.env.YUQUE_USERNAME,
      // 登录密码
      password: process.env.YUQUE_PASSWORD,
      // 知识库 login（个人路径）
      login: process.env.YUQUE_LOGIN,
      // 知识库 repo（短地址）
      repo: process.env.YUQUE_REPO,
      // 只同步已发布文章
      onlyPublished: true,
      // 只同步公开文章（false 表示私有也同步）
      onlyPublic: false,
    },
  },

  // ===== 部署平台：写到哪里 =====
  deploy: {
    platform: 'local',
    local: {
      // 输出目录：Hugo 的 content/posts/yuque/
      outputDir: 'content/posts/yuque',
      // 文件名样式：title（用文章标题做文件名）
      filename: 'title',
      // 输出格式：matter-markdown = 带 front matter 的 Markdown
      format: 'matter-markdown',
      // 不按语雀目录结构嵌套，全部平铺到 outputDir 下
      catalog: false,
      // front matter 配置
      frontMatter: {
        enable: true,
      },
      // 自定义格式化器：把文章的 body 原样返回，
      // 但在 front matter 里注入自动打的 tags
      formatExt: (doc) => {
        // 基于标题 + 正文前 500 字打标签
        const tags = autoTag(doc.title, (doc.body_original || doc.body || '').slice(0, 500));

        // 把 tags 写到 doc 上，Elog 会序列化到 front matter
        // 注意：原有的 title/date/urlname 等字段 Elog 会自动保留
        if (!doc.properties) doc.properties = {};
        doc.properties.tags = tags;

        // 补 description（如果缺失）
        if (!doc.properties.description) {
          doc.properties.description = doc.title;
        }

        return doc;
      },
    },
  },

  // ===== 拓展配置 =====
  extension: {
    // 缓存路径（用于增量同步，不进 git）
    cachePath: 'elog.cache.json',
  },
};
