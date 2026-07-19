---
title: "怎么在 Windows 下查所有运行任务和端口"
description: "整理 Windows 下查看运行任务、端口占用及结束进程最常用、最实用的命令行。"
date: 2026-07-18
tags: ["windows", "命令行", "网络"]
draft: false
---

在排查端口占用、定位异常进程或检查服务状态时，我们经常需要查看本机正在运行的任务以及它们占用的网络端口。本文整理了 Windows 下最常用、最实用的几条命令。

## 一、查看所有运行中的任务

使用 `tasklist` 可以列出当前系统中所有正在运行的进程：

```powershell
tasklist
```

如需按名称过滤，比如只看包含 `java` 的进程：

```powershell
tasklist | findstr java
```

> **提示：** `findstr` 类似 Linux 下的 `grep`，用于按关键字过滤输出。

## 二、查看所有端口与对应进程

使用 `netstat` 可以查看所有网络连接和监听端口，`-ano` 参数分别表示：显示所有连接、不解析名称、显示 PID。

```powershell
netstat -ano
```

各列含义：

| 列 | 含义 |
| --- | --- |
| Proto | 协议（TCP / UDP） |
| Local Address | 本地地址与端口 |
| Foreign Address | 远端地址与端口 |
| State | 连接状态（LISTENING、ESTABLISHED 等） |
| PID | 占用该连接的进程 ID |

## 三、根据端口反查进程

想知道某个端口（例如 `8080`）被哪个进程占用，直接用 `findstr` 过滤：

```powershell
netstat -ano | findstr :8080
```

输出结果最后一列的 PID 就是目标进程。例如得到 PID 为 `1234`。

## 四、根据 PID 查任务详情

拿到 PID 后，再用 `tasklist` 精确查询该进程的名称：

```powershell
tasklist | findstr 1234
```

### 更直接的办法

也可以一步定位端口对应的进程名：

```powershell
for /f "tokens=5" %a in ('netstat -ano ^| findstr :8080') do tasklist | findstr %a
```

## 五、结束指定任务

确认进程可以关闭后，使用 `taskkill` 结束它。按 PID 结束：

```powershell
taskkill /pid 1234 /f
```

按进程名结束（会结束所有同名进程）：

```powershell
taskkill /im java.exe /f
```

> 参数 `/f` 表示强制终止。操作前请确认进程确实可以关闭，避免误杀系统进程。

## 六、小结

- `tasklist` —— 查看运行中的任务
- `netstat -ano` —— 查看端口与 PID
- `netstat -ano | findstr :端口` —— 端口反查 PID
- `taskkill /pid 进程ID /f` —— 结束进程

掌握这几条命令，就能在 Windows 下快速定位「端口被谁占用」这类常见问题。
