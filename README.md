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

## 🌐 让网站在大陆免梯子访问（重要）

> 默认 `*.pages.dev` 域名在大陆被 DNS 污染 + SNI 阻断，几乎必须用梯子才能访问。
> 必须绑自定义域名才能解决。以下为 **0 元方案**（全部免费）。

### 思路

```
默认 accelerate-blog.pages.dev  ──❌ 大陆无法访问
   ↓ 绑自定义域名
blog.accelerate.us.kg            ──✅ 可免梯子访问（配合优选 IP）
```

### 第 1 步：申请免费域名（DigitalPlat）

- 注册：https://register.us.kg/
- 后缀推荐 `us.kg`（最短），也可选 `dpdns.org` / `qzz.io`
- 用 **Gmail/Outlook** 邮箱注册（不要临时邮箱）
- KYC 选 **Sign in with GitHub**（最省事）
- 永久免费，到期前 180 天手动续期即可

### 第 2 步：托管到 Cloudflare

1. Cloudflare 控制台 → **Add a Site** → 输入 `你的域名.us.kg`
2. 选 **Free** 计划 → Cloudflare 给你 2 个 NS 地址
3. 回到 DigitalPlat 后台填这 2 个 NS → 等 5-30 分钟生效

### 第 3 步：在 Pages 绑定自定义域名

1. Cloudflare → **Workers & Pages** → `accelerate-blog` 项目
2. 顶部 **Custom domains** → **Set up a custom domain**
3. 输入 `blog.你的域名.us.kg` → Activate

### 第 4 步：优选 IP 加速（免梯子关键 ⭐）

只绑域名不优化 IP 在大陆依然慢/卡。**必须做这步**：

**做法 A（推荐，自动维护）**：DNS 不托管在 Cloudflare
- 把域名 NS 改到 [DNSPod 国际版](https://www.dnspod.com) / [HE.net](https://dns.he.net)（免费）
- 添加 CNAME：`blog` → `cf.090227.xyz`（社区维护的优选域名）

**做法 B**：DNS 仍在 Cloudflare
- 用 [CloudflareSpeedTest](https://github.com/XIU2/CloudflareSpeedTest) 测速找最快 IP
- Cloudflare DNS → 添加 A 记录：`blog` → `优选IP`，**关掉橙云（灰色）**
- ⚠️ Cloudflare 可能检测到非自家 CDN 而报 `Error 1000`，所以更推荐做法 A

### 验证

```bash
ping blog.你的域名.us.kg
# 返回优选 IP（如 104.16.x.x）且延迟 <100ms → 成功

curl -I https://blog.你的域名.us.kg
# 返回 200 OK 即可
```

### 绑完域名后别忘了改 _config.yml

```yaml
url: https://blog.你的域名.us.kg
```

否则站内链接、分享、SEO 用的还是 `pages.dev` 域名。

## 📚 参考

- [使用 Cloudflare 部署 GitHub 仓库里的静态项目](https://sod-momas.pages.dev/posts/%E4%BD%BF%E7%94%A8cloudflare%E9%83%A8%E7%BD%B2github%E4%BB%93%E5%BA%93%E9%87%8C%E7%9A%84%E9%9D%99%E6%80%81%E9%A1%B9%E7%9B%AE/)
- [yuque-hexo 官方仓库](https://github.com/x-cold/yuque-hexo)
- [CloudflareSpeedTest 优选 IP 工具](https://github.com/XIU2/CloudflareSpeedTest)
- [DigitalPlat 免费域名](https://register.us.kg/)
