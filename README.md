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

## 六、部署（Cloudflare Pages）

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
