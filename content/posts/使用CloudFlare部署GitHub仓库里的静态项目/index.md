---
title: "使用CloudFlare部署GitHub仓库里的静态项目"
description: "记录如何使用 CloudFlare Pages 关联 GitHub 仓库，一键部署静态网站项目。"
date: "2026-07-18T22:37:57+08:00"
tags: ["cloudflare", "部署", "github", "pages"]
draft: false
---

1. 先登录 [CloudFlare](https://www.cloudflare-cn.com/personal/)

![CloudFlare](image.png)

2. 进入 `Workers & Pages` 管理页, 点击 `Create a Worker`

![Workers & Pages](image-2.png)

3. 关联 GitHub 账户, 然后进入部署配置页

![alt text](image-3.png)

4. 我们的项目托管在GitHub，所以选择 `Import an existing Git repository`

![alt text](image-4.png)

5. 选择账户和仓库，然后点击 `Begin setup`

![alt text](image-5.png)

6. 输入域名、选择分支、选择部署方式，然后点击 `Save and Deploy`

![alt text](image-6.png) 

7. 它就会自动部署，部署完成后，就可以在浏览器访问了

![alt text](image-7.png)

8. 等待几分钟，就可以在浏览器访问了 https://sod-momas.pages.dev/ ，甚至自带https

![alt text](image-8.png)