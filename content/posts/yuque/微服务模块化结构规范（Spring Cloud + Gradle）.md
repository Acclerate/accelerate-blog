---
title: '微服务模块化结构规范（Spring Cloud + Gradle）'
urlname: 'tvlkb6yrmigp0iga'
date: '2026-07-06 14:37:11'
updated: '2026-07-06 14:37:11'
tags:
  - 微服务
  - Spring Cloud
  - 规范
description: '微服务模块化结构规范（Spring Cloud + Gradle）'
---
# 微服务模块化结构规范（Spring Cloud + Gradle）
## 一、模块划分与职责
每个微服务按功能拆分为五个核心模块：

| 模块 | 模块名 | 职责 | 典型内容 |
| --- | --- | --- | --- |
| 公共模块 | `${module}-common` | 定义公共常量、实体、工具类、方法执行时间监控等 | - util、Page、PageReq |
| 契约模块 | `${module}-contract` | 定义对外服务的业务接口和传输对象（DTO），供内部实现和外部客户端共享； | - 业务接口（如：OrderService）   - 响应（如：OrderDTO）   - 服务间请求DTO（如：OrderQueryDTO，无校验）   - 枚举、常量等； |
| 业务实现模块 | `${module}-biz` | 实现业务逻辑，包含数据访问、基础服务、聚合服务； | - Entity、Mapper、基础Service、聚合Service（实现contract模块中的接口）、内部转换器（Entity -> DTO）   - 前端专用Request（带@Valid或者@Validated校验）、VO |
| 应用启动模块 | `${module}-host` | Spring Boot应用入口，提供REST API，处理与前端或者其他微服务间交互； | - 两类Controller     1、内部Controller（/api/internal，返回DTO）     2、前端Controller（/api，返回VO）   - 转换器（Request -> DTO -> VO）   - 启动类 |
| 客户端模块 | `${module}-client` | 封装feign客户端，供其他微服务调用； | - Feign接口（指向host中的内部Controller）   - 服务间请求Request（带校验）   - Feign配置   - 依赖client |


## 二、模块依赖关系
+ contract模块：无任何依赖；
+ biz模块：依赖contract模块，实现其接口；
+ host模块：依赖biz和client模块，使用业务服务和客户端的请求对象；
+ client模块：依赖contract模块，使用其DTO；

**关键点：**

> **Important**
>
> host依赖client是为了使用其Request对象（服务间请求），但是client模块的feign接口不会在host内部被调用，client模块不依赖biz和host，保持代码纯净；
>

## 三、分层对象使用规范
| 对象类型 | 使用模块 | 包路径示例 | 是否含校验注解 |
| --- | --- | --- | --- |
| Entity | biz | `biz.domain.entity.OrderEntity` | 否 |
| 内部临时DTO | biz | `biz.domain.dto.AggDTO` | 否 |
| 服务间DTO（请求/响应） | contract | `contract.domain.dto.OrderCreateDTO`   `contract.domain.dto.OrderQueryDTO` | 否 |
| 服务间Request（带校验） | client | `client.domain.req.ClientOrderCreateReq`   `client.domain.request.ClientOrderQueryReq` | 是（如：@NotBlank） |
| 前端Request | host | `host.domain.request.OrderCreateReq`   `host.domain.request.OrderQueryReq` | 是（如：@NotEmpty） |
| 前端VO | host | `host.domain.vo.OrderVO`   `host.domain.vo.OrderWithDetailVO` | 否 |


**原则：**

1. 校验注解仅出现在两类Request中（client和host模块）。
2. DTO（含服务间请求）不含校验注解，保持纯净，避免框架依赖。
3. Entity仅限biz内部使用，不得暴漏给外部。

## 四、校验与分组处理
### 4.1 基础校验注解
`@NotNull`、`@NotBlank`、`@Size`、`@Min`、`@Max`等标准注解用于字段约束。  
在Controller方法参数前使用`@Valid`或`@Validated`触发校验。

### 4.2 @Valid vs @Validated
| 注解 | 规范 | 分组校验 | 嵌套校验 |
| --- | --- | --- | --- |
| `@Valid` | Bean Validation | 不支持 | 支持（配合@Valid标记） |
| `@Validated` | Spring 扩展 | 支持（通过value指定分组） | 不传播（需额外@Vailid） |


**使用建议：**

+ 前端Controller：若需要分组（如创建/更新），使用`@Validated`，并在嵌套字段上加`@Valid`。
+ Feign接口：仅支持`@Valid`，不支持分组，服务间请求尽量不使用分组。

### 4.3 分组校验示例
```java
// 分组接口
public interface CreateGroup {}
public interface UpdateGroup {}

// 请求对象
public class OrderReq {
    @NotNull(groups=UpdateGroup.class)
    private Long id;

    @NotBlank(groups={CreateGroup.class, UpdateGroup.class})
    private String billId;

    // 嵌套对象分组传播
    @Valid
    private List<OrderItermReq> itermList;
}

// Controller
@PostMapping("/api/order/create")
public OrderVO create(@Validated(CreateGroup.class) @RequestBody OrderReq req) {
    ...
}

@PostMapping("/api/order/update")
public Boolean update(@Validated(UpdateGroup.class) @RequestBody OrderReq req) {
    ...
}
```

### 4.4 嵌套校验与分组传播
+ 父对象使用`@Validated`指定分组时，嵌套对象（通过`@Valid`标记）会继承该分组，因此嵌套对象内部带有相同分组约束的字段会被校验。
+ 嵌套对象内部若使用了不同的分组，则只在匹配的分组下生效。
+ 若父对象使用`@Valid`（默认组），则嵌套对象只校验默认组约束。

### 4.5 Feign客户端与校验
+ Feign开启校验：`feign.validation.enabled=true`（默认开启）。
+ Feign接口参数上的`@Valid`会触发本地校验，但是不支持分组，只会校验默认组（即未指定groups的约束）。
+ 因此服务间请求对象（`client.domain.req.OrderCreateReq`）中的校验注解应避免使用分组。

### 4.6 全局异常处理
```java
/**
 * 约束违反异常
 *
 * @param e e
 * @return {@link Model }<{@link Void }>
 */
@ExceptionHandler(ConstraintViolationException.class)
public Model<Void> constraintViolationException(ConstraintViolationException e, HttpServletRequest request) {
    log.error(e.getMessage());
    String message = "";
    if (!e.getConstraintViolations().isEmpty()) {
        message = e.getConstraintViolations().stream().map(ConstraintViolation::getMessage)
            .filter(Objects::nonNull).collect(Collectors.joining(", "));
    }
    Model<Void> fail = Model.newFail(CommonErrorCode.TIPS_ERROR_CODE, message);
    buildAttributes(request, fail.getCode());
    return fail;
}

/**
 * 处理方法参数无效异常
 *
 * @param e e
 * @return {@link Model }<{@link Void }>
 */
@ExceptionHandler(MethodArgumentNotValidException.class)
public Model<Void> handleMethodArgumentNotValidException(MethodArgumentNotValidException e, HttpServletRequest request) {
    log.error(e.getMessage());
    String message = "";
    if (!e.getBindingResult().getAllErrors().isEmpty()) {
        message = e.getBindingResult().getAllErrors().stream().map(DefaultMessageSourceResolvable::getDefaultMessage)
            .filter(Objects::nonNull).collect(Collectors.joining(", "));
    }
    Model<Void> fail = Model.newFail(CommonErrorCode.TIPS_ERROR_CODE, message);
    buildAttributes(request, fail.getCode());
    return fail;
}
```

## 五、业务分层与代码组织
### 5.1 模块分包建议
```plain
📦 es-search-visit/ (拜访搜索服务) 【端口：8091 | 应用名：es-search-visit】
│
├── 📦 es-search-visit-common/ (公共模块)
│   └── src/main/java/com/jzt/es/search/visit/common/
│       ├── constant/    # 公共常量
│       │   └── Constants.java                    # 拜访公共常量
│       ├── enums/       # 公共枚举
│       │   └── VisitTypeEnum.java                # 拜访类型枚举
│       ├── util/        # 工具类
│       │   └── VisitUtils.java                   # 拜访工具类
│       └── exception/   # 业务异常（可选）
│           └── VisitException.java               # 拜访业务异常
│
│   💡 作用：存放 Contract 层和 Biz 层都需要引用的公共类
│   ⚠ 注意：不能反向依赖 Contract 或 Biz，避免循环依赖
│
├── 📦 es-search-visit-contract/ (契约层)
│   └── src/main/java/com/jzt/es/search/visit/contract/
│       ├── domain/dto/  # 数据传输对象
│       │   ├── VisitCustInfoDTO.java             # 拜访客户信息 DTO
│       │   └── VisitCustSearchDTO.java           # 拜访搜索 DTO
│       └── facade/      # 服务接口定义
│           └── IndicesFacadeService.java         # 索引管理服务接口
│
├── 📦 es-search-visit-biz/ (业务逻辑层)
│   └── src/main/java/com/jzt/es/search/visit/biz/
│       ├── constant/    # 常量定义
│       │   └── VisitErrorCode.java               # 拜访错误码
│       │
│       ├── feign/       # Feign 客户端（外部服务调用）
│       │   └── client/myaccount/                  # 我的账户 Feign 客户端
│       │       ├── MyAccountFeignClient.java
│       │       └── domain/VisitCustInfoDTO.java
│       │
│       ├── indices/     # ES 索引相关配置
│       │   ├── SearchIndexProperties.java         # 索引配置属性类
│       │   ├── IndicesNameEnum.java              # 索引名称枚举
│       │   ├── IndicesMapping.java               # 索引映射定义
│       │   ├── fields/                           # 字段定义
│       │   │   └── VisitCustIndexFieldEnum.java  # 拜访客户索引字段枚举
│       │   └── buildmanager/                     # DSL 构建管理器
│       │       └── VisitCustDslBuildManager.java # 拜访客户查询 DSL 构建器
│       │
│       └── service/     # 服务实现层
│           ├── basic/   # 基础服务层
│           │   └── impl/  # ⭐ 基础服务实现（空包，预留扩展）
│           │           # 用途：存放基础 CRUD 服务实现
│           │
│           └── facade/impl/  # 门面服务实现
│               ├── IndicesFacadeServiceImpl.java      # 索引管理服务实现
│               └── VisitCustSearchFacadeServiceImpl.java  # 拜访搜索服务实现
│
├── 📦 es-search-visit-host/ (启动服务层)
│   └── src/main/
│       ├── java/com/jzt/es/search/visit/host/
│       │   ├── EsVisitApplication.java               # Spring Boot 启动类
│       │   ├── controller/                           # Controller 层
│       │   │   ├── VisitCustController.java          # 拜访客户控制器
│       │   │   └── client/VisitCustApiController.java # API 控制器（兼容旧版）
│       │   ├── converter/                            # 转换器层（使用 MapStruct）
│       │   │   ├── DTOConverter.java                 # DTO ↔ VO 转换
│       │   │   └── QueryReqConverter.java            # 查询请求转换器
│       │   └── domain/                               # Host 层领域对象
│       │       ├── req/                              # 请求对象（前端传入）
│       │       │   └── VisitCustQueryReq.java        # 拜访客户查询请求
│       │       └── vo/                               # 视图对象（返回前端）
│       │           └── VisitCustInfoVO.java          # 拜访客户信息 VO
│       │
│       └── resources/
│           ├── application.yml                       # 主配置文件
│           ├── application-dev.yml                   # 开发环境配置
│           ├── application-test.yml                  # 测试环境配置
│           ├── application-pre.yml                   # 预发环境配置
│           └── application-prod.yml                  # 生产环境配置
│
├── 📦 es-search-visit-client/ (客户端层)
│   └── src/main/java/com/jzt/es/search/visit/client/
│       ├── domain/     # 客户端专用 DTO
│       │   └── ... (2 个文件)                        # 具体 DTO
│       └── feign/      # Feign 接口定义（目前为空）
│
└── src/test/           # 测试代码
    └── java/com/jzt/es/search/visit/
        ├── biz/
        │   ├── feign/client/myaccount/
        │   │   └── MyAccountFeignClientTest.java    # Feign 客户端测试
        │   └── service/impl/
        │       └── IndicesFacadeServiceTest.java    # 索引服务测试
        └── host/         # Host 层测试（如果有）
```

**职责：**

+ **基础服务**：封装单表操作，提供语义化方法（如`listByOrderId`），内部使用`lambdaQuery()`或自定sql。
+ **聚合服务**：调用基础服务，实现跨表业务逻辑，返回DTO。
+ **转换器**：统一处理Entity -> DTO、Req -> DTO、DTO -> VO的转换操作，避免业务层直接依赖Entity。

### 5.2 聚合服务与基础服务关系
+ 聚合服务不应该直接使用`lambdaQuery()`，应通过基础服务的语义化方法简介操作数据。
+ 聚合服务负责事务边界（`@Transactional`）、业务校验、缓存等。

### 5.3 Controller 双轨制
+ **内部Controller**（`/api/internal`）：可直接返回contract模块中的DTO，入参使用client模块中的Req（带校验）。
+ **前端Controller**（`/api`）：入参使用host模块中的Req（带校验），返回VO；

**示例：**

```java
// 内部Controller
@RestController
@RequestMapping("/api/order/internal")
public class OrderInternalController {
    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderQueryReqConverter converter;

    @GetMapping("/orders")
    public PageResult<OrderDTO> list(OrderQueryReq req) {
        OrderQueryDTO dto = converter.toDTO(OrderQueryReq);
        return orderService.list(dto);
    }
}
```

```java
// 前端Controller
@RequestMapping("/api/order/internal")
public class OrderInternalController {
    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderCreateReqConverter converter;

    @PostMapping("/create")
    public OrderVO create(@Valid @RequestBody OrderCreateReq req) {
        OrderCreateDTO createDTO = converter.toDTO(OrderCreateReq);
        OrderDTO orderDTO = orderService.create(createDTO);
        return converter.toVO(orderDTO);
    }
}
```

## 六、性能监控（切面）
为聚合服务层统一添加执行时间监控切面，可以放在公共模块中。

```java
package com.jzt.es.search.common.monitor;

import com.alibaba.fastjson.JSON;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StopWatch;

/**
 * @author caizhiming@jztey.com
 * @date 2026-03-31 09:52:23
 * <p>业务服务执行时间监控</p>

 */
@Aspect
@Component
public class FacadeServiceAspect {
    protected static final Logger logger = LoggerFactory.getLogger(FacadeServiceAspect.class);
    public static final long MONITOR_THRESHOLD = 300;

    @Around("execution(public * com.jzt.es.search.*.contract.service..*.*(..))")
    public Object round(ProceedingJoinPoint pjp) throws Throwable {
        MethodSignature methodSignature = (MethodSignature) pjp.getSignature();
        String methodName = methodSignature.getName();
        String methodSignatureSerial = String.format("%s#%s#%s"
            , pjp.getTarget().getClass().getSimpleName()
            , methodName, pjp.getArgs().length);
        StopWatch stopWatch = new StopWatch();
        stopWatch.start(methodSignatureSerial);
        Object result;
        try {
            result = pjp.proceed(pjp.getArgs());
        } finally {
            stopWatch.stop();
            final long elapsed = stopWatch.getTotalTimeMillis();
            if (elapsed >= MONITOR_THRESHOLD) {
                logger.warn("方法执行耗时超阈值，methodSignatureSerial={}，parameterTypes={}，elapsed={}ms"
                    , methodSignatureSerial, JSON.toJSONString(methodSignature.getParameterTypes()), elapsed);
            } else {
                logger.info("方法执行耗时，methodSignatureSerial={}，parameterTypes={}，elapsed={}ms"
                    , methodSignatureSerial, JSON.toJSONString(methodSignature.getParameterTypes()), elapsed);
            }
        }
        return result;
    }
}
```

**切点表达式说明：**

`execution(public * com.jzt.es.search.*.contract.service..*.*(..))` 匹配任何模块的聚合服务包。

## 七、Gradle依赖配置
### 7.1 选择原则
+ **api**：当依赖中的类型会被当前模块的公共API暴露给下游时使用（如：接口返回值、参数类型等）。
+ **implementation**：当依赖仅用于模块内部实现，不应被下游感知时使用。

### 7.2 依赖矩阵
| 依赖方 | common | contract | client | biz | host |
| --- | --- | --- | --- | --- | --- |
| common | ✅ | ❌ | ❌ | ❌ | ❌ |
| contract | ✅ | ✅ | ❌ | ❌ | ❌ |
| client | ✅ | ✅ | ❌ | ❌ | ❌ |
| biz | ✅ | ✅ | ✅ | ✅ | ❌ |
| host | ✅ | ✅ | ✅ | ✅ | ✅ |


> **注：** 原始PDF文档中host行的勾叉符号为空白（未填写），上表host行内容是根据文档"host模块：依赖biz和client模块"的描述及依赖传递关系推导补充的。
>

## 八、总结
本规范定义了微服务项目的标准模块结构、对象分层、校验策略、代码组织以及Gradle依赖配置。核心原则如下：

1. **模块职责单一**：contract（契约）、biz（实现）、host（入口）、client（客户端）。
2. **依赖单向**：依赖方向单向，避免循环。
3. **对象分层清晰**：Req -> DTO、Entity -> DTO -> VO。
4. **校验分组按需**：前端Controller使用`@Validated`，服务间请求避免分组。
5. **聚合服务为业务门面**：基础服务仅做数据访问。
6. **Gradle依赖**：api用于暴露给下游的类型，implementation用于内部实现。

