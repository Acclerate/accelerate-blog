# Accelerate Blog

> 基于 [Hugo](https://gohugo.io/) + [Linewise 主题](https://github.com/tabsp/linewise) 的个人博客，托管于 Cloudflare Pages。
>
> 致谢：本项目结构参考了 [Sod-Momas/sod-momas.github.io](https://github.com/Sod-Momas/sod-momas.github.io)。

## 环境要求

- **Hugo Extended ≥ 0.146.0**（必须是 extended 版本）
- **Git**（用于拉取主题 submodule）

## 一、安装 Hugo

Windows 下任选一种方式：

```powershell
# 方式一：winget（Win10/11 推荐）
winget install Hugo.Hugo.Extended

# 方式二：Scoop
scoop install hugo-extended

# 方式三：Chocolatey
choco install hugo-extended
```

手动安装：从 [Hugo Releases](https://github.com/gohugoio/hugo/releases) 下载
`hugo_extended_*_windows-amd64.zip`，解压后把 `hugo.exe` 所在目录加入系统 `PATH`。

验证安装（输出需包含 `extended`）：

```powershell
hugo version
```

## 二、获取项目

首次克隆需要一并拉取主题 submodule：

```powershell
git clone --recursive https://github.com/Acclerate/accelerate-blog.git
```

如果已经克隆但主题目录为空，补拉 submodule：

```powershell
git submodule update --init --recursive
```

## 三、本地预览

**方式一：一键脚本**（自动选择 Hugo 实时预览，未装 Hugo 时回退静态服务）

```powershell
# 双击 serve.bat，或：
python serve.py
```

**方式二：直接用 Hugo**

```powershell
hugo server -D      # -D 表示包含草稿(draft)
```

启动后浏览器访问 <http://localhost:1313/>，保存文件会自动热更新。

## 四、编译构建

生成静态文件到 `public/` 目录（不含草稿）：

```powershell
hugo --gc --minify
```

## 五、写文章 / 删文章

文章位于 `content/posts/`，为带 front matter 的 Markdown 文件。

**新建文章：**

```powershell
hugo new posts/my-post.md
```

或手动创建 `content/posts/my-post.md`：

```markdown
---
title: "文章标题"
description: "一句话简介"
date: 2026-07-18
tags: ["笔记"]
draft: false
---

正文用 Markdown 编写……
```

> 带图片的文章建议使用「叶子包」结构：`content/posts/my-post/index.md`，
> 图片放同目录，正文中用 `![alt](image.png)` 相对引用。

**删除文章：**

- 彻底删除：删掉对应的 `.md` 文件（或整个叶子包文件夹）。
- 仅隐藏不发布：把 front matter 改为 `draft: true`（正式构建会排除草稿）。

## 六、语雀同步（本地手动）

> 在语雀上写作，本地运行 `npm run sync:local` 拉到仓库后 push，Cloudflare 自动重建。
>
> **为什么用本地同步，不用 CI 自动同步？**
> 当前用的是**账号密码模式（免费）**。如果在 GitHub Actions 等
> 海外 CI 上跑，会在语雀后台留下大量"美国 IP 登录"记录，有被
> 风控封号的风险。所以只在本机同步，安全免费。
>
> 如果你有语雀超级会员，可以改回 Token 模式 + CI 自动同步，
> 详见本节末尾的「升级到自动同步」。

### 工作流程

```
┌────────┐    本地 npm run sync:local     ┌──────────┐  git push  ┌────────────┐
│  语雀   │ ─────────────────────────────▶│  本地仓库  │ ─────────▶│ Cloudflare │
│ (写作) │    Elog 拉文章 → content/posts/ │           │           │   Pages    │
└────────┘                                 └──────────┘           └─────┬──────┘
                                                                         │ 自动重建
                                                                         ▼
                                                         https://accelerate-blog.pages.dev
```

### 初次配置（2 步）

#### 1. 拿到语雀四个信息

| 信息 | 在哪拿 |
|---|---|
| 用户名 | 登录语雀用的**手机号** |
| 密码 | 你的语雀登录密码 |
| `YUQUE_LOGIN` | 知识库 URL：`https://www.yuque.com/<login>/<repo>` → 个人路径 |
| `YUQUE_REPO` | 同上 → 知识库短地址 |

例：`https://www.yuque.com/acclerate/blog` → `login=acclerate`, `repo=blog`

#### 2. 配置 .elog.env

```bash
# 复制模板
cp .elog.example.env .elog.env

# 然后编辑 .elog.env，把 4 个值填进去
```

`.elog.env` 内容（**绝对不要提交到 git，已在 .gitignore 排除**）：

```
YUQUE_USERNAME=13800138000
YUQUE_PASSWORD=你的密码
YUQUE_LOGIN=acclerate
YUQUE_REPO=blog
```

### 同步流程

```bash
# 1. 安装依赖（首次或依赖更新后）
npm install

# 2. 拉取语雀最新文章到 content/posts/yuque/
npm run sync:local

# 3. 本地预览（可选，需先装 Hugo）
hugo server -D
# 访问 http://localhost:1313/

# 4. 提交并推送
git add .
git commit -m "post: 同步语雀文章"
git push
```

push 后 1-2 分钟，Cloudflare Pages 会自动重建部署，访问 `https://accelerate-blog.pages.dev` 看到新文章。

### 日常使用

写完文章后，只需运行：

```bash
npm run sync:local && git add . && git commit -m "post: xxx" && git push
```

文章太多时同步会慢一些（每秒约 2 篇），可以加 `--concurrency` 提速（参考 Elog 文档）。

### 语雀文章 front matter 规范

`elog.config.js` 里的 adapter 会自动生成 Hugo / Linewise 兼容的 front matter：

```yaml
---
title: 文章标题
date: 2026-07-19T10:00:00.000Z
description: 文章描述
tags: [标签1, 标签2]
draft: false
source: yuque
doc_id: 123456789
---
```

**如果想自定义标签 / 描述**，在语雀文档**开头**加 YAML front matter 块：

````markdown
```yaml
tags: [Hexo, 教程]
description: 一句话简介
```
````

adapter 会合并这些自定义字段。

### 同步的文件在哪

```
content/posts/
├── find-task-and-port-on-windows.md       # 手写的示例文章
├── 使用CloudFlare部署GitHub仓库.../        # 手写的示例文章
└── yuque/                                  # ← 语雀同步的文章在这里
    ├── 文章1.md
    ├── 文章2.md
    └── ...
```

### 升级到 CI 自动同步（需要语雀超级会员）

如果你开了语雀会员，可以用 Token 模式让 GitHub Actions 每天自动同步：

1. 在语雀生成 Token（头像 → 设置 → Token）
2. 修改 `elog.config.js`：
   ```js
   deploy: {
     type: 'yuque',
     yuque: {
       login: process.env.YUQUE_LOGIN,
       repo:  process.env.YUQUE_REPO,
       token: process.env.YUQUE_TOKEN,
       onlyPublished: true,
       onlyPublic: false,
     },
   },
   ```
3. 在 GitHub Secrets 配 `YUQUE_TOKEN` / `YUQUE_LOGIN` / `YUQUE_REPO`
4. 仓库 Settings → Actions → General → Workflow permissions → **Read and write**
5. 新建 `.github/workflows/sync-yuque.yml`，参考 git 历史里的 `597b964` 这个提交

## 七、部署（Cloudflare Pages）

推送 `main` 分支后，Cloudflare Pages 会自动从仓库拉取代码、用 Hugo 构建并发布。

### Cloudflare Pages 配置

| 字段 | 值 |
|---|---|
| Project name | `accelerate-blog` |
| Production branch | `main` |
| Framework preset | `None`（Hugo 不在预设列表里，选 None） |
| Build command | `git submodule update --init --recursive && hugo --gc --minify` |
| Build output directory | `public` |
| 环境变量 | `HUGO_VERSION` = `0.146.0`（或更新版本） |


> ⚠️ **必须配置环境变量 `HUGO_VERSION`**！Cloudflare Pages 默认的 Hugo 版本可能过旧。
> 同时确保在 Cloudflare 控制台 → Settings → Environment variables 里加上。

### 日常更新

```powershell
git add .
git commit -m "更新文章"
git push
```

push 后等 1-2 分钟，Cloudflare 会自动重新构建。

## 项目结构

```
.
├── content/posts/      # 文章（Markdown）
├── static/             # 静态资源（favicon、og 图等）
├── themes/linewise/    # Linewise 主题（git submodule）
├── layouts/baseof.html # 重写的主框架模板（覆盖主题默认）
├── hugo.toml           # 站点配置
├── serve.py / serve.bat# 本地预览脚本
└── .github/workflows/  # GitHub Pages 部署 workflow（默认禁用，可选启用）
```

## 切换部署目标

本项目默认部署到 **Cloudflare Pages**。

如需切换到 **GitHub Pages**：
1. 启用仓库 Settings → Pages → Source = GitHub Actions
2. 编辑 `.github/workflows/static.yml`，把 `on:` 改回包含 `push: branches: ["main"]`
3. 修改 `hugo.toml` 的 `baseURL` 为 GitHub Pages 域名

## 致谢

- 主题：[tabsp/linewise](https://github.com/tabsp/linewise) —— 极客风的 IDE 风博客主题
- 结构参考：[Sod-Momas/sod-momas.github.io](https://github.com/Sod-Momas/sod-momas.github.io)
