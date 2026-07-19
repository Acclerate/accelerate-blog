---
title: 'nvm安装'
urlname: 'wrsgfnmsalkblbb6'
date: '2023-07-01 12:35:55'
updated: '2023-07-01 12:36:34'
tags:
  - Node.js
  - nvm
  - 工具
description: 'nvm安装'
---
1、nvm安装

1、双击安装文件 nvm-setup.exe



2、选择nvm安装路径



3、选择nodejs路径



4、确认安装即可



5、安装完确认



打开CMD，输入命令 nvm ，安装成功则如下显示。可以看到里面列出了各种命令，本节最后会列出这些命令的中文示意。





6、nvm管理node版本



1、查看所有可安装的版本



nvm list available



2、查看本地已经安装的所有版本



nvm list



3、安装，命令中的版本号



nvm install 14.18.1



4、使用指定node版本



nvm use 14.18.1



5、卸载



nvm uninstall 14.18.1



7、其他nvm相关命令



nvm arch ：显示node是运行在32位还是64位。

nvm install <version> [arch] ：安装node， version是特定版本也可以是最新稳定版本latest。可选参数arch指定安装32位还是64位版本，默认是系统位数。可以添加--insecure绕过远程服务器的SSL。

nvm list [available] ：显示已安装的列表。可选参数available，显示可安装的所有版本。list可简化为ls。

nvm on ：开启node.js版本管理。

nvm off ：关闭node.js版本管理。

nvm proxy [url] ：设置下载代理。不加可选参数url，显示当前代理。将url设置为none则移除代理。

nvm node_mirror [url] ：设置node镜像。默认是[https://nodejs.org/dist/](https://nodejs.org/dist/)。如果不写url，则使用默认url。设置后可至安装目录settings.txt文件查看，也可直接在该文件操作。

nvm npm_mirror [url] ：设置npm镜像。[https://github.com/npm/cli/archive/](https://github.com/npm/cli/archive/)。如果不写url，则使用默认url。设置后可至安装目录settings.txt文件查看，也可直接在该文件操作。

nvm uninstall <version> ：卸载指定版本node。

nvm use [version] [arch] ：使用制定版本node。可指定32/64位。

nvm root [path] ：设置存储不同版本node的目录。如果未设置，默认使用当前目录。

nvm version ：显示nvm版本。version可简化为v。



2、node.js安装nvm列表中没有的版本

1、下载需要的node版本



2、在nvm安装路径中创建相关版本文件夹



3、双击安装node文件



4、安装到nvm文件夹中创建的版本文件夹中



6、查看版本是否安装完成







7、查看当前node版本



node -v

1

3、node环境变量配置

1.首先在node.js的安装目录新建两个文件夹node_global和node_cache







2.创建完两个文件夹后，在cmd窗口中输入以下命令（两个路径即是两个文件夹的路径）：



npm config set prefix "D:\install\nodejs\node_global"

npm config set cache "D:\install\nodejs\node_cache"



3.接下来设置电脑环境变量，右键“我的电脑”=》属性=》高级系统设置=》环境变量 进入以下环境变量对话框。







4.在【系统变量】新建环境变量 NODE_PATH，值为D:\install\nodejs\node_global\node_modules，其中D:\install\nodejs\node_global是上述创建的全局模块安装路径文件夹







5.修改【用户变量】中的path变量，将C:\Users\hua\AppData\Roaming\npm修改为D:\install\nodejs\node_global









6.点击确定后，配置完成。



7.测试是否配置成功，在cmd窗口中输入以下指定全局安装express模块



npm install -g express     # -g表示是全局安装



[外链图片转存失败,源站可能有防盗链机制,建议将图片保存下来直接上传(img-WEpTS7x3-1652185237994)(pictures/8782952-559fa6868c6d1a16.png)]







8、国内镜像网站配置



npm install -g cnpm --registry=[https://registry.npm.taobao.org](https://registry.npm.taobao.org)

1

9.以后下载模块的时候，将npm替换成cnpm即可从淘宝镜像中下载模块，例如



cnpm install



