---
title: 'Spring使用@Transactional 管理事务，Java事务详解。'
urlname: 'tor8sopfnd8f648z'
date: '2023-07-24 16:03:04'
updated: '2023-07-24 16:07:17'
tags:
  - Spring
  - 事务
description: '从 ACID 特性出发，介绍 Spring @Transactional 注解的声明式事务管理与 Java 事务基础。'
---
**Spring使用@Transactional 管理事务，Java事务详解。**

**一、什么是事务**

简单来说事务就是一组对数据库的操作要么都成功，要么都失败。事务要保证可靠性，必须具备四个特性：ACID。

A：原子性：事务是一个原子操作单元，要么完全执行，要么完全不执行。事务中的所有操作要么全部成功，要么全部失败，没有中间状态。

C：一致性：事务在执行前和执行后都必须保持数据库的一致性状态。

I：隔离性：事务的隔离性确保并发执行的事务彼此不会相互干扰。

D：一致性：一旦事务提交，其结果应该是永久性的，即使在系统故障的情况下也是如此。

**二、什么是声明事务，什么是编程事务**

**声明事务**

声明式事务是通过配置的方式来管理事务的行为，声明式事务的好处是可以将事务管理与业务逻辑相分离，提高了代码的可读性和维护性。

**编程事务**

编程式事务是通过**编写代码显式地管理事务的开始、提交和回滚**。使用编程式事务可以更加灵活地控制事务的细节，但需要更多的代码来处理事务管理，可能导致代码的冗余和增加了复杂性。

**三、Spring 如何实现声明事务和编程事务的**

**声明事务**

声明事务的代码很简单，我们也是经常使用的。

| ```java import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional;  @Service public class UserService {      @Transactional     public void performTransaction() {         // 事务逻辑     } } ```  |
| --- |


**编程事务**

编程事务，需要自己来控制事务的流程，更加灵活但也更加复杂，一般不建议使用。（实际上我也没在生产环境中用过）

| ```java import org.springframework.beans.factory.annotation.Autowired; import org.springframework.stereotype.Service; import org.springframework.transaction.TransactionStatus; import org.springframework.transaction.support.TransactionCallbackWithoutResult; import org.springframework.transaction.support.TransactionTemplate;  @Service public class TransactionService {      private final TransactionTemplate transactionTemplate;      @Autowired     public TransactionService(TransactionTemplate transactionTemplate) {         this.transactionTemplate = transactionTemplate;     }      public void performTransaction() {         transactionTemplate.execute(new TransactionCallbackWithoutResult() {             protected void doInTransactionWithoutResult(TransactionStatus status) {                 try {                     // 事务逻辑                 } catch (Exception e) {                     status.setRollbackOnly();                     throw e;                 }             }         });     } } ```  |
| --- |


**四、声明事务是怎么实现的**

虽然我们实现事务的方式有声明式和编程式，但在实际的使用中，我们只会用声明式，所以我们有必要来深入理解一下声明事务。

其实简单来说在Spring中，我们开启声明事务用的是 @Transactional ，本质上是使用的 代理和AOP来实现。

事务拦截器链（Interceptor Chain）：Spring的声明式事务依赖于AOP技术，在运行时动态生成代理对象并创建事务拦截器链。在方法调用链中，每个事务拦截器都会被依次调用，并根据事务属性的定义决定是否开启、提交或回滚事务。

事务切点（Transaction Pointcut）：事务切点定义了哪些方法需要被事务拦截器拦截并应用事务逻辑。切点通过表达式语言（如Spring表达式语言）或基于注解的方式来指定匹配的方法。Spring提供了灵活的切点表达式来满足各种粒度的事务控制需求。

事务属性解析：在声明式事务中，事务属性可以通过注解（如@Transactional）或配置文件来指定。事务属性包括隔离级别、传播行为、超时设置等。Spring会解析事务属性，并将其应用于方法上，以确定事务的行为。事务属性解析器根据事务定义的优先级，从全局配置或方法级别的注解中获取事务属性。

事务管理器（Transaction Manager）：事务管理器是Spring框架的核心组件之一。它负责处理实际的事务管理操作，与底层的数据访问技术（如JDBC、Hibernate等）进行交互。事务管理器负责事务的创建、提交和回滚，并与当前线程进行绑定。Spring提供了多种事务管理器的实现，如DataSourceTransactionManager、JpaTransactionManager等，可以根据具体的数据访问技术进行配置。

事务同步器（Transaction Synchronization）：事务同步器用于在事务的不同阶段注册回调方法。在事务提交或回滚时，事务同步器会触发注册的回调方法，以执行一些额外的操作。例如，清理数据库连接、提交缓存数据等。Spring利用事务同步器来确保与事务相关的资源的正确管理和释放。

事务切面（Transaction Aspect）：事务切面是由事务拦截器和事务切点组成的，它定义了在目标方法执行前后应用事务逻辑的规则。事务切面通过AOP技术将事务管理逻辑与业务逻辑进行解耦。当目标方法被调用时，事务切面会根据事务属性的定义，决定是否开启、提交。

**五、@Transactional 注解的参数**

在声明事务中，我们只需要和注解 @Transactional 打交道，所以我们有必要来深入理解一下这个注解中的参数配置。

| ```java public @interface Transactional {     @AliasFor("transactionManager")     String value() default "";          // 事务管理器、暂时先忽略它，我们也不会去修改这个参数的值     @AliasFor("value")     String transactionManager() default "";      String[] label() default {};          // 事务传播行为     Propagation propagation() default Propagation.REQUIRED;          // 事务隔离级别     Isolation isolation() default Isolation.DEFAULT;          // 事务超时时间 -1，为永久不超时， 单位是秒     int timeout() default -1;          // 事务超时时间，可以设置单位，比如 timeoutString = "30s"     String timeoutString() default "";          // 是否只读事务     boolean readOnly() default false;          // 对哪些异常进行回滚     Class<? extends Throwable>[] rollbackFor() default {};          // 对哪些异常进行回滚【异常全限定名】     String[] rollbackForClassName() default {};          // 对哪些异常不回滚     Class<? extends Throwable>[] noRollbackFor() default {};          // 对哪些异常不回滚【异常全限定名】     String[] noRollbackForClassName() default {}; } ```  |
| --- |


rollbackFor和rollbackForClassName的区别，直接来看使用方式。 最好使用rollbackFor 可以在编译的时候就帮我买检查是不是对的。

| ```java @Transactional(rollbackFor = Exception.class, rollbackForClassName = {"java.lang.Exception"}) ```  |
| --- |


@Transactional 注解的参数虽然多，但绝大部分都很好理解。这里主要是来说两个重要且不好理解的参数propagation  和 isolation

**propagation (事务传播行为)**

事务的传播行为是指：当前事务方法被调用的时候，需要做什么样的操作。它的配置如下：

| **值**_**（小写方便阅读）**_ | **描述** |
| :--- | :--- |
| **REQUIRED**_（required）_<br/>**默认值** | 如果当前没有事务，则创建一个新的事务，并将当前方法作为事务的起点。<br/>**如果当前已经存在事务，则加入到当前事务中，成为当前事务的一部分。**<br/>当前事务的提交和回滚都将影响到该方法。 |
| **REQUIRES_NEW **_(requires_new)_ | 无论当前是否存在事务，都创建一个新的事务。<br/>如果当前存在事务，则将当前事务挂起，并启动一个新的事务。<br/>当前方法独立于外部事务运行，它有自己的事务边界。 |
| **SUPPORTS**_（supports）_ | **如果当前存在事务，则加入到当前事务中，成为当前事务的一部分。**<br/>如果当前没有事务，则以非事务方式执行。<br/>支持当前事务的执行，但不强制要求存在事务。 |
| **NOT_SUPPORTED **_(not_supported)_ | 以非事务方式执行操作。<br/>如果当前存在事务，则将其挂起。<br/>该方法在一个没有事务的环境中执行。 |
| **NEVER**_（never）_ | 以非事务方式执行操作。<br/>如果当前存在事务，则抛出异常，表示不允许在事务中执行该方法。 |
| **MANDATORY**_（mandatory）_ | 要求当前存在事务，否则抛出异常。<br/>该方法必须在一个已经存在的事务中被调用。 |
| **NESTED **_(nested)_ | 如果当前存在事务，则在嵌套事务中执行。<br/>如果当前没有事务，则行为类似于 REQUIRED，创建一个新的事务。 |


存在事务的时候REQUIRED和NESTED的区别：REQUIRED 是加入当前事务，成为当前事务的一部分，NESTED 是生成嵌套事务，本质上是两个事务。（具体区别下面实践演示）

**isolation（事务隔离级别）**

其实就是我们之前学习数据库时候的数据库隔离级别了。

| **值**_**（小写方便阅读）**_ | **描述** |
| :--- | :--- |
| **DEFAULT**_ （default）_ | 默认的，看当前数据库默认的隔离级别是什么 |
| **READ_UNCOMMITTED **_（read_uncommitted）_ | 读未提交 |
| **READ_COMMITTED **_(read_committed)_ | 读已提交 |
| **REPEATABLE_READ **_(repeatable_read)_ | 可重复读 |
| **SERIALIZABLE **_(serializable)_ | 序列化 |


**六、@Transactional 实践**

在使用 @Transactiona 注解的时候，一定要设置rollbackFor的值，默认情况下是不回滚的检查类异常，比如 IOException、SQLException 等。

**理论**

在深入理解事务的传播行为之前，我们需要理解三个基本的概念，理解了它们我们就理解了事务传播行为。它们分别是：嵌套事务、新事务、当前事务。

为了理解方便，这里我们先约定一下，有两个事务方法A和B，在A里面调用B。且A事务的定义如下不会改变，B事务的传播行为可能会变。

| ```java @Transactional(rollbackFor = Exception.class) public void A() {     userMapper.insertUser("A",1);     sqlTestService.B(); }  public void B() {     userMapper.insertUser("B",2); } ```  |
| --- |


**嵌套事务**

修改B事务的传播行为，让它生成嵌套事务

| ```java @Transactional(rollbackFor = Exception.class, propagation = Propagation.NESTED) ```  |
| --- |


嵌套事务和父事务是有关联的，当A事务回滚的时候，B事务一定回滚。

当B事务异常回滚的时候，要判断在A里面是否try了B事务，如果try就A不会回滚，只是B回滚。

**新事务**

修改B事务的传播行为，让它生成新事务

| ```java @Transactional(rollbackFor = Exception.class, propagation = Propagation.REQUIRES_NEW) ```  |
| --- |


既然都说了是新事务，那A、B事务没有什么必然的关系了。

**当前事务**

修改B事务的传播行为，让它加入当前事务

| ```java @Transactional(rollbackFor = Exception.class, propagation = Propagation.REQUIRED)  @Transactional(rollbackFor = Exception.class, propagation = Propagation.SUPPORTS) ```  |
| --- |


既然说是加入当前事务，那其实本质上还是一个事务，不管怎么样的异常，也不管如何处理异常，A、B方法都是一起提交、或一起回滚。

**实践**

insertUser 方法就是一个简单的插入语句，为了避免误会，这里直接给出来。

| <font style="color:rgb(100, 106, 115);">Java</font>@Insert("INSERT INTO t_users (`name`, `age`) VALUES (#{name}, #{age})")   void insertUser(@Param("name") String name,@Param("age") Integer age); |
| :--- |


异常的话，是直接手动抛出一个异常

| <font style="color:rgb(100, 106, 115);">Java</font>throw new RuntimeException("xxxxx"); |
| :--- |


**B方法是否try：**是指在A方法调用B方法的时候，是否使用了try catch 如下：

| ```java public void A() {     userMapper.insertUser("A",1);     try {         sqlTestService.B();     }catch (Exception e) {         e.printStackTrace();     } } ```  |
| --- |


代码很简单，来回变换很多，就不展示了，直接给执行结果：

| B事务类型 | 异常方法 | B方法是否try | 插入数据结果 |
| :--- | :--- | :--- | :--- |
| 新事务 | A方法 | 否 | B |
| 新事务 | A方法 | 是 | B |
| 新事务 | B方法 | 否 | 空 |
| 新事务 | B方法 | 是 | A |
| 嵌套事务 | A方法 | 否 | 空 |
| 嵌套事务 | A方法 | 是 | 空 |
| 嵌套事务 | B方法 | 否 | 空 |
| 嵌套事务 | B方法 | 是 | A |
| 加入当前事务 | A方法 | 否 | 空 |
| 加入当前事务 | A方法 | 是 | 空 |
| 加入当前事务 | B方法 | 否 | 空 |
| 加入当前事务 | B方法 | 是 | 空 |


