---
title: 'win查看所有端口和PID'
urlname: 'czmn4ktbg6e2qyeh'
date: '2023-07-26 10:01:22'
updated: '2023-08-03 09:42:01'
tags:
  - Windows
  - 运维
description: 'win查看所有端口和PID'
---
<font style="color:rgb(77, 77, 77);">控制台最后会显示Application启动失败，如下：</font>

```java
...
 
***************************
APPLICATION FAILED TO START
***************************
 
Description:
 
The Tomcat connector configured to listen on port 8080 failed to start. The port may already be in use or the connector may be misconfigured.
 
...
```

1. **<font style="color:rgb(77, 77, 77);">打开cmd命令窗口  输入如下指令查看所有端口和PID</font>**

```java
netstat -ano
```

**<font style="color:rgb(77, 77, 77);">2. 找到对应的端口对应的PID ，输入指令找到对应的进程</font>**

```java
tasklist | findstr "4044"
```

  
 **<font style="color:rgb(77, 77, 77);">3.杀掉该进程，再次启动就OK啦</font>**

```java
taskkill /f /t /im java.exe
```

  
 

