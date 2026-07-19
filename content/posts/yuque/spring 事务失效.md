---
title: 'spring 事务失效'
urlname: 'sn29th6uivpy0kf9'
date: '2023-07-04 23:03:59'
updated: '2023-07-18 00:35:25'
tags:
  - Spring
  - 事务
  - 踩坑
description: 'spring 事务失效'
---
### 1.方法不是public修饰
### 2.方法所在的类没有被spring管理
### 3.方法抛出的异常没有被spring事务捕捉
### 4.方法被同类中的其他方法捕获
### 5.@Transactional()的propagation属性设置为PROPAGETION.NEVER
### 6.@Transactional()的rollbackFor设置的Exception类型不适配




更进一步，事务的本质是什么



