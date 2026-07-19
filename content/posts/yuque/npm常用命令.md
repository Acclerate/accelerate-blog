---
title: npm常用命令
urlname: gxkcf7l2x6gd2c9m
date: '2023-04-23 11:20:10'
updated: '2023-04-23 18:40:45'
---
### 
```bash
npm config set prefix "D:\tools\nvm\node_global"
npm config set cache "D:\tools\nvm\node_cache"
```

```bash
npm list --depth 0

+-- babel-core@6.26.3
+-- babel-preset-env@1.7.0
+-- no@0.0.1
+-- nrm@1.2.5
`-- optional@0.1.4
```

### <font style="color:rgb(79, 79, 79);">查看npm设置</font>
```bash
npm config list --l 或 npm config ls -l #查看全部配置项
npm config list #查看简略配置信息
npm config get <key>  #查看某一项的配置信息
npm config set <key> <value> #设置某一项的配置信息

```

<font style="color:rgb(34, 34, 38);">npm 查看和修改 prefix和 cache配置</font>

我一般选择用命令的方式设置，并且将这两个文件夹配置在其他盘符防止权限问题

```bash
# 设置全局包目录
npm config set cache "D:\tools\nvm\node_cache"
#设置缓存目录
npm config set prefix "D:\tools\nvm\node_global"
```

### <font style="color:rgb(199, 37, 78);background-color:rgb(249, 242, 244);">.npmrc</font><font style="color:rgb(79, 79, 79);">文件</font>
<font style="color:rgb(77, 77, 77);">在该文件中可以查看或手动修改配置信息。  
</font><font style="color:rgb(77, 77, 77);">用 </font><font style="color:rgb(199, 37, 78);background-color:rgb(249, 242, 244);">npm config list</font><font style="color:rgb(77, 77, 77);">查看所在路径，里面带有.npmrc的那个就是径了。</font>

C:\Users\junio\.npmrc<font style="color:rgb(197, 200, 198);background-color:rgb(29, 31, 33);"> </font>  
 

--save与--save-dev的区别

–save：将保存配置信息到package.json的dependencies节点中。(运行时&生产时的依赖)

–save-dev：将保存配置信息到package.json的devDependencies节点中。（运行时的依赖）



Q1：直接npm install的包是在哪个节点呢？

答：默认进入了package.json的dependencies中。



Q2：删除本地模块时思考的问题：是否将在package.json上的相应依赖信息也消除？



答：npm uninstall [name]：删除模块，但不删除模块留在package.json中的对应信息。

npm uninstall [name] --save ：删除模块，同时删除模块留在package.json中dependencies下的对应信息。

npm uninstall [name] --save-dev ：删除模块，同时删除模块留在package.json中devDependencies下的对应信息。



npm本地安装与全局安装有什么区别？

```bash
npm install grunt #本地安装，则是将模块下载到当前命令行所在目录。
npm install -g grunt #全局安装，模块将被下载安装到【全局目录】中；
#npm获取全局安装的默认目录
npm config get prefix
# npm如何设置全局安装的默认目录
npm config set prefix “directory”
```

### <font style="color:rgb(64, 64, 64);">安装其他来源的包</font>
 <font style="color:rgb(199, 37, 78);background-color:rgb(242, 242, 242);">npm cli</font> 还可以让你安装其他来源的包：

```bash
npm config set xxx
# 淘宝镜像
npm config set registry https://registry.npm.taobao.org
#通过cnpm使用淘宝镜像：
npm install -g cnpm --registry=https://registry.npm.taobao.org
#查看是否切换成功
npm config get registry

```

nrm(npm registry manager )是npm的镜像源管理工具，有时候国外资源太慢，使用这个就可以快速地在 npm 源间切换

```powershell
# 全局安装nrm。
npm install -g nrm
#查看当前nvm版本； (即：是 ‘nrm -Version’ 简写)；
nrm -V 
#显示所有命令； (即：是 ‘nrm -help’ 简写)；
nrm -h 
# 查看当前使用源：
nrm current
#切换源：
nrm use taobao
#添加源： 其中，registry为源名，url为源地址
nrm add <registry> <url>
nrm add hsa-neu-ui http://192.168.131.211:8081/repository/hsa-neu-ui/
nrm set-auth <registry> <value> [always] #设置自定义源的授权信息；
nrm set-email <registry> <value> #给自定义源设置路径；
nrm set-hosted-repo <registry> <value>#设置发布到自定义源的 ‘npm’ 托管仓储
nrm del <registry>#删除自定义源;
nrm home <registry> [browser]：浏览器中打开源首页；
nrm publish [options] [<tarball>|<folder>]：#发布包到自定义源，如果没有使用自定义源，则直接发布到npm；
nrm test [registry]#测试源的访问速度； 不加 ‘registry’ 时，默认测试所有的源速度；
```

## <font style="color:rgb(44, 62, 80);">npm 配置公司仓储地址</font>
```bash
npm config set registry=http://192.168.131.211:8081/repository/hsa-neu-ui/
#登录
npm adduser --registry=http://192.168.131.211:8081/repository/hsa-neu-ui/
  # 依次输入用户名: hsa-neu-r，密码：hsa-neu-r2021，邮箱：hsa-neu-r@neusoft.com
```



## 安装依赖项
```bash
$ npm install <package_name>
$ npm i <package_name>
```



安装开发环境依赖：

```bash
$ npm install --save-dev <package_name>
$ npm i -D <package_name>
```

安装生产环境依赖（默认）：

```bash
$ npm install --save-prod <package_name>
$ npm i -P <package_name>
```

全局安装软件包：

```bash
$ npm install --global <package_name>
$ npm i -g <package_name>
```

同时安装多个包：

```bash
$ npm i express cheerio axios
```

安装具有相同前缀的多个包：

```bash
$ npm i eslint-{plugin-import,plugin-react,loader} express
```

## 干净安装你的包依赖
npm ci 用于清除安装包依赖项。它通常用于自动化环境，如 CI/CD 平台。

```bash
$ npm ci
```

它与 npm install 有以下不同之处：

+ 它安装的是 package-lock.json 中提到的包的确切版本。
+ 删除现有的 node_modules 并运行新的安装。
+ 它不会写信给你的 package.json或 *-lock 文件。
+ 它不会安装与 npm install 类似的单个软件包。

## NPM scripts
npm scripts 用于自定义脚本，例如：

```bash
$ npm run env
```

上面的命令是 npm cli 为我们提供的一个脚本命令，用于列出程序内的所有环境变量。

通常，我们可以在 package.json 内的 scripts 定义我们的脚本命令，例如：

```json
{
  "scripts": {
    "serve": "nodemon app.js"
  }
}
```

我们可以通过运行 npm run serve 来启动我们的应用程序。

我们可以使用不带参数的 npm run 命令查看项目上的所有命令脚本：

```bash
$ npm run

#  serve
#    nodemon app.js
```

> **注意**：每当 npm run 命令，都会新建一个 shell 文件来执行我们当前的执行的命令，只要符合 shell 可运行的命令，都可以执行。
>
> 在执行 npm scripts 的过程中，我们可以通过 npm_package_ 前缀拿到 package.json 内的字段。
>



npm script 还有许多其他的技巧，如通配符、传参、执行顺序、默认值、钩子、简写形式等，关于 npm scripts 的详情内容请看阮老师的 [npm scripts 使用指南](https://links.jianshu.com/go?to=http%3A%2F%2Fwww.ruanyifeng.com%2Fblog%2F2016%2F10%2Fnpm_scripts.html)。

## 在 package.json 中配置自己的变量
在上一节中，我们使用到了 npm run env 命令，它将列出我们包中存在的所有 npm 环境变量

我们可以在 package.json 内的 config 字段添加自己的自定义变量：

```json
{
  "config": {
    "myVariable": "Hello World"
  },
}
```

执行以下命令：

```bash
$ npm run env | grep npm_package_config_
```

我们将看到，我们刚才所配置的变量，它以 npm_package_config_ 为前缀。

项目中获取自定义变量：

```plain
console.log(process.npm_package_config_myVariable) // Hello World
```

> **注意**：config 字段内的变量可以在输入命令时被覆盖：
>



## 快速导航到包主页、储存库和 issues
在查找 npm 包的文档时，我们经常使用 Google 搜索其主页和 npm 页面。

但也有其他更快速的方法，我们可以通过运行以下命令快速进入主页：

```bash
$ npm home <package-name>

# example
$ npm home axios
$ npm home vue
```

导航到 issues：

```bash
$ npm bug <package-name>
```

打开它的存储库也很容易：

```bash
$ npm repo <package-name>
```

这三个命令都将在您的默认浏览器中打开目标网站。

## npm root 定位全局节点模块目录
```bash
# 本地 node_modules
$ npm root

# 全局 node_modules
$ npm root -g
```

## 删除重复包
npm dedupe 命令用于删除重复的依赖项。它通过删除重复的包并在多个依赖包之间有效地共享公共依赖项来简化整体结构。它会产生一个扁平的和去重的树。

```bash
$ npm dedupe
# or
$ npm ddp
```

## 扫描您的应用程序是否存在漏洞
npm audit 检查项目依赖项是否存在漏洞。它可以看出有风险的 package、依赖库的依赖链、风险原因及其解决方案。

```bash
$ npm audit
```

如果发现存在漏洞，我们可以使用 npm audit fix，它将自动安装所有易受攻击依赖包的修补版本（如果可用）。

```bash
$ npm audit fix
# or
$ npm audit fix --force
```

更好的做法是使用 [synk](https://links.jianshu.com/go?to=https%3A%2F%2Fgithub.com%2Fsnyk%2Fcli)，它是一个高级版的 npm audit，可自动修复，且支持 CI/CD 集成与多种语言。

```bash
$ npx snyk
```

## 清理 npm 缓存
磁盘满了，试着清楚 npm 缓存：

```bash
$ npm cache clean --force
$ yarn cache clean
$ pnpm store prune
```

## 检查环境
npm doctor 命令可以在我们的环境中运行多项检查。

```bash
$ npm doctor
```

## 在本地测试你的包
```bash
$ npm link <package_name>
```

## 检查过时的包
使用 npm outdated 命令来检查所有过时的 npm 包。它还显示了应该为任何过时的软件包安装的最新版本。

```bash
$ npm outdated --long
# or
$ npm outdated -l
```

## 检查任何 npm 包的最新版本
我们可以通过运行以下命令来检查任何 npm 包的最新版本

```bash
$ npm view <package-name>
# or
$ npm v <package-name>
```

仅显示最新版本

```bash
$ npm v <package-name> version
```

显示所有版本的列表

```bash
$ npm v <package-name> versions
```

## 列出所有已安装的包
npm list 命令可以列出项目中安装的所有 npm 包。它将创建一个树结构，显示已安装的包及其依赖项。

```bash
$ npm list
#or
$ npm ls
```

+ 可以利用 --depth flag 来限制搜索深度

```bash
$ npm ls --depth=1

# 查看全局安装的软件包
$ npm list -g --depth 0
```

## 发布一个包
首先，需要使用 npm login 登录：

```bash
$ npm login
```

然后，在使用 npm publish 发布项目：

```bash
$ npm publish
```

详细内容可查阅另一篇[如何对 npm package 进行发包](https://www.jianshu.com/p/0232bd2bfd5a)。

## 更新软件包
npm update 命令用于更新软件包：

```bash
$ npm update <name>
$ npm update <name> -g
$ npm update <name> -D
```

为了便于查看依赖信息，我们可以安装 npm-check 包，它用于检查过时、不正确和未使用的依赖项。

```bash
$ npm i -g npm-check
```

运行以下命令：

```bash
$ npm-check -u
```

它将显示用于选择要更新的模块的交互式 UI。替代的还有 [npm-check-updates](https://links.jianshu.com/go?to=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2Fnpm-check-updates)。

可查看另一篇[检查 npm 模块更新](https://www.jianshu.com/p/dc6eaef98c1d)

## 资源
+ [https://blog.bitsrc.io/npm-tips-and-tricks-24c5e9defea6](https://links.jianshu.com/go?to=https%3A%2F%2Fblog.bitsrc.io%2Fnpm-tips-and-tricks-24c5e9defea6)
+ [https://css-tricks.com/a-complete-beginners-guide-to-npm/](https://links.jianshu.com/go?to=https%3A%2F%2Fcss-tricks.com%2Fa-complete-beginners-guide-to-npm%2F)
+ [https://nodesource.com/blog/the-basics-getting-started-with-npm](https://links.jianshu.com/go?to=https%3A%2F%2Fnodesource.com%2Fblog%2Fthe-basics-getting-started-with-npm)
+ [https://nodesource.com/blog/an-absolute-beginners-guide-to-using-npm/](https://links.jianshu.com/go?to=https%3A%2F%2Fnodesource.com%2Fblog%2Fan-absolute-beginners-guide-to-using-npm%2F)
+ [https://nodesource.com/blog/seven-more-npm-tricks-to-knock-your-wombat-socks-off](https://links.jianshu.com/go?to=https%3A%2F%2Fnodesource.com%2Fblog%2Fseven-more-npm-tricks-to-knock-your-wombat-socks-off)  
[https://nodesource.com/blog/eleven-npm-tricks-that-will-knock-your-wombat-socks-off](https://links.jianshu.com/go?to=https%3A%2F%2Fnodesource.com%2Fblog%2Feleven-npm-tricks-that-will-knock-your-wombat-socks-off)



### <font style="color:rgb(79, 79, 79);">  
</font><font style="color:rgb(79, 79, 79);"> </font>
## <font style="color:rgb(79, 79, 79);">npm 安装命令（以</font>[axios](https://so.csdn.net/so/search?q=axios&spm=1001.2101.3001.7020)<font style="color:rgb(79, 79, 79);">为例）</font>


```powershell
# npm 初始化当前目录
npm init
# 安装所有依赖
npm i # 安装模块到默认dependencies
npm i axios # 安装到配置的全局目录下
npm i axios -g # 安装包信息将加入到dependencies生产依赖
npm i axios -S # 安装包信息将加入到devDependencies开发依赖
npm i axios -D # 安装axios指定的6.5.3版本
npm i axios@6.5.3  npm 更新命令（以axios为例）
#更新最新版本的axios
npm update axios
#更新axios最后一个新版本
npm i axios@latest
#更新到指定版本号的axios
npm update axios@6.2.3
npm 卸载命令（以axios为例）
#卸载模块，但不卸载依赖留在package.json中的对应信息
npm uninstall axios
#卸载全局依赖
npm uninstall axios -g
#卸载依赖，同时卸载留在package.json中dependencies下的信息
npm uninstall axios --save
#卸载依赖，同时卸载留在package.json中devDependencies下的信息
npm uninstall axios --save-dev
npm 查看命令（以axios为例）
#查看项目中依赖所在的目录
npm root
#查看全局# 安装的依赖所在目录
npm root -g
#查看已# 安装依赖的列表
npm list 
#或者
npm ls
#查看axios最新的版本号
npm view axios version
#查看全部axios历史版本号
npm view axios versions
#查看最新的axios版本的信息
npm view axios
#或者
npm info axios 
#查看本地已# 安装的axios的详细信息
npm list axios
#或者
npm ls axios
npm其他命令（以axios为例）
#清除npm的缓存
npm cache clean
#清除项目中没有被使用的依赖
npm prune
#检查依赖是否已经弃用
npm outdated
#打开默认浏览器跳转到github中axios的页面
npm repo axios
#打开默认浏览器跳转到github中axios的README.MD文件
npm docs axios
#打开默认浏览器跳转到github中axios的主页
npm home axios
```

## <font style="color:rgb(199, 37, 78);background-color:rgb(242, 242, 242);">npm init</font> 命令是一个逐步构建项目的工具。
<font style="color:rgb(64, 64, 64);">根据提示填写内容，也可以按提供的默认值一路回车（Enter）。</font>  
为了省去上面的操作，我们加上 <font style="color:rgb(199, 37, 78);background-color:rgb(242, 242, 242);">--yes</font> 标志将自动使用默认值 <font style="color:rgb(199, 37, 78);background-color:rgb(242, 242, 242);">npm init</font> 填充所有选项：

```bash
npm init
npm init --yes
npm init -y
# 查看npm配置
npm config list
```

# <font style="color:rgb(34, 34, 38);"></font>
