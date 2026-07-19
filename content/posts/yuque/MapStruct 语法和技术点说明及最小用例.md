---
title: MapStruct 语法和技术点说明及最小用例
urlname: fhhxfm1m04zy0zdz
date: '2026-07-06 14:36:46'
updated: '2026-07-06 14:36:46'
---
### 一、 MapStruct 语法和技术点说明及最小用例
这段代码中主要用到了以下 5 个 MapStruct 的核心特性：

#### 1. `@Mapper` 注解与 `componentModel`
**说明**：`componentModel = "spring"` 会让 MapStruct 生成的实现类带上 `@Component` 注解，从而可以被 Spring 容器管理并依赖注入。  
**最小用例**：

```java
// 源
public class UserDTO { private String name; }
// 目标
public class UserVO { private String name; }
// 定义 Mapper
@Mapper(componentModel = "spring")
public interface UserMapper {
    UserVO toVO(UserDTO dto);
}
// 生成的实现类大概长这样：
// @Component
// public class UserMapperImpl implements UserMapper { ... }
```

#### 2. 多源参数映射
**说明**：MapStruct 支持在一个方法中传入多个源对象，并通过 `参数名.属性名` 的方式指定映射来源。  
**最小用例**：

```java
public class UserDTO { private String name; }
public class RoleDTO { private String roleName; }
public class UserVO { private String name; private String roleName; }
@Mapper(componentModel = "spring")
public interface UserMapper {
    @Mapping(target = "name", source = "userDTO.name")
    @Mapping(target = "roleName", source = "roleDTO.roleName")
    UserVO toVO(UserDTO userDTO, RoleDTO roleDTO);
}
```

#### 3. 深层属性映射
**说明**：当目标属性需要从源对象的嵌套对象中获取时，可以直接使用 `.` 进行层级访问（如 `refundCreateDTO.requestHeader.appKey`）。  
**最小用例**：

```java
public class RequestHeader { private String appKey; }
public class UserDTO { private RequestHeader requestHeader; }
public class UserVO { private String appKey; }
@Mapper(componentModel = "spring")
public interface UserMapper {
    @Mapping(target = "appKey", source = "userDTO.requestHeader.appKey")
    UserVO toVO(UserDTO userDTO);
}
```

#### 4. 表达式映射 (`expression`)
**说明**：当无法通过简单的属性对应来赋值，或者需要调用某些静态方法、常量时，可以使用 `expression = "java(...)"`。结合 `imports` 属性可以省略包名。  
**最小用例**：

```java
public class UserDTO { private String name; }
public class UserVO { private String name; private String defaultStatus; }
// 导入 StatusEnum 避免在 expression 里写全限定名
@Mapper(componentModel = "spring", imports = StatusEnum.class)
public interface UserMapper {
    @Mapping(target = "name", source = "name")
    // 直接写 Java 代码赋值
    @Mapping(target = "defaultStatus", expression = "java(StatusEnum.INIT.getCode())")
    UserVO toVO(UserDTO dto);
}
```

#### 5. 自定义转换方法 (`@Named` + `qualifiedByName`)
**说明**：对于复杂的类型转换（如本例中的 `LocalDateTime` 转 `String`），可以在 Mapper 接口中写一个 `default` 方法并打上 `@Named("别名")`，然后在 `@Mapping` 中通过 `qualifiedByName = "别名"` 引用它。  
**最小用例**：

```java
public class UserDTO { private LocalDateTime createTime; }
public class UserVO { private String createTimeStr; }
@Mapper(componentModel = "spring")
public interface UserMapper {
    
    @Mapping(target = "createTimeStr", source = "createTime", qualifiedByName = "formatTime")
    UserVO toVO(UserDTO dto);
    @Named("formatTime")
    default String formatTime(LocalDateTime time) {
        return time == null ? null : time.toString();
    }
}
```



### 二、 MapStruct 高级用法来自定义转换规则
在 MapStruct 中，当默认的类型转换无法满足复杂的业务需求时，可以通过多种高级用法来自定义转换规则。结合你提到的“具体实现”，以下是 MapStruct 中最常用的几种自定义转换方式及其代码实现：

### 1. 使用 `@Named` 和 `qualifiedByName` (最常用)
适用于：**单个字段**的复杂转换逻辑（如枚举转字符串、布尔值转特定中文等）。  
**实现方式**：在 Mapper 接口中定义一个自定义方法，使用 `@Named` 注解命名，然后在 `@Mapping` 中通过 `qualifiedByName` 引用。

```java
@Mapper
public interface UserMapper {
    UserMapper INSTANCE = Mappers.getMapper(UserMapper.class);
    // 定义自定义转换方法
    @Named("boolToStr")
    default String boolToStr(Boolean isActive) {
        if (isActive == null) return "未知";
        return isActive ? "是" : "否";
    }
    // 引用自定义转换方法
    @Mapping(source = "isActive", target = "activeDesc", qualifiedByName = "boolToStr")
    UserDTO toDto(UserEntity entity);
}
```

### 2. 使用默认方法 (基于类型的自动匹配)
适用于：**同类型转换**的复用。当你提供一个从 `TypeA` 转换到 `TypeB` 的方法时，MapStruct 会自动在所有包含该类型映射的地方调用它。  
**实现方式**：直接在接口中定义 `default` 方法。

```java
@Mapper
public interface OrderMapper {
    OrderMapper INSTANCE = Mappers.getMapper(OrderMapper.class);
    // MapStruct 会自动识别这里的 Money -> BigDecimal 转换
    default BigDecimal moneyToBigDecimal(Money money) {
        if (money == null || money.getAmount() == null) return BigDecimal.ZERO;
        return money.getAmount().setScale(2, RoundingMode.HALF_UP);
    }
    // 这里不需要特别指定，MapStruct 会根据类型自动匹配 moneyToBigDecimal 方法
    OrderDTO toDto(OrderEntity entity);
}
```

### 3. 引用外部自定义类 (`uses` 属性)
适用于：转换逻辑比较复杂，包含较多代码，或者需要被多个 Mapper 共享时，不想把代码全塞在 Mapper 接口里。  
**实现方式**：创建一个普通的 Spring Bean 或工具类，在 `@Mapper` 的 `uses` 属性中引入。

```java
// 1. 自定义转换器类
@Component
public class DateConverter {
    
    public String formatDate(LocalDateTime dateTime) {
        if (dateTime == null) return "";
        return dateTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }
}
// 2. 在 Mapper 中引用
@Mapper(componentModel = "spring", uses = DateConverter.class)
public interface ProductMapper {
    
    // MapStruct 会自动去 DateConverter 中寻找 LocalDateTime -> String 的方法
    @Mapping(source = "createTime", target = "createTimeStr")
    ProductDTO toDto(ProductEntity entity);
}
```

### 4. 使用 `expression` 表达式 (内联代码)
适用于：非常简单的逻辑，或者需要调用某些静态工具类的方法时。**注意：不推荐写复杂逻辑，因为是在字符串里写 Java 代码，没有编译期检查。**  
**实现方式**：使用 `expression = "java(...)"`。

```java
@Mapper
public interface LogMapper {
    
    @Mapping(target = "logId", expression = "java(UUID.randomUUID().toString())")
    @Mapping(target = "content", source = "message")
    LogDTO toDto(LogEntity entity);
}
```

### 5. 前置和后置处理 (`@BeforeMapping` / `@AfterMapping`)
适用于：在映射**之前**或**之后**对目标对象进行统一的修改、设置默认值、记录日志或权限校验等。  
**实现方式**：在接口中定义带有 `@BeforeMapping` 或 `@AfterMapping` 注解的方法，并使用 `@MappingTarget` 修饰目标对象。

```java
@Mapper(componentModel = "spring")
public abstract class CustomerMapper { // 此处用 abstract class 更方便写复杂逻辑
    @BeforeMapping
    protected void beforeMapping(CustomerEntity entity) {
        // 映射前的处理，例如打日志、参数预处理
        if (entity != null && entity.getName() != null) {
            entity.setName(entity.getName().trim());
        }
    }
    @Mapping(source = "name", target = "fullName")
    public abstract CustomerDTO toDto(CustomerEntity entity);
    @AfterMapping
    protected void afterMapping(CustomerEntity entity, @MappingTarget CustomerDTO dto) {
        // 映射后的处理，例如计算额外字段
        if (entity.getAge() != null && entity.getAge() >= 18) {
            dto.setAdult(true);
        } else {
            dto.setAdult(false);
        }
    }
}
```

### 6. 多参数映射与 `@Context` 上下文传递 (高级)
适用于：源数据来自多个对象，或者在转换过程中需要传递一些上下文参数（如当前登录用户 ID）。  
**实现方式**：直接在映射方法中传入多个参数，MapStruct 会自动匹配参数名和属性名。`@Context` 用于传递不参与属性映射，但影响转换逻辑的参数。

```java
@Mapper
public interface DocumentMapper {
    
    // 将 user 和 file 合并映射到 DocumentDTO
    // currentUserId 只作为上下文传递
    @Mapping(source = "user.name", target = "ownerName")
    @Mapping(source = "file.filePath", target = "path")
    void mapToDto(User user, FileEntity file, @Context String currentUserId, @MappingTarget DocumentDTO dto);
    // 自定义方法可以通过 @Context 接收上下文
    default String formatPath(String path, @Context String currentUserId) {
        return currentUserId + ":" + path;
    }
}
```

### 总结与最佳实践
1. **优先使用 MapStruct 默认能力**：名字相同、类型兼容的属性不需要写任何代码。
2. **单个字段转换**：用 `@Named` 或 `expression`。
3. **跨多个实体复用的转换逻辑**：用 `default` 方法或抽离出独立的工具类配合 `uses = XXX.class`。
4. **需要对整个目标对象做补充处理**：用 `@AfterMapping`。
5. **避免滥用 **`expression`：它破坏了类型安全和编译检查，仅在极简场景（如生成 UUID）下使用。

