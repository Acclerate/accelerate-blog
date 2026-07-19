# Accelerate Blog

> 基于 Hexo + Cloudflare Pages 的个人博客，文章在语雀上写作，每日自动同步。

## ✨ 特性

- 📝 **语雀写作**：在语雀编辑器里写文章，自动同步到博客
- 🤖 **自动同步**：GitHub Actions 每日 UTC 00:00（北京时间 08:00）自动拉取语雀文章
- 🌐 **Cloudflare 部署**：全球 CDN，自带 HTTPS
- 🖼️ **图片防盗链已处理**：自动注入 `no-referrer` meta
- 🎯 **增量同步**：只拉取已发布的文章（`onlyPublished: true`）

## 🏗️ 架构

```
┌────────┐  每日 08:00   ┌─────────────────┐  push  ┌──────────┐ rebuild ┌────────────┐
│  语雀   │ ────────────▶│ GitHub Actions  │ ─────▶│  GitHub  │ ──────▶│ Cloudflare │
│ (写作) │    cron 触发  │ + yuque-hexo    │ commit│  main 分支│  自动  │   Pages    │
└────────┘               └─────────────────┘       └──────────┘        └────────────┘
                                                                              │
                                                                              ▼
                                                                   https://accelerate-blog.pages.dev
```

## 🔧 本地开发

```bash
# 安装依赖
npm install

# 本地预览（http://localhost:4000）
npm run server

# 手动从语雀同步文章（需要先设置 YUQUE_TOKEN 环境变量）
export YUQUE_TOKEN=你的语雀token   # Windows: set YUQUE_TOKEN=xxx
npm run sync

# 构建
npm run build
```

## ⚙️ 初次部署 Checklist

> ⚠️ 本仓库的 `package.json` 中 `yuqueConfig.login` 和 `repo` 是占位符，**必须替换为你自己的语雀信息**！

### 1. 获取语雀信息

1. 登录 [语雀](https://www.yuque.com/)
2. 点你的头像 → **设置** → **Token** → 新建 Token（个人版也可，权限可全选）
3. 在你的知识库页面，URL 形如 `https://www.yuque.com/<login>/<repo>`，记下 `login` 和 `repo`
   - 例：`https://www.yuque.com/acclerate/blog` → `login=acclerate`, `repo=blog`

### 2. 替换 package.json 中的占位符

```jsonc
"yuqueConfig": {
  ...
  "login": "acclerate",  // ← 替换
  "repo": "blog",        // ← 替换
  ...
}
```

### 3. 配置 GitHub Secret

仓库 → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**：

| Name | Value |
|---|---|
| `YUQUE_TOKEN` | 你的语雀 Token |

### 4. 开启 Actions 写权限

仓库 → **Settings** → **Actions** → **General** → **Workflow permissions** → 选 **Read and write permissions**

### 5. 配置 Cloudflare Pages

参考博客文章：[使用 Cloudflare 部署 GitHub 仓库里的静态项目](https://sod-momas.pages.dev/posts/%E4%BD%BF%E7%94%A8cloudflare%E9%83%A8%E7%BD%B2github%E4%BB%93%E5%BA%93%E9%87%8C%E7%9A%84%E9%9D%99%E6%80%81%E9%A1%B9%E7%9B%AE/)

| 字段 | 值 |
|---|---|
| Project name | `accelerate-blog` |
| Production branch | `main` |
| Framework preset | Hexo |
| Build command | `npm run build` |
| Build output directory | `public` |
| Environment variable | `NODE_VERSION = 22` |

## 🚀 日常使用

### 写新文章

1. 在语雀知识库发布一篇文章
2. 等待第二天 08:00 自动同步，**或**
3. GitHub 仓库 → **Actions** → **Sync Yuque Posts** → **Run workflow** 手动触发

### 手动本地同步

```bash
set YUQUE_TOKEN=xxx
npm run clean:yuque
npm run sync
npm run server  # 本地预览
```

## 📂 目录结构

```
accelerate-blog/
├── .github/workflows/
│   └── sync-yuque.yml       # 语雀自动同步 workflow
├── scripts/
│   └── no-referrer.js       # 图片防盗链处理（注入 meta）
├── source/
│   └── _posts/
│       ├── hello-world.md   # Hexo 默认示例
│       ├── my-first-post.md # 第一篇手写文章
│       └── yuque/           # ← 语雀同步的文章会落到这里（自动创建）
├── _config.yml              # Hexo 主配置
├── package.json             # 包含 yuqueConfig 配置
└── README.md
```

## 🛠️ 常见问题

### Q: Actions 跑了但没拉到文章？
检查：
1. `YUQUE_TOKEN` Secret 是否配置
2. `package.json` 的 `login` / `repo` 是否替换
3. 知识库是否对 Token 可见（私有库需要 Token 有权限）

### Q: 图片显示不出来？
已通过 `scripts/no-referrer.js` 注入 `no-referrer` meta 解决。若仍有问题，可考虑用 [PicGo](https://github.com/Molunerfinn/PicGo) 把语雀图转存到自己的图床。

### Q: 想改成账号密码认证？
当前方案用 Token（语雀个人版即可）。账号密码方式可参考 [Elog](https://github.com/lichaozheobj/blogs) 方案。

### Q: 想换主题？
```bash
npm uninstall hexo-theme-landscape
npm install hexo-theme-butterfly --save
# 然后修改 _config.yml 的 theme: butterfly
```
