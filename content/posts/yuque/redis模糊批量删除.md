---
title: 'redis模糊批量删除'
urlname: 'bgzmuvhkuv4a6lrt'
date: '2023-05-05 17:07:30'
updated: '2023-05-08 09:44:35'
tags:
  - Redis
  - 运维
description: 'redis模糊批量删除'
---
没有直接批量模糊删除的办法，只有模糊获取对应集合，批量删除

```java
	private static StringRedisTemplate stringRedisTemplateS;
	
	public static final String PREFIX = "dqs:";
    public static final String PREFIX_API = "api:";
	
	/**
     * 模糊匹配key 并删除
     * @param key
     */
    public static void deletLikeKeyStr(String key) {
        Set<String> keys = stringRedisTemplateS.keys(PREFIX+ key+ "*");
        stringRedisTemplateS.delete(keys);
    }
```

