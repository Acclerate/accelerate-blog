---
title: Java线上排查问题工具——Arthas
urlname: utb43xrwg1c81ymg
date: '2023-07-24 16:02:46'
updated: '2023-07-24 16:08:21'
---
**Java线上排查问题工具——Arthas**

[<font style="color:#3370FF;">Java线上问题排查工具—arthas_哔哩哔哩_bilibili</font>](https://www.bilibili.com/video/BV1FD4y1j73p)

[https://arthas.aliyun.com/doc/](https://arthas.aliyun.com/doc/)

**一、安装**

| <font style="color:rgb(100, 106, 115);">Shell</font>curl -O [https://arthas.aliyun.com/arthas-boot.jar](https://arthas.aliyun.com/arthas-boot.jar)   java -jar arthas-boot.jar   curl -L [https://arthas.aliyun.com/install.sh](https://arthas.aliyun.com/install.sh) | sh |
| :--- |


**二、场景**

**2-1、查看当前服务运行的参数 JVM、内存、启动参数等**

**1、memory**

查看当前堆和非堆的内存使用情况

![](https://cdn.nlark.com/yuque/0/2023/png/28708807/1690185766210-79e5d933-cbdd-4c7b-8742-6c45d065ab60.png)

**2、thread**

| <font style="color:rgb(100, 106, 115);">Shell</font># 查看全部的线程状态   thread      # 查看当前最忙的 n个线程   thread -n      # 查看被阻塞的线程   thread -b |
| :--- |


**3、查看当前类的方法**

| <font style="color:rgb(100, 106, 115);">Shell</font>sm cn.data.process.api.ApiApplication |
| :--- |


**4、其它**

cls 清空控制台 

history 查看历史的命令 

pwd 查看当前目录 

quit 推出 arthas 

reset重制所有的 arthas的增强操作 

stop  关闭 Arthas 服务端，所有 Arthas 客户端全部退出。会重置掉所有做过的增强类,但是用 redefine 重加载的类内容不会被重置。

version 查看当前的 arthas 的版本

**2-2、查看线上源码**

| <font style="color:rgb(100, 106, 115);">Shell</font># 查看源码   jad cn.data.process.api.ApiApplication      # 保存反编译的源码   jad --source-only com.example.demo.arthas.user.UserController > /UserController.java |
| :--- |


**2-3、修改线上源码**

修改的原理就是 把 <font style="color:#D83931;">新的class 加载到JVM </font>里面去，生成 class的方式有2种

把你本地的 class上传到服务器

通过 arthas的 jad命令来把 class反编译成 java ，mc 命令来把 java 编译成 class

retransform 命令把 class加载到 jvm中去

方法一就没什么好说了，来看方式二

| <font style="color:rgb(100, 106, 115);">Shell</font># 1、从原class 里面复制出新的 java文件（有可能反编译会有问题，建议先检查下结果）   jad --source-only cn.data.process.api.web.WkDataController > /WkDataController.java      # 2、修改java里面的内容为你想要的内容      # 3、使用 mc 把你的java 编译成 class   mc /WkDataController.java -d /      # 4、把新的class 加载到JVM中去   retransform /cn/data/process/api/web/WkDataController.class |
| :--- |


**2-4、监控线上代码 **

monitor  间隔N秒，统计 某个方法 成功次数、失败次数、平均耗时、失败率

stack 打印整个栈的信息，太长了感觉没啥用

trace  监控某个方法各个步骤的耗时

**1、monitor **

| <font style="color:rgb(100, 106, 115);">Shell</font># 每隔 5s 监控一下WkDataController 类的 test 方法      monitor -c 5 cn.data.process.api.web.WkDataController test |
| :--- |


![](https://cdn.nlark.com/yuque/0/2023/png/28708807/1690185766698-a46c2411-02cf-4449-9f98-a18f4957e64b.png)

**2、stack**

打印整个栈的信息，太长了感觉没啥用

| <font style="color:rgb(100, 106, 115);">Shell</font>stack cn.data.process.api.web.WkDataController test2 |
| :--- |


**3、trace  （排查慢接口好帮手）**

| <font style="color:rgb(100, 106, 115);">Shell</font># 监控一下WkDataController 类的 test 方法的执行耗时   trace cn.data.process.api.web.WkDataController test |
| :--- |


![](https://cdn.nlark.com/yuque/0/2023/png/28708807/1690185767149-d89772a8-2697-4959-afad-b5e33730d01c.png)

**4、参数过滤**

[<font style="color:#3370FF;">https://github.com/alibaba/arthas/issues/71</font>](https://github.com/alibaba/arthas/issues/71)

[https://github.com/alibaba/arthas/issues/11](https://github.com/alibaba/arthas/issues/11)

上面的监控虽然很好，但在实际的项目中，我们的访问量很大，我们想要监控某个请求这时候通过参数过滤将会是完美的方案。

**4-1、监控某个参数的值**

| <font style="color:rgb(100, 106, 115);">Java</font>@GetMapping("/test1")   public void test1(@RequestParam String str, @RequestParam Integer age)  {       System._out_.println(str + "  " + age);   }      # 监控 str == zxc   trace cn.data.process.api.web.WkDataController test1 "params[0] == 'zxc'"      # 监控 age >= 1   trace cn.data.process.api.web.WkDataController test1 "params[1] >= 1" |
| :--- |


| <font style="color:rgb(100, 106, 115);">Java</font>@PostMapping("/test2")   public void test2(@RequestBody TestDTO testDTO) {       System._out_.println(testDTO.getName() + "  " + testDTO.getAge());   }      # 监控 name == 111   trace cn.data.process.api.web.WkDataController test2 "params[0].name == '111'" |
| :--- |


**2-5、修改日志的级别**

Arthas 支持修改每个类的日志级别，这里只演示修改整个系统的日志级别   [<font style="color:#3370FF;">Arthas-logger</font>](https://arthas.aliyun.com/doc/logger.html)

| <font style="color:rgb(100, 106, 115);">Shell</font># 1、查看日志信息   logger      # 2、修改日志的隔离级别   logger --name ROOT --level debug |
| :--- |


