---
title: Java - SPI机制
urlname: tsc5n88qy9rtkgr4
date: '2023-07-03 21:34:39'
updated: '2023-08-18 11:38:19'
---
## 1. 概念
<font style="color:rgb(18, 18, 18);">在面向对象的设计原则中，一般推荐模块之间基于接口编程，通常情况下调用方模块是不会感知到被调用方模块的内部具体实现。一旦代码里面涉及具体实现类，就违反了开闭原则。如果需要替换一种实现，就需要修改代码。</font>

<font style="color:rgb(18, 18, 18);">为了实现在模块装配的时候不用在程序里面动态指明，这就需要一种服务发现机制。Java SPI 就是提供了这样一个机制：为某个接口寻找服务实现的机制。这有点类似 IOC 的思想，将装配的控制权移交到了程序之外。</font>

<font style="color:rgb(18, 18, 18);">SPI 英文为 Service Provider Interface 字面意思就是：“服务提供者的接口”，我的理解是：专门提供给服务提供者或者扩展框架功能的开发者去使用的一个接口。</font>

<font style="color:rgb(18, 18, 18);">SPI 将服务接口和具体的服务实现分离开来，将服务调用方和服务实现者解耦，能够提升程序的扩展性、可维护性。修改或者替换服务实现并不需要修改调用方。</font>

<font style="color:rgb(199, 37, 78);background-color:rgb(249, 242, 244);">  
</font><font style="color:rgb(199, 37, 78);background-color:rgb(249, 242, 244);">Java SPI</font><font style="color:rgb(77, 77, 77);">（Service Provider Interface）是Java官方提供的一种</font><font style="color:rgb(199, 37, 78);background-color:rgb(249, 242, 244);">服务发现机制</font><font style="color:rgb(77, 77, 77);">，它允许在</font><font style="color:rgb(199, 37, 78);background-color:rgb(249, 242, 244);">运行时动态地加载实现</font><font style="color:rgb(77, 77, 77);">特定接口的类，而不需要在代码中显式地指定该类，从而实现</font><font style="color:rgb(199, 37, 78);background-color:rgb(249, 242, 244);">解耦和灵活性</font><font style="color:rgb(77, 77, 77);">。</font>

# **<font style="color:rgb(26, 67, 156);">Java spi 最大优点：热插拔</font>**
+ **<font style="color:rgb(26, 67, 156);">实现类方法 通过pom依赖 服务接口感知。服务启动时通过依赖查找对应META-INF目录下是否有文件指定方法全路径，有的话初始化。  </font>****<font style="color:rgb(254, 44, 36);">通过切断依赖控制实现方法的初始化.</font>**

## 2. 实现原理
<font style="color:rgb(18, 18, 18);">  
</font><font style="color:rgb(18, 18, 18);"> Java SPI 的实现原理基于 Java 类加载机制和反射机制。</font>

<font style="color:rgb(18, 18, 18);"></font>

<font style="color:rgb(18, 18, 18);">当使用 ServiceLoader.load(Class<T> service) 方法加载服务时，会检查 META-INF/services 目录下是否存在以接口全限定名命名的文件。如果存在，则读取文件内容，获取实现该接口的类的全限定名，并通过 Class.forName() 方法加载对应的类。</font>

<font style="color:rgb(18, 18, 18);"></font>

<font style="color:rgb(18, 18, 18);">在加载类之后，ServiceLoader 会通过反射机制创建对应类的实例，并将其缓存起来。</font>

<font style="color:rgb(18, 18, 18);"></font>

<font style="color:rgb(18, 18, 18);">这里涉及到一个懒加载迭代器的思想：</font>

<font style="color:rgb(18, 18, 18);"></font>

<font style="color:rgb(18, 18, 18);">当我们调用 ServiceLoader.load(Class<T> service) 方法时，并不会立即将所有实现了该接口的类都加载进来，而是返回一个懒加载迭代器。</font>

只有在使用迭代器遍历时，才会按需加载对应的类并创建其实例。



这种懒加载思想有以下两个好处：



节省内存

如果一次性将所有实现类全部加载进来，可能会导致内存占用过大，影响程序的性能。



增强灵活性

由于 ServiceLoader 是动态加载的，因此可以在程序运行时添加或删除实现类，而无需修改代码或重新编译。



总的来说，Java SPI 的实现原理比较简单，利用了 Java 类加载和反射机制，提供了一种轻量级的插件化机制，可以很方便地扩展功能。

## 三、优缺点
1. 优点

松耦合性：SPI具有很好的松耦合性，应用程序可以在运行时动态加载实现类，而无需在编译时将实现类硬编码到代码中。

扩展性：通过SPI，应用程序可以为同一个接口定义多个实现类。这使得应用程序更容易扩展和适应变化。

易于使用：使用SPI，应用程序只需要定义接口并指定实现类的类名，即可轻松地使用新的服务提供者。

2. 缺点

配置较麻烦：SPI需要在META-INF/services目录下创建配置文件，并将实现类的类名写入其中。这使得配置相对较为繁琐。

安全性不足：SPI提供者必须将其实现类名称写入到配置文件中，因此如果未正确配置，则可能存在安全风险。

性能损失：每次查找服务提供者都需要重新读取配置文件，这可能会增加启动时间和内存开销。

四、应用场景

Java SPI机制是一种服务提供者发现的机制，适用于需要在多个实现中选择一个进行使用的场景。



常见的应用场景包括：

| **<font style="color:rgb(79, 79, 79);">应用名称</font>** | **<font style="color:rgb(79, 79, 79);">具体应用场景</font>**<br/> |
| :---: | --- |
| <font style="color:rgb(79, 79, 79);">数据库驱动程序加载</font><br/>     | <font style="color:rgb(199, 37, 78);background-color:rgb(249, 242, 244);">JDBC</font><font style="color:rgb(79, 79, 79);">为了实现</font><font style="color:rgb(199, 37, 78);background-color:rgb(249, 242, 244);">可插拔</font><font style="color:rgb(79, 79, 79);">的数据库驱动，在Java.sql.Driver接口中定义了一组标准的API规范，而具体的数据库厂商则需要实现这个接口，以提供自己的数据库驱动程序。在Java中，JDBC驱动程序的加载就是通过SPI机制实现的。</font> |
| <font style="color:rgb(79, 79, 79);">日志框架的实现</font><br/>     | <font style="color:rgb(79, 79, 79);">流行的</font><font style="color:rgb(199, 37, 78);background-color:rgb(249, 242, 244);">开源日志框架</font><font style="color:rgb(79, 79, 79);">，如</font><font style="color:rgb(199, 37, 78);background-color:rgb(249, 242, 244);">Log4j、SLF4J和Logback</font><font style="color:rgb(79, 79, 79);">等，都采用了SPI机制。用户可以根据自己的需求选择合适的日志实现，而不需要修改代码。</font><br/>     |
| <font style="color:rgb(79, 79, 79);">Spring框架</font><br/>     | <font style="color:rgb(199, 37, 78);background-color:rgb(249, 242, 244);">Spring框架</font><font style="color:rgb(79, 79, 79);">中的Bean加载机制就使用了SPI思想，通过读取classpath下的META-INF/spring.factories文件来</font><font style="color:rgb(199, 37, 78);background-color:rgb(249, 242, 244);">加载各种自定义的Bean</font><font style="color:rgb(79, 79, 79);">。</font><br/>     |
| <font style="color:rgb(79, 79, 79);">Dubbo框架</font><br/>     | <font style="color:rgb(199, 37, 78);background-color:rgb(249, 242, 244);">Dubbo框架</font><font style="color:rgb(79, 79, 79);">也使用了SPI思想，通过接口</font><font style="color:rgb(199, 37, 78);background-color:rgb(249, 242, 244);">注解@SPI</font><font style="color:rgb(79, 79, 79);">声明扩展点接口，并在classpath下的META-INF/dubbo目录中提供实现类的配置文件，来实现扩展点的动态加载。</font><br/>     |
| <font style="color:rgb(79, 79, 79);">MyBatis框架</font><br/>     | <font style="color:rgb(199, 37, 78);background-color:rgb(249, 242, 244);">MyBatis框架</font><font style="color:rgb(79, 79, 79);">中的插件机制也使用了SPI思想，通过在classpath下的META-INF/services目录中存放插件接口的实现类路径，来实现</font><font style="color:rgb(199, 37, 78);background-color:rgb(249, 242, 244);">插件的加载和执行</font><font style="color:rgb(79, 79, 79);">。</font><br/>     |
| <font style="color:rgb(79, 79, 79);">Netty框架</font><br/>     | <font style="color:rgb(199, 37, 78);background-color:rgb(249, 242, 244);">Netty框架</font><font style="color:rgb(79, 79, 79);">也使用了SPI机制，让用户可以根据自己的需求选择合适的</font><font style="color:rgb(199, 37, 78);background-color:rgb(249, 242, 244);">网络协议实现方式</font><font style="color:rgb(79, 79, 79);">。</font><br/>     |
| <font style="color:rgb(79, 79, 79);">Hadoop框架</font><br/>     | <font style="color:rgb(199, 37, 78);background-color:rgb(249, 242, 244);">Hadoop框架</font><font style="color:rgb(79, 79, 79);">中的输入输出格式也使用了SPI思想，通过在classpath下的META-INF/services目录中存放输入输出格式接口的实现类路径，来实现</font><font style="color:rgb(199, 37, 78);background-color:rgb(249, 242, 244);">输入输出格式的灵活配置和切换</font><font style="color:rgb(79, 79, 79);">。</font><br/>     |


我们上面对Java SPI的缺点说了一下，我们来说一下：

Spring的SPI机制相对于Java原生的SPI机制进行了改造和扩展，主要体现在以下几个方面：



支持多个实现类：Spring的SPI机制允许为同一个接口定义多个实现类，而Java原生的SPI机制只支持单个实现类。这使得在应用程序中使用Spring的SPI机制更加灵活和可扩展。



支持自动装配：Spring的SPI机制支持自动装配，可以通过将实现类标记为Spring组件（例如@Component），从而实现自动装配和依赖注入。这在一定程度上简化了应用程序中服务提供者的配置和管理。



支持动态替换：Spring的SPI机制支持动态替换服务提供者，可以通过修改配置文件或者其他方式来切换服务提供者。而Java原生的SPI机制只能在启动时加载一次服务提供者，并且无法在运行时动态替换。



提供了更多扩展点：Spring的SPI机制提供了很多扩展点，例如BeanPostProcessor、BeanFactoryPostProcessor等，可以在服务提供者初始化和创建过程中进行自定义操作。

其他框架也是对Java SPI进行改造和扩展增强，从而更好的提供服务！



### 五、使用步骤
定义接口：首先需要定义一个接口，所有实现该接口的类都将被注册为服务提供者。



创建实现类：创建一个或多个实现接口的类，这些类将作为服务提供者。



配置文件：在 META-INF/services 目录下创建一个以接口全限定名命名的文件，文件内容为实现该接口的类的全限定名，每个类名占一行。



加载使用服务：使用 java.util.ServiceLoader 类的静态方法 load(Class service) 加载服务，默认情况下会加载 classpath 中所有符合条件的提供者。调用 ServiceLoader 实例的 iterator() 方法获取迭代器，遍历迭代器即可获取所有实现了该接口的类的实例。



使用 Java SPI 时，需要注意以下几点：



接口必须是公共的，且只能包含抽象方法。



实现类必须有一个无参构造函数。



配置文件中指定的类必须是实现了相应接口的非抽象类。



配置文件必须放在 META-INF/services 目录下。



配置文件的文件名必须为接口的全限定名。



## 六、练手例子
```java
/**

●  @author  wangzhenjun  
●  @date  2023/5/31 15:33 
*/
public interface ProgrammingLanguageService {
/** 
  ○ 学习方法
*/
void study();
}
```

```java
/**
 * @author wangzhenjun
 * @date 2023/5/31 15:34
 */
public class JavaServiceImpl implements ProgrammingLanguageService {
    @Override
    public void study() {
        System.out.println("开始学习Java！！");
    }
}

/**
 * @author wangzhenjun
 * @date 2023/5/31 15:34
 */
public class PythonServiceImpl implements ProgrammingLanguageService {
    
    @Override
    public void study() {
        System.out.println("开始学习Python！！");
    }
}
```

### <font style="color:rgb(79, 79, 79);">3. 配置文件</font>
  
 我们创建两个文件夹：META-INF、services，在创建一个普通文件即可：com.example.demo.service.ProgrammingLanguageService



注意： 一定是接口的类的全限定名



com.example.demo.service.impl.JavaServiceImpl

com.example.demo.service.impl.PythonServiceImpl

### <font style="color:rgb(79, 79, 79);">4. 加载使用服务</font>
```plain
/**
 * @author wangzhenjun
 * @date 2023/5/31 13:46
 */
public class ServiceLoaderTest {

    public static void main(String[] args) {
        ServiceLoader<ProgrammingLanguageService> serviceLoader = ServiceLoader.load(ProgrammingLanguageService.class);
        Iterator<ProgrammingLanguageService> iterator = serviceLoader.iterator();
        while (iterator.hasNext()) {
            ProgrammingLanguageService service = iterator.next();
            service.study();
        }
    }
}

```





