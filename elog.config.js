/**
 * Elog 配置：语雀 → Hugo content/posts/yuque/
 *
 * 适配 Hugo + Linewise 主题：
 *   - front matter 用 YAML 格式（Hugo 原生支持，Linewise 也兼容）
 *   - 包含 Linewise 主题需要的 title / date / tags / description
 *   - slug 转小写连字符，方便 Hugo 自动生成 URL
 *
 * 文档：https://elog.1874.cool
 */

const { writeFileSync } = require('fs');
const { join } = require('path');

module.exports = {
  write: {
    /**
     * 页面类型：用于区分 Markdown / 目录 / 资源文件
     * 这里所有文档都按 Markdown 处理
     */
    pageNameMode: 'slug',
    /**
     * 输出目录：Hugo 的 content/posts/yuque/
     * 与手写文章 (content/posts/) 分开，方便管理
     */
    dir: 'content/posts/yuque',
    /**
     * 文件名样式：title（用文章标题做文件名）
     * 也可选 slug
     */
    filename: 'title',
    /**
     * 输出的 Markdown front matter 格式
     * Hugo 原生支持 YAML，Linewise 主题也兼容
     */
    format: {
      frontMatter: 'yaml',
      content: 'markdown',
    },
    /**
     * 路径拼接：false 表示直接落到 dir 下，不再加子路径
     */
    catalog: false,
    /**
     * 生成 Markdown 时是否包含 body 内容
     */
    bodyDoc: true,
  },

  deploy: {
    // 语雀账号密码模式（免费，不需会员）
    // 注意：账号密码模式只适合本地同步，不要在 GitHub Actions 等
    //       海外 CI 环境使用（会被语雀风控当成海外登录）
    // 如果你有语雀超级会员并想用 CI 自动同步，可改回 Token 模式：
    //   type: 'yuque' + token: process.env.YUQUE_TOKEN
    type: 'yuque-pwd',
    yuquePwd: {
      // 用户名（一般是手机号，如 13800138000）
      username: process.env.YUQUE_USERNAME,
      // 登录密码
      password: process.env.YUQUE_PASSWORD,
      // 知识库 login（个人路径，如 acclerate）
      login: process.env.YUQUE_LOGIN,
      // 知识库 repo（知识库短地址，如 blog）
      repo: process.env.YUQUE_REPO,
      // 只同步已发布文章
      onlyPublished: true,
      // 只同步公开文章（false 表示私有也同步）
      onlyPublic: false,
    },
  },

  docs: {
    // 文档适配处理器：在写入前调整 front matter，确保 Hugo 兼容
    adapter: [
      async (doc) => {
        // ===== 1. 生成 Hugo / Linewise 兼容的 front matter =====
        const frontmatter = {
          title: doc.title || 'Untitled',
          // 语雀返回的时间是毫秒时间戳，转成 ISO 8601 字符串
          date: doc.created_at
            ? new Date(doc.created_at).toISOString()
            : new Date().toISOString(),
          // 描述（用于 SEO 和 Linewise 文章列表显示）
          description: doc.description || doc.title || '',
          // 标签（Linewise 主题用）
          tags: Array.isArray(doc.tags) ? doc.tags.map((t) => t.name || t) : [],
          // 草稿状态（语雀 onlyPublished=true 时这里始终 false）
          draft: false,
          // 自定义参数：标记来源
          source: 'yuque',
          // 语雀文档 ID，便于增量同步
          doc_id: doc.doc_id || '',
        };

        // 把构建好的 front matter 写到 doc 对象上
        // Elog 会根据 format.frontMatter=yaml 自动转成 YAML 块
        doc.attributes = frontmatter;

        // ===== 2. 简单清理正文 =====
        // 语雀导出的 Markdown 偶尔带一些多余标记，这里统一处理

        // 移除语雀自动加的文档头（如有）
        if (doc.body_original) {
          // 保留原始 body，避免破坏语雀的特殊语法
        }

        return doc;
      },
    ],
  },

  image: {
    // 图片处理：语雀图片有防盗链，在 Cloudflare 上可能加载不出来
    // 这里暂不启用图床（保持原 URL），靠 no-referrer meta 解决
    // 如需启用，参考 https://elog.1874.cool/image/cos
    enable: false,
  },

  cache: {
    // 增量同步的缓存文件（不进 git，见 .gitignore）
    path: 'elog.cache.json',
  },
};
