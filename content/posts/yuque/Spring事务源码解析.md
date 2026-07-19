---
title: 'Spring事务源码解析'
urlname: 'ml5cl16puki1wtno'
date: '2023-07-24 15:57:50'
updated: '2023-07-24 15:59:37'
tags:
  - Spring
  - 事务
  - 源码
description: '深入 Spring 声明式事务源码，解析基于 AOP 的代理对象生成与事务拦截流程。'
---
**Spring事务源码解析**

****

上一篇文章我们已经知道了Java中Spring的事务，尤其是声明事务，这篇文章我们来深入探讨一下Spring的声明事务是如何实现的。

首先**Spring的声明事务是基于AOP实现**的，说到AOP我们就要搞清楚两点：

何时何地基于什么规则生成的代理对象

生成了代理对象后，拦截器做了什么

Spring事务代码都在 spring-tx 下面，所以我们也是着重看这块的代码。

![](https://cdn.nlark.com/yuque/0/2023/png/28708807/1690185470651-df0c2425-497f-49bd-8930-6dbbe59d0bf6.png)

**一、何时何地生成的代理对象**

_<font style="color:#646A73;">简单来说代理对象生成的过程：容器启动的时候会往容器中注入两个bean</font>_

_<font style="color:#646A73;">一个 Advisor，它包含advice和pointcut</font>_

_<font style="color:#646A73;">advice 就是一个拦截器，拦截到执行的方法后就去做事务处理。</font>_

_<font style="color:#646A73;">pointcut 会拦截使用 @Transaction 的方法。</font>_

_<font style="color:#646A73;">一个后置处理器，它是实现了BeanPostProcessor的bean，重写了postProcessAfterInitialization 方法，这个后置处理器会遍历容器中所有的bean ，判断当前容器里面有没有满足自己的Advisor，如果有就基于此生成代理对象。</font>_

**1、事务的开始（EnableTransactionManagement）**

在Spring的环境下，我们要开启一个新的东西，都会使用 @Enablexxx 注解，事务的开始我们使用的是 @EnableTransactionManagement ，它的位置如下：

![](https://cdn.nlark.com/yuque/0/2023/png/28708807/1690185471073-09dca30c-9291-4b9d-94ec-1cce6be1d4c8.png)

| ```java Javapackage org.springframework.transaction.annotation;  @Target(ElementType.TYPE) @Retention(RetentionPolicy.RUNTIME) @Documented @Import(TransactionManagementConfigurationSelector.class) public @interface EnableTransactionManagement {     boolean proxyTargetClass() default false;         // 这里默认是 AdviceMode.PROXY 下面会用到    AdviceMode mode() default AdviceMode.PROXY;         // 优先级为最低    int order() default Ordered.LOWEST_PRECEDENCE; } ```  |
| --- |


在上面的代码中使用了@Import，Spring运行的时候将会去运行这个注解中的类。

注：在SpringBoot环境下，它会被自动开启。（有兴趣可以自行研究为何自动开始）

**2、向容器中注入Advisor和后置处理器 （TransactionManagementConfigurationSelector）**

![](https://cdn.nlark.com/yuque/0/2023/png/28708807/1690185471537-1fcf55d8-cbfb-406e-8892-66c9c36a7757.png)

通过继承关系，得知TransactionManagementConfigurationSelector本质上是一个ImportSelector，而ImportSelector是导入bean到Spring容器里面。

| <font style="color:rgb(100, 106, 115);">Java</font>public class TransactionManagementConfigurationSelector extends AdviceModeImportSelector<EnableTransactionManagement> {         @Override      protected String[] selectImports(AdviceMode adviceMode) {         // 通过上面的注解我们知道 adviceMode的默认值是 PROXY         switch (adviceMode) {            case PROXY:               return new String[] {AutoProxyRegistrar.class.getName(),                     ProxyTransactionManagementConfiguration.class.getName()};            case ASPECTJ:               return new String[] {determineTransactionAspectClass()};            default:               return null;         }      }   } |
| :--- |


TransactionManagementConfigurationSelector 重写了导入的方法 selectImports 导入了两个类

AutoProxyRegistrar    后置处理器

ProxyTransactionManagementConfiguration   Advisor

**1、注入后置处理器（AutoProxyRegistrar）**

![](https://cdn.nlark.com/yuque/0/2023/png/28708807/1690185471834-b46f0c62-c154-44f2-882a-ac9234339afd.png)

AutoProxyRegistrar 实现了ImportBeanDefinitionRegistrar 重写了registerBeanDefinitions 方法。该方法最终注入了InfrastructureAdvisorAutoProxyCreator

| <font style="color:rgb(100, 106, 115);">Java</font>public void registerBeanDefinitions(AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry) {      boolean candidateFound = false;      Set<String> annTypes = importingClassMetadata.getAnnotationTypes();      for (String annType : annTypes) {          // ...                    AopConfigUtils.registerAutoProxyCreatorIfNecessary(registry);      }      // ...   }      @Nullable   public static BeanDefinition registerAutoProxyCreatorIfNecessary(         BeanDefinitionRegistry registry, @Nullable Object source) {         return registerOrEscalateApcAsRequired(InfrastructureAdvisorAutoProxyCreator.class, registry, source);   } |
| :--- |


**1-1、InfrastructureAdvisorAutoProxyCreator**

![](https://cdn.nlark.com/yuque/0/2023/png/28708807/1690185472090-faca01de-8dcf-469b-bce7-30c247f64b2c.png)

它的继承关系很复杂，只需要知道它最终间接的实现了BeanPostProcessor 接口，在AbstractAutoProxyCreator中重写了 postProcessAfterInitialization方法。该方法就是bean后置处理器，在这里的作用就是用来处理需要代理的对象。

| <font style="color:rgb(100, 106, 115);">Java</font>public Object postProcessAfterInitialization(@Nullable Object bean, String beanName) {      if (bean != null) {         Object cacheKey = getCacheKey(bean.getClass(), beanName);         if (this.earlyProxyReferences.remove(cacheKey) != bean) {            return wrapIfNecessary(bean, beanName, cacheKey);         }      }      return bean;   }         protected Object wrapIfNecessary(Object bean, String beanName, Object cacheKey) {      // ...      // 拿当前bean去匹配容器中的 Advisors，如果找到符合的就生成代理对象      // Create proxy if we have advice.        Object[] specificInterceptors = getAdvicesAndAdvisorsForBean(bean.getClass(), beanName, null);      if (specificInterceptors != DO_NOT_PROXY) {         this.advisedBeans.put(cacheKey, Boolean.TRUE);         Object proxy = createProxy(               bean.getClass(), beanName, specificInterceptors, new SingletonTargetSource(bean));         this.proxyTypes.put(cacheKey, proxy.getClass());         return proxy;      }         this.advisedBeans.put(cacheKey, Boolean.FALSE);      return bean;   } |
| :--- |


**2、注入Advisor （ProxyTransactionManagementConfiguration）**

**上面我们说bean会从容器里面找符合的Advisor来生成代理对象，这里我们就是来生成Advisor的。**

这个类注册了三个Bean

TransactionInterceptor 这个其实就是AOP的拦截器了，也就是生成了对象所要执行时候的增强方法。

AnnotationTransactionAttributeSource  事务注解属性。

BeanFactoryTransactionAttributeSourceAdvisor ** Advisor=切点（Pointcut）+ 通知（Advice），**它里面包含了上面两个属性，也就指定要对哪些bean需要生成代理，哪些方法执行时候的需要拦截。

| <font style="color:rgb(100, 106, 115);">Java</font>@Configuration(proxyBeanMethods = false)   @Role(BeanDefinition.ROLE_INFRASTRUCTURE)   public class ProxyTransactionManagementConfiguration extends AbstractTransactionManagementConfiguration {         @Bean(name = TransactionManagementConfigUtils.TRANSACTION_ADVISOR_BEAN_NAME)      @Role(BeanDefinition.ROLE_INFRASTRUCTURE)      public BeanFactoryTransactionAttributeSourceAdvisor transactionAdvisor(            TransactionAttributeSource transactionAttributeSource, TransactionInterceptor transactionInterceptor) {            BeanFactoryTransactionAttributeSourceAdvisor advisor = new BeanFactoryTransactionAttributeSourceAdvisor();         advisor.setTransactionAttributeSource(transactionAttributeSource);         advisor.setAdvice(transactionInterceptor);         if (this.enableTx != null) {            advisor.setOrder(this.enableTx.<Integer>getNumber("order"));         }         return advisor;      }         @Bean      @Role(BeanDefinition.ROLE_INFRASTRUCTURE)      public TransactionAttributeSource transactionAttributeSource() {         // TransactionAttributeSource 是一个接口，具体注入的是 Annotationxxxx         return new AnnotationTransactionAttributeSource();      }         @Bean      @Role(BeanDefinition.ROLE_INFRASTRUCTURE)      public TransactionInterceptor transactionInterceptor(TransactionAttributeSource transactionAttributeSource) {         TransactionInterceptor interceptor = new TransactionInterceptor();         interceptor.setTransactionAttributeSource(transactionAttributeSource);         if (this.txManager != null) {            interceptor.setTransactionManager(this.txManager);         }         return interceptor;      }   } |
| :--- |


**2-1、代理拦截器（TransactionInterceptor）**

这个我们在讲解事务如何运行的时候再详细讲解。它就是事务处理的核心。

**2-2、拦截的切点（TransactionAttributeSource）**

它其实是一个切点的实现，通过刚刚设置的地方就可以看到。

| <font style="color:rgb(100, 106, 115);">Java</font>advisor.setTransactionAttributeSource(transactionAttributeSource);      public class BeanFactoryTransactionAttributeSourceAdvisor extends AbstractBeanFactoryPointcutAdvisor {         @Nullable      private TransactionAttributeSource transactionAttributeSource;         private final TransactionAttributeSourcePointcut pointcut = new TransactionAttributeSourcePointcut() {         @Override         @Nullable         protected TransactionAttributeSource getTransactionAttributeSource() {            return transactionAttributeSource;         }      };         public void setTransactionAttributeSource(TransactionAttributeSource transactionAttributeSource) {         this.transactionAttributeSource = transactionAttributeSource;      }         public void setClassFilter(ClassFilter classFilter) {         this.pointcut.setClassFilter(classFilter);      }         @Override      public Pointcut getPointcut() {         return this.pointcut;      }      } |
| :--- |


TransactionAttributeSource 是一个接口，上面我们实际创建的是 AnnotationTransactionAttributeSource  上面是直接new的可以去看看——这个切点是基于注解的

| <font style="color:rgb(100, 106, 115);">Java</font>@Bean   @Role(BeanDefinition.ROLE_INFRASTRUCTURE)   public TransactionAttributeSource transactionAttributeSource() {      return new AnnotationTransactionAttributeSource();   }      public AnnotationTransactionAttributeSource() {      this(true);   }      // 已经不再用JTA和EJB，所以最终的实现是 SpringTransactionAnnotationParser   public AnnotationTransactionAttributeSource(boolean publicMethodsOnly) {      this.publicMethodsOnly = publicMethodsOnly;      // ...      this.annotationParsers = Collections.singleton(new SpringTransactionAnnotationParser());        } |
| :--- |


SpringTransactionAnnotationParser 是用来解析@Transactional 的，这里生成的是RuleBasedTransactionAttribute ，并且把rollbackFor参数赋值到了rollbackRules 里面去。（后面异常回滚的时候会用到）

![](https://cdn.nlark.com/yuque/0/2023/png/28708807/1690185472413-74dc34dc-15c2-401f-8f02-87b6be9cdb53.png)

解析获取注解上面的参数：

| <font style="color:rgb(100, 106, 115);">Java</font>protected TransactionAttribute parseTransactionAnnotation(AnnotationAttributes attributes) {      RuleBasedTransactionAttribute rbta = new RuleBasedTransactionAttribute();         Propagation propagation = attributes.getEnum("propagation");      rbta.setPropagationBehavior(propagation.value());      Isolation isolation = attributes.getEnum("isolation");      rbta.setIsolationLevel(isolation.value());         rbta.setTimeout(attributes.getNumber("timeout").intValue());      String timeoutString = attributes.getString("timeoutString");      Assert.isTrue(!StringUtils.hasText(timeoutString) || rbta.getTimeout() < 0,            "Specify 'timeout' or 'timeoutString', not both");      rbta.setTimeoutString(timeoutString);         rbta.setReadOnly(attributes.getBoolean("readOnly"));      rbta.setQualifier(attributes.getString("value"));      rbta.setLabels(Arrays.asList(attributes.getStringArray("label")));         List<RollbackRuleAttribute> rollbackRules = new ArrayList<>();      for (Class<?> rbRule : attributes.getClassArray("rollbackFor")) {         rollbackRules.add(new RollbackRuleAttribute(rbRule));      }      for (String rbRule : attributes.getStringArray("rollbackForClassName")) {         rollbackRules.add(new RollbackRuleAttribute(rbRule));      }      for (Class<?> rbRule : attributes.getClassArray("noRollbackFor")) {         rollbackRules.add(new NoRollbackRuleAttribute(rbRule));      }      for (String rbRule : attributes.getStringArray("noRollbackForClassName")) {         rollbackRules.add(new NoRollbackRuleAttribute(rbRule));      }      rbta.setRollbackRules(rollbackRules);         return rbta;   } |
| :--- |


**二、代理后的结果**

_<font style="color:#646A73;">我们知道一个事务最基本的功能有三个</font>__**<font style="color:#646A73;">开启、提交、回滚</font>**__<font style="color:#646A73;">。所以Spring事务里面就用了事务管理器TM（TransactionManager）来管理这三个方法。</font>_

_<font style="color:#646A73;">但事务具体的实现因不同厂商而有所不同，但大体的框架是相同的（就像不同的汽车总是四个轮子一样）。所以Spring使用了模板模式来定义通用的模板，细节交由具体的子类实现。</font>_

_<font style="color:#646A73;">TransactionInterceptor实现了MethodInterceptor，所以每个代理对象执行方法的时候都会被拦截，判断是否要执行加强的方法。</font>_

_<font style="color:#646A73;">TransactionInterceptor不做过多的逻辑处理，事务的处理交给它的父类TransactionAspectSupport 处理，TransactionAspectSupport中持有TM（事务管理器）基于此来实现事务的开启、提交、回滚。</font>_

上面我们已经看到了使用 @Transaction 都会被AOP代理，而代理执行的拦截是 TransactionInterceptor。

**1、代理拦截器（TransactionInterceptor）**

| <font style="color:rgb(100, 106, 115);">Java</font>public class TransactionInterceptor extends TransactionAspectSupport implements MethodInterceptor, Serializable |
| :--- |


TransactionInterceptor 就是一个方法级别的拦截器，实现 MethodInterceptor 接口，重写了invoke方法。并继承了TransactionAspectSupport，这个类是事务的核心方法。

| <font style="color:rgb(100, 106, 115);">Java</font>@Override   @Nullable   public Object invoke(MethodInvocation invocation) throws Throwable {         Class<?> targetClass = (invocation.getThis() != null ? AopUtils.getTargetClass(invocation.getThis()) : null);         // Adapt to TransactionAspectSupport's invokeWithinTransaction...      return invokeWithinTransaction(invocation.getMethod(), targetClass, new CoroutinesInvocationCallback() {         @Override         @Nullable         public Object proceedWithInvocation() throws Throwable {            return invocation.proceed();         }         @Override         public Object getTarget() {            return invocation.getThis();         }         @Override         public Object[] getArguments() {            return invocation.getArguments();         }      });   } |
| :--- |


**2、事务真实处理器（TransactionAspectSupport）**

虽然拦截器是TransactionInterceptor，但它里面只有一个拦截，真正干活的是TransactionAspectSupport。

直接来看 invokeWithinTransaction 方法

| <font style="color:rgb(100, 106, 115);">Java</font>@Nullable   protected Object invokeWithinTransaction(Method method, @Nullable Class<?> targetClass,         final InvocationCallback invocation) throws Throwable {         // 获取当前方法的事务注解      TransactionAttributeSource tas = getTransactionAttributeSource();      final TransactionAttribute txAttr = (tas != null ? tas.getTransactionAttribute(method, targetClass) : null);      // 这个下面细说，获取的是 JdbcTransactionManager      final TransactionManager tm = determineTransactionManager(txAttr);         // ... 这里删掉了一些不会走的代码            // 父类转换成子类，方面后面的模版方法使用。 下面解释      PlatformTransactionManager ptm = asPlatformTransactionManager(tm);      // 获取我们当前被拦截的方法全限定名      final String joinpointIdentification = methodIdentification(method, targetClass, txAttr);      // 开始执行事务逻辑      if (txAttr == null || !(ptm instanceof CallbackPreferringPlatformTransactionManager)) {         // 根据事务配置来执行对应的事务         TransactionInfo txInfo = createTransactionIfNecessary(ptm, txAttr, joinpointIdentification);            Object retVal;         try {            // 执行原始方法            retVal = invocation.proceedWithInvocation();         }         catch (Throwable ex) {            // 异常回滚事务            completeTransactionAfterThrowing(txInfo, ex);            throw ex;         }         finally {            // 清除当前事务信息            cleanupTransactionInfo(txInfo);         }            // 提交事务         commitTransactionAfterReturning(txInfo);         return retVal;      }        // ...   } |
| :--- |


可以在这里打一个断点看看参数的值：

![](https://cdn.nlark.com/yuque/0/2023/png/28708807/1690185472704-29dacec5-2ab3-42a5-b88d-7780686d300b.png)

**2-1、事务管理器（TransactionManager）**

事务管理器，简称TM，它在事务中扮演着一个很重要的角色。我们先简单来看一下它们的关系图谱。（它的子类很多，这里只给出一条常用的线）

![](https://cdn.nlark.com/yuque/0/2023/png/28708807/1690185473091-7b53ba58-579e-4d90-82b9-4b10f7e97194.png)

**2-1-1、TransactionManager**

TransactionManager 是一个空接口，实现它标识是一个事务管理器。

它有两个子类 PlatformTransactionManager 、ReactiveTransactionManager ，我们是使用 PlatformTransactionManager。

**2-1-2、平台事务管理器（PlatformTransactionManager）**

PlatformTransactionManager 继承了TransactionManager，它里面定义了一个事务的三个基本方法：

| <font style="color:rgb(100, 106, 115);">Java</font>public interface PlatformTransactionManager extends TransactionManager {         TransactionStatus getTransaction(@Nullable TransactionDefinition definition)            throws TransactionException;         void commit(TransactionStatus status) throws TransactionException;         void rollback(TransactionStatus status) throws TransactionException;   } |
| :--- |


**2-1-3、事务模板方法（AbstractPlatformTransactionManager）**

AbstractPlatformTransactionManager 是一个模版方法，它重写了事务的三个方法，定义了每个方法的执行流程。

不同场景开启事务的操作不同，但流程是一样的，所以在 AbstractPlatformTransactionManager里面定义了事务执行的流程。它有三个实现类，我们使用的是DataSourceTransactionManager。

![](https://cdn.nlark.com/yuque/0/2023/png/28708807/1690185473481-359b96e5-502c-48a8-affe-597c7813840b.png)

**2-2、开启事务（createTransactionIfNecessary）**

这个方法就是开启事务的主要的方法。

getTransaction 方法就是我们上面说的模版方法里面的方法了，这里就是调用的父类的方法。

| <font style="color:rgb(100, 106, 115);">Java</font>protected TransactionInfo createTransactionIfNecessary(@Nullable PlatformTransactionManager tm,         @Nullable TransactionAttribute txAttr, final String joinpointIdentification) {         if (txAttr != null && txAttr.getName() == null) {         txAttr = new DelegatingTransactionAttribute(txAttr) {            @Override            public String getName() {               return joinpointIdentification;            }         };      }         TransactionStatus status = null;      // ..      // 开启事务      status = tm.getTransaction(txAttr);               // ...           // 这里其实就是把当前事务的信息封装成一个【TransactionInfo】，并把它绑定到当前的Thread上（实现上基于 ThreadLocal）      return prepareTransactionInfo(tm, txAttr, joinpointIdentification, status);   } |
| :--- |


**2-2-1、事务的执行逻辑（getTransaction）**

前面我们学了事务的传播行为，事务传播行为在当前有事务和没有事务下所表现出来的效果是不一样的，所以开启事务的第一步就是要先获取当前事务，判断当前是否有事务再来根据不同的传播行为来做处理。

org.springframework.transaction.support.AbstractPlatformTransactionManager#getTransaction

| <font style="color:rgb(100, 106, 115);">Java</font>@Override   public final TransactionStatus getTransaction(@Nullable TransactionDefinition definition)         throws TransactionException {         // Use defaults if no transaction definition given.      TransactionDefinition def = (definition != null ? definition : TransactionDefinition.withDefaults());            // 获取当前事务      Object transaction = doGetTransaction();      boolean debugEnabled = logger.isDebugEnabled();           // 判断当前是否有事务，如果有就执行 handleExistingTransaction      if (isExistingTransaction(transaction)) {         // Existing transaction found -> check propagation behavior to find out how to behave.         return handleExistingTransaction(def, transaction, debugEnabled);      }              // 下面就是没有当前事务的操作了      // 如果当前没有事务，但传播行为是【MANDATORY】就异常，因为这个行为要求必须有当前事务      if (def.getPropagationBehavior() == TransactionDefinition.PROPAGATION_MANDATORY) {         throw new IllegalTransactionStateException(               "No existing transaction found for transaction marked with propagation 'mandatory'");      }      // 在没有事务的前提下【REQUIRED、REQUIRES_NEW、NESTED】所表现的都一样——创建新的事务      else if (def.getPropagationBehavior() == TransactionDefinition.PROPAGATION_REQUIRED ||            def.getPropagationBehavior() == TransactionDefinition.PROPAGATION_REQUIRES_NEW ||            def.getPropagationBehavior() == TransactionDefinition.PROPAGATION_NESTED) {         SuspendedResourcesHolder suspendedResources = suspend(null);         if (debugEnabled) {            logger.debug("Creating new transaction with name [" + def.getName() + "]: " + def);         }         try {            return startTransaction(def, transaction, debugEnabled, suspendedResources);         }         catch (RuntimeException | Error ex) {            resume(null, suspendedResources);            throw ex;         }      }      else {         // 创建一个空的事务——也就是没有事务         boolean newSynchronization = (getTransactionSynchronization() == SYNCHRONIZATION_ALWAYS);         return prepareTransactionStatus(def, null, true, newSynchronization, debugEnabled, null);      }   } |
| :--- |


**1、当前存在事务的逻辑（handleExistingTransaction）**

先来看看如果当前已存在事务的时候，它会做什么处理呢？

| <font style="color:rgb(100, 106, 115);">Java</font>// 下面的代码为了简洁去掉了打印日志的代码   private TransactionStatus handleExistingTransaction(         TransactionDefinition definition, Object transaction, boolean debugEnabled)         throws TransactionException {            // 传播行为是【NEVER】，就抛出异常      if (definition.getPropagationBehavior() == TransactionDefinition.PROPAGATION_NEVER) {         throw new IllegalTransactionStateException(               "Existing transaction found for transaction marked with propagation 'never'");      }         // 传播行为是【NOT_SUPPORTED】，就suspend（暂停）当前事务      if (definition.getPropagationBehavior() == TransactionDefinition.PROPAGATION_NOT_SUPPORTED) {               Object suspendedResources = suspend(transaction);         boolean newSynchronization = (getTransactionSynchronization() == SYNCHRONIZATION_ALWAYS);         return prepareTransactionStatus(               definition, null, false, newSynchronization, debugEnabled, suspendedResources);      }            // 传播行为是【REQUIRES_NEW】，就suspend（暂停）当前事务，并开启新事务      if (definition.getPropagationBehavior() == TransactionDefinition.PROPAGATION_REQUIRES_NEW) {            SuspendedResourcesHolder suspendedResources = suspend(transaction);         try {            return startTransaction(definition, transaction, debugEnabled, suspendedResources);         }         catch (RuntimeException | Error beginEx) {            // 异常了话，就恢复之前的事务            resumeAfterBeginException(transaction, suspendedResources, beginEx);            throw beginEx;         }      }         // 传播行为是【NESTED】，开启嵌套事务      if (definition.getPropagationBehavior() == TransactionDefinition.PROPAGATION_NESTED) {         // 不是所有的数据库都支持嵌套事务，先判断         if (!isNestedTransactionAllowed()) {            throw new NestedTransactionNotSupportedException(                  "Transaction manager does not allow nested transactions by default - " +                  "specify 'nestedTransactionAllowed' property with value 'true'");         }         // 返回是否对嵌套事务使用保存点。 JTA不支持，但是我们也不用JTA         if (useSavepointForNestedTransaction()) {            DefaultTransactionStatus status =                  prepareTransactionStatus(definition, transaction, false, false, debugEnabled, null);            status.createAndHoldSavepoint();            return status;         }         else {            // 其它情况 开始新事务            return startTransaction(definition, transaction, debugEnabled, null);         }      }            // ...         boolean newSynchronization = (getTransactionSynchronization() != SYNCHRONIZATION_NEVER);      return prepareTransactionStatus(definition, transaction, false, newSynchronization, debugEnabled, null);   } |
| :--- |


**2、创建当前事务状态信息（prepareTransactionStatus）**

创建事务状态管理器，其实就是把和新事务相关的信息存放起来，来看看它的属性信息。

definition  当前新事务的属性信息

transaction 旧事务信息

newTransaction 是否要开启新事务

newSynchronization 新事物是否要同步

debug 日志打印器

suspendedResources 当前被暂停的事务资源信息

| <font style="color:rgb(100, 106, 115);">Java</font>protected final DefaultTransactionStatus prepareTransactionStatus(         TransactionDefinition definition, @Nullable Object transaction, boolean newTransaction,         boolean newSynchronization, boolean debug, @Nullable Object suspendedResources) {         DefaultTransactionStatus status = newTransactionStatus(            definition, transaction, newTransaction, newSynchronization, debug, suspendedResources);      prepareSynchronization(status, definition);      return status;   } |
| :--- |


**3、开启新的事务（startTransaction）**

| <font style="color:rgb(100, 106, 115);">Java</font>private TransactionStatus startTransaction(TransactionDefinition definition, Object transaction,         boolean debugEnabled, @Nullable SuspendedResourcesHolder suspendedResources) {         boolean newSynchronization = (getTransactionSynchronization() != SYNCHRONIZATION_NEVER);      // 先创建一个事务状态      DefaultTransactionStatus status = newTransactionStatus(            definition, transaction, true, newSynchronization, debugEnabled, suspendedResources);      // 开启事务      doBegin(transaction, definition);      prepareSynchronization(status, definition);      return status;   } |
| :--- |


doBegin 是一个抽象方法，在这里我们的实现子类是DataSourceTransactionManager，这个方法主要是为当前线程绑定一个 Connection，并把我们事务要求的属性设置进去。

| <font style="color:rgb(100, 106, 115);">Java</font>protected void doBegin(Object transaction, TransactionDefinition definition) {       DataSourceTransactionManager.DataSourceTransactionObject txObject = (DataSourceTransactionManager.DataSourceTransactionObject)transaction;       Connection con = null;          if (!txObject.hasConnectionHolder() || txObject.getConnectionHolder().isSynchronizedWithTransaction()) {           Connection newCon = this.obtainDataSource().getConnection();           if (this.logger.isDebugEnabled()) {               this.logger.debug("Acquired Connection [" + newCon + "] for JDBC transaction");           }              txObject.setConnectionHolder(new ConnectionHolder(newCon), true);       }          txObject.getConnectionHolder().setSynchronizedWithTransaction(true);       con = txObject.getConnectionHolder().getConnection();       Integer previousIsolationLevel = DataSourceUtils.prepareConnectionForTransaction(con, definition);       txObject.setPreviousIsolationLevel(previousIsolationLevel);       txObject.setReadOnly(definition.isReadOnly());       if (con.getAutoCommit()) {           txObject.setMustRestoreAutoCommit(true);           con.setAutoCommit(false);       }          this.prepareTransactionalConnection(con, definition);       txObject.getConnectionHolder().setTransactionActive(true);       int timeout = this.determineTimeout(definition);       if (timeout != -1) {           txObject.getConnectionHolder().setTimeoutInSeconds(timeout);       }          if (txObject.isNewConnectionHolder()) {           TransactionSynchronizationManager.bindResource(this.obtainDataSource(), txObject.getConnectionHolder());       }   } |
| :--- |


**2-2-2、创建当前事务信息、绑定到当前线程（prepareTransactionInfo）**

基于上面创建的事务状态等信息，组装成一个全面的事务信息TransactionInfo，并把它绑定到当前Thread上。

| <font style="color:rgb(100, 106, 115);">Java</font>protected TransactionInfo prepareTransactionInfo(@Nullable PlatformTransactionManager tm,         @Nullable TransactionAttribute txAttr, String joinpointIdentification,         @Nullable TransactionStatus status) {            // 创建事务信息      TransactionInfo txInfo = new TransactionInfo(tm, txAttr, joinpointIdentification);      if (txAttr != null) {         // 设置事务状态是不是新的         txInfo.newTransactionStatus(status);      }      else {         if (logger.isTraceEnabled()) {            logger.trace("No need to create transaction for [" + joinpointIdentification +                  "]: This method is not transactional.");         }      }            // 绑定事务到当前线程      txInfo.bindToThread();      return txInfo;   }      // 设置事务管理器、事务属性、事务连接点   public TransactionInfo(@Nullable PlatformTransactionManager transactionManager,         @Nullable TransactionAttribute transactionAttribute, String joinpointIdentification) {         this.transactionManager = transactionManager;      this.transactionAttribute = transactionAttribute;      this.joinpointIdentification = joinpointIdentification;   } |
| :--- |


**2-3、异常处理（completeTransactionAfterThrowing）**

| <font style="color:rgb(100, 106, 115);">Java</font>protected void completeTransactionAfterThrowing(@Nullable TransactionInfo txInfo, Throwable ex) {      // 判断事务状态是不是正常的      if (txInfo != null && txInfo.getTransactionStatus() != null) {                  // 判断当前是否存在事务信息，并判断当前异常是不是要被回滚         if (txInfo.transactionAttribute != null && txInfo.transactionAttribute.rollbackOn(ex)) {            // 回滚了            txInfo.getTransactionManager().rollback(txInfo.getTransactionStatus());         }         else {            // 如果不是回滚，那当然就是提交事务咯            txInfo.getTransactionManager().commit(txInfo.getTransactionStatus());           }      }   } |
| :--- |


**2-3-1、rollbackOn**

上一篇文章我们说了，如果我们在使用事务注解时不指定回滚异常的话，有些异常它是不会回滚的（受检查的异常），就是通过这里判断的。

TransactionAttribute 是个接口它的实现类有如下，在上面我也提到了最终被解析的是 RuleBasedTransactionAttribute

![](https://cdn.nlark.com/yuque/0/2023/png/28708807/1690185473737-bc75cd8a-9f51-4055-8730-e1cf54d36f0c.png)

事务注解上的回滚异常都会被解析存入rollbackRules里面去，这里就可以判断哪些异常是会被回滚的了。

| <font style="color:rgb(100, 106, 115);">Java</font>public boolean rollbackOn(Throwable ex) {      RollbackRuleAttribute winner = null;      int deepest = Integer.MAX_VALUE;         if (this.rollbackRules != null) {         for (RollbackRuleAttribute rule : this.rollbackRules) {            int depth = rule.getDepth(ex);            if (depth >= 0 && depth < deepest) {               deepest = depth;               winner = rule;            }         }      }         // User superclass behavior (rollback on unchecked) if no rule matches.      if (winner == null) {         return super.rollbackOn(ex);      }         return !(winner instanceof NoRollbackRuleAttribute);   } |
| :--- |


**2-3-2、rollback**

最开始我们就说了事务管理器的最高定义是 PlatformTransactionManager，它里面定义了事务的开启、提交、回滚接口，由AbstractPlatformTransactionManager 去定义这三个操作要做的事情（也就是模版），其中的细节实现由最终的子类去操作。

AbstractPlatformTransactionManager 中回滚模板定义如下：

| <font style="color:rgb(100, 106, 115);">Java</font>@Override   public final void rollback(TransactionStatus status) throws TransactionException {      // 判断事务是否已经结束      if (status.isCompleted()) {         throw new IllegalTransactionStateException(               "Transaction is already completed - do not call commit or rollback more than once per transaction");      }         DefaultTransactionStatus defStatus = (DefaultTransactionStatus) status;      processRollback(defStatus, false);   }      private void processRollback(DefaultTransactionStatus status, boolean unexpected) {      try {         boolean unexpectedRollback = unexpected;                   // 【事务钩子】 事务结束之前执行某某方法        triggerBeforeCompletion(status);        // 判断是不是有保存点（嵌套事务），如果有把嵌套事务也要设置成回滚        if (status.hasSavepoint()) {           status.rollbackToHeldSavepoint();        }        // 判断是不是新事务        else if (status.isNewTransaction()) {           doRollback(status);        }        else {           // 是不是参与了别的事务，参看上一章的事务传播行为           if (status.hasTransaction()) {              // 设置事务为回滚  isGlobalRollbackOnParticipationFailure 默认为 true              if (status.isLocalRollbackOnly() || isGlobalRollbackOnParticipationFailure()) {                 // 设置会只回滚状态【这也是上一章中为什么 try catch 了B方法，结果还是都回滚了的原因】                 doSetRollbackOnly(status);              }           }           // Unexpected rollback only matters here if we're asked to fail early           if (!isFailEarlyOnGlobalRollbackOnly()) {              unexpectedRollback = false;           }        }        // 【事务钩子】 事务结束之后执行某某方法         triggerAfterCompletion(status, TransactionSynchronization.STATUS_ROLLED_BACK);            // Raise UnexpectedRollbackException if we had a global rollback-only marker         if (unexpectedRollback) {            throw new UnexpectedRollbackException(                  "Transaction rolled back because it has been marked as rollback-only");         }      }      finally {         // 事务完成后清除信息         cleanupAfterCompletion(status);      }   } |
| :--- |


事务钩子其实就是整个容器里面各个地方注册的钩子，最终都会被识别到，然后for运行逐一去执行，链式的。

**2-4、清除事务信息（cleanupTransactionInfo）**

事务也是逐步提交的，如果当前事务上面还有事务，就把线程持有的事务设置为父事务。

| <font style="color:rgb(100, 106, 115);">Java</font>protected void cleanupTransactionInfo(@Nullable TransactionInfo txInfo) {      if (txInfo != null) {         txInfo.restoreThreadLocalStatus();      }   }      private void restoreThreadLocalStatus() {      // Use stack to restore old transaction TransactionInfo.      // Will be null if none was set.      transactionInfoHolder.set(this.oldTransactionInfo);   } |
| :--- |


**2-5、提交事务（commitTransactionAfterReturning ）**

| <font style="color:rgb(100, 106, 115);">Java</font>protected void commitTransactionAfterReturning(@Nullable TransactionInfo txInfo) {      // 判断当前事务的状态      if (txInfo != null && txInfo.getTransactionStatus() != null) {         if (logger.isTraceEnabled()) {            logger.trace("Completing transaction for [" + txInfo.getJoinpointIdentification() + "]");         }         // 调用模板方法来提交事务         txInfo.getTransactionManager().commit(txInfo.getTransactionStatus());      }   } |
| :--- |


org.springframework.transaction.support.AbstractPlatformTransactionManager#commit

| <font style="color:rgb(100, 106, 115);">Java</font>@Override   public final void commit(TransactionStatus status) throws TransactionException {      // 判断事务是否已经结束      if (status.isCompleted()) {         throw new IllegalTransactionStateException(               "Transaction is already completed - do not call commit or rollback more than once per transaction");      }         DefaultTransactionStatus defStatus = (DefaultTransactionStatus) status;      // 如果事务被设置要回滚，那就回滚      if (defStatus.isLocalRollbackOnly()) {         if (defStatus.isDebug()) {            logger.debug("Transactional code has requested rollback");         }         processRollback(defStatus, false);         return;      }      // 全局事务被设置成要回滚      if (!shouldCommitOnGlobalRollbackOnly() && defStatus.isGlobalRollbackOnly()) {         if (defStatus.isDebug()) {            logger.debug("Global transaction is marked as rollback-only but transactional code requested commit");         }         processRollback(defStatus, true);         return;      }            // 事务提交      processCommit(defStatus);   } |
| :--- |


| <font style="color:rgb(100, 106, 115);">Java</font>private void processCommit(DefaultTransactionStatus status) throws TransactionException {      try {         boolean beforeCompletionInvoked = false;                    boolean unexpectedRollback = false;        // 提交之前的准备，空实现，  如果你有什么步骤需要提交之前执行可以重写        prepareForCommit(status);        // 事务提交之前和完成之前的钩子方法        triggerBeforeCommit(status);        triggerBeforeCompletion(status);        beforeCompletionInvoked = true;                // 判断是不是有保存点（嵌套事务）        if (status.hasSavepoint()) {           if (status.isDebug()) {              logger.debug("Releasing transaction savepoint");           }           unexpectedRollback = status.isGlobalRollbackOnly();           status.releaseHeldSavepoint();        }        // 判断是不是新事务        else if (status.isNewTransaction()) {           if (status.isDebug()) {              logger.debug("Initiating transaction commit");           }           unexpectedRollback = status.isGlobalRollbackOnly();           // 事务提交【由具体的实现类去实现】           doCommit(status);        }        else if (isFailEarlyOnGlobalRollbackOnly()) {           unexpectedRollback = status.isGlobalRollbackOnly();        }           // Throw UnexpectedRollbackException if we have a global rollback-only        // marker but still didn't get a corresponding exception from commit.        if (unexpectedRollback) {           throw new UnexpectedRollbackException(                 "Transaction silently rolled back because it has been marked as rollback-only");        }                try {            // 事务提交够的钩子            triggerAfterCommit(status);         }         finally {            // 事务完成后的钩子            triggerAfterCompletion(status, TransactionSynchronization.STATUS_COMMITTED);         }      }      finally {         // 事务完成后清除         cleanupAfterCompletion(status);      }   } |
| :--- |


org.springframework.jdbc.datasource.DataSourceTransactionManager#doCommit

| <font style="color:rgb(100, 106, 115);">Java</font>protected void doCommit(DefaultTransactionStatus status) {       DataSourceTransactionManager.DataSourceTransactionObject txObject = (DataSourceTransactionManager.DataSourceTransactionObject)status.getTransaction();       Connection con = txObject.getConnectionHolder().getConnection();       if (status.isDebug()) {           this.logger.debug("Committing JDBC transaction on Connection [" + con + "]");       }          try {           // 获取到 Connection 连接提交事务           con.commit();       } catch (SQLException var5) {           throw this.translateException("JDBC commit", var5);       }   } |
| :--- |


