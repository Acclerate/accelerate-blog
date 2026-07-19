---
title: Spring boot自定义注解实现接口缓存
urlname: pveg5i87kvglq1v7
date: '2023-04-17 14:29:05'
updated: '2023-04-17 15:36:30'
---
<font style="color:rgb(36, 41, 46);background-color:rgb(251, 251, 251);">结合</font>**<font style="background-color:rgb(251, 251, 251);">spring boot aop切片编程</font>**<font style="color:rgb(36, 41, 46);background-color:rgb(251, 251, 251);">的特性，采取</font>**<font style="background-color:rgb(251, 251, 251);">自定义注解</font>**<font style="color:rgb(36, 41, 46);background-color:rgb(251, 251, 251);">的形式，借助</font>**<font style="background-color:rgb(251, 251, 251);">缓存redis</font>**<font style="color:rgb(36, 41, 46);background-color:rgb(251, 251, 251);">实现接口缓存，提高稳定接口访问效率</font>

## <font style="color:rgb(36, 41, 46);">自定义注解</font>
```java
/**
 * 接口缓存自定义注解
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface ApiCache {
    // 缓存时间，默认缓存一分钟
    long validityPeriod() default 60;
}
```

## <font style="color:rgb(36, 41, 46);">定义切入点</font>
```java
package cn.hsa.neu.dqs.common.aop;


import cn.hsa.hsaf.core.framework.util.DateUtil;
import cn.hsa.neu.dqs.common.utils.CacheUtil;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.Signature;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.ResponseBody;

import java.lang.reflect.Method;
import java.util.Arrays;

@Slf4j
@Aspect
@Component
public class ApiCacheAspect {

	@Autowired
	CacheUtil cacheUtil;


	@Around("@annotation(cn.hsa.neu.dqs.common.aop.ApiCache)")
	public Object action(ProceedingJoinPoint joinPoint) throws Throwable {

		String bizDate = DateUtil.getCurrentDate_String(DateUtil.DATEFORMAT);

		Signature signature = joinPoint.getSignature();

		// 反射获取目标类名
		String className = joinPoint.getTarget().getClass().getName();
		// 获取目标方法的名称
		String methodName = signature.getName();
		// 获取方法传入参数
		String params = Arrays.toString(joinPoint.getArgs());
		// 合成键值
		String key = className+":"+methodName+":"+bizDate+":"+params;
		// 被切的方法 返回类型
		Class<?> methodReturnType = Object.class;
		if (signature instanceof MethodSignature) {
			MethodSignature methodSignature = (MethodSignature) signature;
			// 被切的方法
			Method method = methodSignature.getMethod();
			// 返回类型
			methodReturnType = method.getReturnType();
		}

		// 获取注解的方法
		Method method = ((MethodSignature) joinPoint.getSignature()).getMethod();
		ApiCache annotation = method.getAnnotation(ApiCache.class);
		// 获取缓存有效期
		 long validityPeriod = annotation.validityPeriod();
		// 获取缓存的接口返回值
		Object response = CacheUtil.getStr(key);
		if(response == null){
			// 如果没有缓存接口返回值则执行原方法
			log.info(key+":cache get!");
			response = joinPoint.proceed();
			// 保存缓存
			CacheUtil.putStrWithTimeout(key, JSON.toJSONString(response),validityPeriod);
		}else{
			// 否则直接从缓存中获取接口返回值
			response=JSONObject.parseObject(response.toString(), methodReturnType);
		}
		return response;
	}
}

```

## <font style="color:rgb(36, 41, 46);">示例</font>
<font style="color:rgb(36, 41, 46);">使用时直接在需要配置接口缓存的接口controller/service上加上刚才定义的自定义注解即可。（可通过参数validityPeriod配置缓存有效时间）</font>

```java
@ApiCache(validityPeriod = 60*60*12)// 接口缓存12小时
@PostMapping("/test")
public Object test(Object input) throws Exception {
    ...
}
```

