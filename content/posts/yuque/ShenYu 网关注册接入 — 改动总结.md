---
title: 'ShenYu 网关注册接入 — 改动总结'
urlname: 'vaufxl2kgy7x30up'
date: '2026-07-06 14:36:51'
updated: '2026-07-18 16:02:43'
tags:
  - 微服务
  - ShenYu
  - 网关
  - 云原生
description: '将应用作为 ShenYu client，启动时上报 HTTP 接口元数据，由 divide 插件统一转发。'
---
# ✅ ShenYu 网关注册接入 — 改动总结
已在分支 `feature/shenyu-register`(基于 `feature/0830`)完成全部改动，并通过实测验证注册成功。

## 一、核心目标
将 `erpm-pay-center` 作为 ShenYu client，启动时把 HTTP 接口元数据上报到 `shenyu-admin`(本地 Docker `apache/shenyu-admin:2.7.0.3`)，由 divide 插件统一转发外部流量。

## 二、关键决策（踩坑后定稿）
| 决策点 | 结论 | 依据 |
| --- | --- | --- |
| **ShenYu client 版本** | `2.6.1` | 2.7.x 需 SB3+JDK17，本项目 SB 2.3.12+JDK11 不兼容；2.6.1 兼容 SB2.x，且实测能成功注册到 2.7.0.3 admin |
| **配置结构** | 两层分离：`shenyu.register.*` + `shenyu.client.http.props.*` | 单层 `shenyu.client.registerType` 会导致 `registerType=null` → NPE |
| **本地禁用机制** | `spring.autoconfigure.exclude`（2.6.1 无 `enabled` 开关） | 反编译 2.6.1 确认 `ShenyuClientCommonBeanConfiguration` 无 `@ConditionalOnProperty` |
| **profile 设计** | 两个互斥本地 profile（local / regtest） | 实测 `exclude` 是**覆盖语义**，不能跨 profile 叠加 |


## 三、改动文件清单（本次新增/修改，共 7 处）
### 依赖层（2 处）
| 文件 | 改动 |
| --- | --- |
| `config.gradle` | 新增 `'shenyu': '2.6.1'` 版本变量 |
| `pay-host/build.gradle` | 新增 `shenyu-spring-boot-starter-client-springmvc:2.6.1` 依赖 |


### 代码层（4 处，4 个 Controller 加注解）
| 文件 | 注解 |
| --- | --- |
| `PayController.java` | `@ShenyuSpringMvcClient(path = "/v1/pay/**", desc = "支付接口")` |
| `RefundController.java` | `@ShenyuSpringMvcClient(path = "/v1/refund/**", desc = "退款接口")` |
| `CollectionClaimController.java` | `@ShenyuSpringMvcClient(path = "/api/v1/collectionClaim/**", desc = "收款认领接口")` |
| `ElectronicReceiptController.java` | `@ShenyuSpringMvcClient(path = "/api/v1/electronicReceipt/**", desc = "电子收据接口")` |


> `CallbackDemoController` 按计划未加注解，不注册。
>

### 配置层（3 个 profile 文件）
| 文件 | 用途 |
| --- | --- |
| `application-local.yml`（改） | exclude 恢复全量（K8s+RocketMQ+ShenYu），**日常本地纯离线开发**用 |
| `application-regtest.yml`（新增） | **本地测网关注册专用**，自包含：exclude 不含 ShenYu + 本地数据源/Redis + shenyu 注册配置 |
| `application-shenyu.yml`（新增） | **集群环境**用，仅 shenyu 注册配置（K8s 注入数据源） |


## 四、profile 使用矩阵
| 场景 | 启动命令 | 行为 |
| --- | --- | --- |
| 日常本地开发 | `--spring.profiles.active=global,local` | 零依赖 admin，纯离线 |
| **本地测网关注册** | `--spring.profiles.active=global,regtest` | ShenYu 启用 + 连本地 admin:9095 注册 |
| 集群环境 | `active=global,dev,shenyu` | K8s 注入，shenyu 注册 |


## 五、实测验证结果
查 shenyu-admin MySQL（库 `shenyu`）确认注册成功：

**selector 表**（2 条）：

```plain
/pay-center  (divide插件 + contextPath插件)
```

**meta_data 表**（4 条，4 个 Controller 全注册）：

```plain
pay-center  /pay-center/v1/pay/**                      http
pay-center  /pay-center/v1/refund/**                   http
pay-center  /pay-center/api/v1/collectionClaim/**      http
pay-center  /pay-center/api/v1/electronicReceipt/**    http
```

刷新 admin 页面 `http://localhost:9095/#/plug/Proxy/divide` 即可看到 `/pay-center` 选择器。

## 六、两个核心机制澄清（踩坑总结）
1. `spring.autoconfigure.exclude`** 是覆盖语义，非合并** —— 实测确认，后激活 profile 的 exclude 完全替换前者。所以 K8s/RocketMQ exclude 和 ShenYu exclude 不能分到两个 profile 叠加，必须同一文件自包含。
2. **ShenYu client 2.6.1 无配置开关** —— `ShenyuClientCommonBeanConfiguration` 类级无 `@ConditionalOnProperty`（2.7.0.1-jdk8 变体才有 `shenyu.register.enabled`），只能靠 `exclude` 关闭。

## 七、待办
+ 所有改动**未提交**，等你确认后我再 commit
+ contextPath `/pay-center`、`host`（10.19.236.150）等参数后续如需调整可直接改对应 profile 文件
+ 集群部署时需在 K8s configmap 确认 `spring.profiles.active` 含 `shenyu`，且 `shenyu.client.http.props.host` 注入真实 Pod IP

