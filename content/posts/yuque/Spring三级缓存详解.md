---
title: Spring三级缓存详解
urlname: aiog7gxwls55q0am
date: '2023-07-04 22:20:55'
updated: '2023-07-06 15:45:14'
---
Spring三级缓存是为了解决对象间的循环依赖问题。



A依赖B，B依赖A，这就是一个简单的循环依赖。



我们来先看看三级缓存的源码。



（1）查看“获取Bean”的源码，注意getSingleton()方法。

```java
public class DefaultSingletonBeanRegistry extends SimpleAliasRegistry implements SingletonBeanRegistry {
    //第1级缓存 用于存放 已经属性赋值、完成初始化的 单列BEAN
    private final Map<String, Object> singletonObjects = new ConcurrentHashMap<>(256);
    //第2级缓存 用于存在已经实例化，还未做代理属性赋值操作的 单例BEAN
    private final Map<String, Object> earlySingletonObjects = new HashMap<>(16);
    //第3级缓存 存储创建单例BEAN的工厂
    private final Map<String, ObjectFactory<?>> singletonFactories = new HashMap<>(16);
    //已经注册的单例池里的beanName
    private final Set<String> registeredSingletons = new LinkedHashSet<>(256);
    //正在创建中的beanName集合
    private final Set<String> singletonsCurrentlyInCreation =Collections.newSetFromMap(new ConcurrentHashMap<>(16));
    //缓存查找bean  如果第1级缓存没有，那么从第2级缓存获取。如果第2级缓存也没有，那么从第3级缓存创建，并放入第2级缓存。
    protected Object getSingleton(String beanName, boolean allowEarlyReference) {
        Object singletonObject = this.singletonObjects.get(beanName); //第1级
        if (singletonObject == null && isSingletonCurrentlyInCreation(beanName)) {
            synchronized (this.singletonObjects) {
                singletonObject = this.earlySingletonObjects.get(beanName); //第2级
                if (singletonObject == null && allowEarlyReference) {
                    //第3级缓存  在doCreateBean中创建了bean的实例后，封装ObjectFactory放入缓存的bean实例
                    ObjectFactory<?> singletonFactory = this.singletonFactories.get(beanName);
                    if (singletonFactory != null) {
                        //创建未赋值的bean
                        singletonObject = singletonFactory.getObject();
                        //放入到第2级缓存
                        this.earlySingletonObjects.put(beanName, singletonObject);
                        //从第3级缓存删除
                        this.singletonFactories.remove(beanName);
                    }
                }
            }
        }
        return singletonObject;
    }   
}
```

（2）“添加到第1级缓存”的源码：

```java
protected void addSingleton(String beanName, Object singletonObject) {
    synchronized (this.singletonObjects) {
        // 放入第1级缓存
        this.singletonObjects.put(beanName, singletonObject);
        // 从第3级缓存删除
        this.singletonFactories.remove(beanName);
        // 从第2级缓存删除
        this.earlySingletonObjects.remove(beanName);
        // 放入已注册的单例池里
        this.registeredSingletons.add(beanName);
    }
}
```

（3）“添加到第3级缓存”的源码：

```java
protected void addSingleton(String beanName, Object singletonObject) {
    synchronized (this.singletonObjects) {
        // 放入第1级缓存
        this.singletonObjects.put(beanName, singletonObject);
        // 从第3级缓存删除
        this.singletonFactories.remove(beanName);
        // 从第2级缓存删除
        this.earlySingletonObjects.remove(beanName);
        // 放入已注册的单例池里
        this.registeredSingletons.add(beanName);
    }
}
```

（4）“创建Bean”的源码：

```java
protected Object doCreateBean(final String beanName, final RootBeanDefinition mbd, Object[] args) throws BeanCreationException {
    BeanWrapper instanceWrapper = null;
    
    if (instanceWrapper == null) {
        //实例化对象
        instanceWrapper = this.createBeanInstance(beanName, mbd, args);
    }
 
    final Object bean = instanceWrapper != null ? instanceWrapper.getWrappedInstance() : null;
    Class<?> beanType = instanceWrapper != null ? instanceWrapper.getWrappedClass() : null;
   
    //判断是否允许提前暴露对象，如果允许，则直接添加一个 ObjectFactory 到第3级缓存
    boolean earlySingletonExposure = (mbd.isSingleton() && this.allowCircularReferences &&
                isSingletonCurrentlyInCreation(beanName));
    if (earlySingletonExposure) {
        //添加到第3级缓存
        addSingletonFactory(beanName, () -> getEarlyBeanReference(beanName, mbd, bean));
    }
 
    //填充属性
    this.populateBean(beanName, mbd, instanceWrapper);
    //执行初始化方法，并创建代理
    exposedObject = initializeBean(beanName, exposedObject, mbd);
    return exposedObject;
}
```

通过这段代码，我们可以知道：Spring 在实例化对象之后，就会为其创建一个 Bean 工厂，并将此工厂加入到三级缓存中。



因此，Spring 一开始提前暴露的并不是实例化的 Bean，而是将 Bean 包装起来的ObjectFactory。为什么要这么做呢？



这实际上涉及到 AOP。如果创建的 Bean 是有代理的，那么注入的就应该是代理 Bean，而不是原始的 Bean。但是，Spring一开始并不知道 Bean是否会有循环依赖，通常情况下（没有循环依赖的情况下），Spring 都会在“完成填充属性并且执行完初始化方法”之后再为其创建代理。但是，如果出现了循环依赖，Spring 就不得不为其提前创建"代理对象"；否则，注入的就是一个原始对象，而不是代理对象。因此，这里就涉及到"应该在哪里提前创建代理对象"？



Spring 的做法就是：在 ObjectFactory 中去提前创建代理对象。它会执行 getObject() 方法来获取到 Bean。实际上，它真正执行的方法如下：

```java
protected Object getEarlyBeanReference(String beanName, RootBeanDefinition mbd, Object bean) {
    Object exposedObject = bean;
    if (!mbd.isSynthetic() && hasInstantiationAwareBeanPostProcessors()) {
        for (BeanPostProcessor bp : getBeanPostProcessors()) {
            if (bp instanceof SmartInstantiationAwareBeanPostProcessor) {
                SmartInstantiationAwareBeanPostProcessor ibp = (SmartInstantiationAwareBeanPostProcessor) bp;
                // 如果需要代理，这里会返回代理对象；否则，返回原始对象。
                exposedObject = ibp.getEarlyBeanReference(exposedObject, beanName);
            }
        }
    }
    return exposedObject;
}
```

提前进行对象的代理工作，并在 earlyProxyReferences map中记录已被代理的对象，是为了避免在后面重复创建代理对象。

```java
public abstract class AbstractAutoProxyCreator extends ProxyProcessorSupport
        implements SmartInstantiationAwareBeanPostProcessor, BeanFactoryAware {
    @Override
    public Object getEarlyBeanReference(Object bean, String beanName) {
        Object cacheKey = getCacheKey(bean.getClass(), beanName);
        // 记录已被代理的对象
        this.earlyProxyReferences.put(cacheKey, bean);
        return wrapIfNecessary(bean, beanName, cacheKey);
    }
}
```

再次分析获取bean的方法getSingleton()方法，可知：



提前暴露的对象，虽然已实例化，但是没有进行属性填充，还没有完成初始化，是一个不完整的对象。 这个对象存放在二级缓存中，对于三级缓存机制十分重要，是解决循环依赖一个非常巧妙的设计。



让我们来分析一下“A的某个field或者setter依赖了B的实例对象，同时B的某个field或者setter依赖了A的实例对象”这种循环依赖的情景。



:::color1
A 调用doCreateBean()创建Bean对象：由于还未创建，从第1级缓存singletonObjects查不到，此时只是一个半成品（提前暴露的对象），放入第3级缓存singletonFactories。

A在属性填充时发现自己需要B对象，但是在三级缓存中均未发现B，于是创建B的半成品，放入第3级缓存singletonFactories。

B在属性填充时发现自己需要A对象，从第1级缓存singletonObjects和第2级缓存earlySingletonObjects中未发现A，但是在第3级缓存singletonFactories中发现A，将A放入第2级缓存earlySingletonObjects，同时从第3级缓存singletonFactories删除。

将A注入到对象B中。

B完成属性填充，执行初始化方法，将自己放入第1级缓存singletonObjects中（此时B是一个完整的对象），同时从第3级缓存singletonFactories和第2级缓存earlySingletonObjects中删除。

A得到“对象B的完整实例”，将B注入到A中。

A完成属性填充，执行初始化方法，并放入到第1级缓存singletonObjects中。

:::

在创建过程中，都是从第三级缓存(对象工厂创建不完整对象)，将提前暴露的对象放入到第二级缓存；从第二级缓存拿到后，完成初始化，并放入第一级缓存。

