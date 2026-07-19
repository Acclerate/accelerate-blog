---
title: 'maven&gradle'
urlname: 'seg3hdgm9lhpgfwx'
date: '2026-07-06 14:34:06'
updated: '2026-07-06 14:35:59'
tags:
  - Spring
  - Maven
  - Gradle
  - 构建工具
description: '对比 Maven 与 Gradle 在 Spring Boot 项目下的差异，分析 bootRun 是否为推荐运行方式。'
---
好问题。先直接回答第一个,再详细展开 Maven 与 Gradle 在 Spring Boot 下的差异。

---

# 一、bootRun 是不是推荐方式?
**结论:bootRun 是 Gradle 下 Spring Boot 官方提供的"开发期运行任务",属于推荐方式之一,但不是唯一、也不总是最优的方式。**

## bootRun 本质
它由 `org.springframework.boot` Gradle 插件提供,底层做的是:

1. 编译 main 源集 + 处理资源
2. 用 Gradle 自己解析出的完整运行时 classpath
3. 在一个**子进程**里执行主类的 `main()`(fork,不占用 Gradle Daemon)
4. 把子进程的 stdout/stderr 接到 Gradle 控制台

```groovy
// 等价于在干这些
gradle classes      // 1. 编译
java -cp <完整classpath> com.jzt.message.ErpmMessageStartServer  // 2+3. 运行
```

## 三种开发期运行方式对比(你的项目场景)
| 方式 | 启动速度 | 断点调试 | 改代码后热重载 | 命令行过长(Windows) | 适用场景 |
| --- | --- | --- | --- | --- | --- |
| **IDEA 直接 Run 主类** | ⚡最快 | ✅ 原生 | ✅ devtools | ❌ 易触发(你遇到的) | 日常迭代、调试 |
| **bootRun** | 🐢 较慢(过 Gradle Daemon) | ⚠️ 需额外配 `--debug-jvm` | ✅ devtools | ✅ 不触发 | 快速验证、CI、避免长 classpath |
| **java -jar (bootJar)** | 🐢 最慢(要先打 fat jar) | ⚠️ 麻烦 | ❌ | ✅ | 生产部署、集成测试 |


## bootRun 的优缺点
**优点**

+ **绕开 Windows 命令行长度限制**——这正是你的情况。Gradle 用自己的进程管理 classpath,不拼超长 `java -cp` 命令,所以没有 32KB 限制。
+ classpath 由 Gradle 统一解析,不会出现 IDEA 索引/模块配置不一致导致的运行时缺包。
+ 配合 `spring-boot-devtools` 能热重载;加 `--continuous` 可在源码变化时自动重启。
+ CI 环境里一条命令搞定编译+运行,不依赖 IDE。

**缺点**

+ **慢**:每次都要走一遍 Gradle 配置评估 + Daemon 通信,首次启动比 IDEA 直接 Run 主类慢好几秒。
+ **调试不便**:默认不开调试端口。要断点需 `bootRun --debug-jvm`(在 5005 端口等待调试器),且"先启动再连"的流程比 IDEA 原生 Debug 按钮啰嗦。
+ 改代码后除非用 devtools/continuous,否则要手动停掉重跑。

## 给你的实际建议
> **日常开发、写代码调试** → 用 IDEA 直接 Debug 主类(解决命令行过长后,这是最快、调试最顺的方式)。  
**快速验证项目能否起来、CI、或临时绕开 IDEA 的命令行坑** → 用 `bootRun`。
>

由于你 IDEA 2025.3.5 的 Spring Boot 运行配置里没有 "Shorten command line" 选项,目前 `bootRun` 对你来说是**最省心的能跑起来方式**。但如果后续想在 IDEA 里流畅 Debug,可以再尝试把 Gradle 升级到 8.x(让 IDEA 同步正常),那时直接 Run 主类就能用了。

---

# 二、Spring Boot 的 Maven 项目 vs Gradle 项目——详细差异
下面从 8 个维度系统对比。核心是:**Spring Boot 的能力两边对等**(同样的自动配置、starter、devtools),差异在**构建工具本身**。

## 1. 配置文件:声明式 XML vs 命令式 Groovy/Kotlin DSL
**Maven — **`pom.xml`**(XML,声明式)**

```xml
<project>
  <modelVersion>4.0.0</modelVersion>

  <groupId>com.jzt</groupId>

  <artifactId>erpm-message</artifactId>

  <version>1.0.0.0-SNAPSHOT</version>

  <parent>
    <groupId>org.springframework.boot</groupId>

    <artifactId>spring-boot-starter-parent</artifactId>

    <version>2.3.12.RELEASE</version>

  </parent>

  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>

      <artifactId>spring-boot-starter-web</artifactId>

    </dependency>

  </dependencies>

</project>

```

**Gradle — **`build.gradle`**(Groovy DSL,命令式 + 可编程)**

```groovy
plugins {
    id 'org.springframework.boot' version '2.3.12.RELEASE'
    id 'io.spring.dependency-management' version '1.1.0'
    id 'java'
}

group = 'com.jzt'
version = '1.0.0.0-SNAPSHOT'

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
}
```

| 维度 | Maven | Gradle |
| --- | --- | --- |
| 格式 | XML(冗长、严格 schema) | Groovy/Kotlin DSL(简洁、可写逻辑) |
| 能否写代码逻辑 | ❌ 几乎不能(靠插件) | ✅ 可写函数、条件、循环 |
| 多模块公共配置 | `<parent>` 继承 或 `<dependencyManagement>` | `allprojects{}` / `subprojects{}` 闭包一次配置 |
| IDE 友好度 | XML 补全成熟 | DSL 补全略弱(Kotlin DSL 更好) |


**你的项目就是典型 Gradle 多模块写法**——根 `build.gradle` 用 `subprojects {}` 统一给所有子模块配 Java 11、Lombok、wotu 版本,而 Maven 要靠 `<parent>` 继承。

## 2. 依赖管理机制(BOM)— 这是最大概念差异
两者都能用 Spring Boot 的 BOM 统一版本,但实现完全不同。

**Maven — **`<parent>`** 继承(最常见)**

```xml
<parent>
  <groupId>org.springframework.boot</groupId>

  <artifactId>spring-boot-starter-parent</artifactId>

  <version>2.3.12.RELEASE</version>

</parent>

```

parent 里已经声明了 `spring-boot-dependencies` 这个 BOM,所有 starter 的版本自动统一,**不用写 version**。

**Maven — 不继承 parent 时用 import**

```xml
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>

      <artifactId>spring-boot-dependencies</artifactId>

      <version>2.3.12.RELEASE</version>

      <type>pom</type>

      <scope>import</scope>

    </dependency>

  </dependencies>

</dependencyManagement>

```

**Gradle — **`io.spring.dependency-management`** 插件 + BOM import**

```groovy
plugins {
    id 'io.spring.dependency-management' version '1.1.0'
    id 'org.springframework.boot' version '2.3.12.RELEASE'
}
dependencyManagement {
    imports {
        mavenBom 'org.springframework.boot:spring-boot-dependencies:2.3.12.RELEASE'
    }
}
```

> 注意:**Gradle 里 Spring Boot 插件 ≠ 依赖管理**。Spring Boot 插件管打包/运行,版本统一是 `dependency-management` 插件干的。这点 Maven 里两者合并在 parent,容易让人混淆。
>

**你的项目用的就是 Gradle 这套**:wotu 用 `wotu-dependencies` BOM,hutool 用 `hutool-bom`,然后单独 `dependency` 声明 ojdbc/hibernate 的精确版本——这正是 Gradle 的典型 BOM 模式。

## 3. 打包与运行任务
这是 Spring Boot 下**命令差异最大**的地方。

| 能力 | Maven | Gradle |
| --- | --- | --- |
| 打可执行 fat jar | `mvn package`(spring-boot-maven-plugin 的 `repackage`) | `gradle bootJar` |
| 运行应用 | `mvn spring-boot:run` | `gradle bootRun` |
| 打分层 jar(分层 Docker) | `spring-boot:repackage -Dspring-boot.layers.enabled=true` | `gradle bootJar -Dspring-boot.layers.enabled=true` |
| 构建信息(actuator 的 /info) | `spring-boot:build-info` | `gradle bootBuildInfo` |
| 构建 OCI 镜像 | `spring-boot:build-image`(Paketo) | `gradle bootBuildImage` |


**Maven 插件配置:**

```xml
<build>
  <plugins>
    <plugin>
      <groupId>org.springframework.boot</groupId>

      <artifactId>spring-boot-maven-plugin</artifactId>

    </plugin>

  </plugins>

</build>

```

**Gradle 插件配置:**

```groovy
plugins {
    id 'org.springframework.boot' version '2.3.12.RELEASE'
}
```

插件应用后,Gradle 自动注入 `bootJar`、`bootRun`、`bootBuildImage` 等任务。

> 你的项目额外用了 `com.google.cloud.tools.jib`(Jib)打镜像推 Harbor,而不是 Spring Boot 自带的 build-image。Jib 对 Maven/Gradle 都有插件,行为一致。
>

## 4. 构建生命周期 vs 任务图
**Maven — 固定的阶段(phase)链**

```plain
validate → compile → test → package → verify → install → deploy
```

每个插件目标(goal)绑定到某个 phase。`mvn package` 会**依次执行到 package 之前的所有 phase**。生命周期是固定的、线性的。

**Gradle — 任务的有向无环图(DAG)**

```plain
bootRun 依赖 → classes 依赖 → compileJava
                       依赖 → processResources
```

Gradle 没有固定阶段,而是**任务之间的依赖关系**构成 DAG。执行 `bootRun` 时,Gradle 算出它依赖哪些任务(编译、资源),只执行需要的;**输入输出没变就跳过(UP-TO-DATE)**。

| 维度 | Maven | Gradle |
| --- | --- | --- |
| 模型 | 线性阶段链 | 任务 DAG |
| 增量构建 | 弱(基本全量) | 强(按文件 hash 增量,UP-TO-DATE) |
| 并行编译多模块 | 默认串行(`-T` 开并行,弱) | 原生并行(`--parallel`) |
| 构建缓存 | 无(第三方 takari) | 内置 build cache(本地+远程) |
| 守护进程 | 每次新建 JVM | 常驻 Daemon,二次构建快 |


**实际感受**:中大型项目 Gradle 二次构建通常比 Maven 快不少(增量 + Daemon)。你第一次 `compileJava` 用了 2 分 24 秒(下载依赖),之后会快很多。

## 5. 多模块项目结构
两者模块目录结构几乎一样,差别在"如何声明模块关系"。

**Maven — 父 pom + **`<modules>`

```xml
<!-- 根 pom.xml -->
<packaging>pom</packaging>

<modules>
  <module>erpm-message-common</module>

  <module>erpm-message</module>

</modules>

<!-- 子模块 pom.xml -->
<parent>
  <groupId>com.jzt.erpm</groupId>

  <artifactId>erpm-msgcenter</artifactId>

  <version>1.0.0.0-SNAPSHOT</version>

</parent>

<dependencies>
  <dependency>
    <groupId>com.jzt.erpm</groupId>

    <artifactId>erpm-message-common</artifactId>

    <version>${project.version}</version>

  </dependency>

</dependencies>

```

**Gradle — **`settings.gradle`** + **`project()`** 引用**

```groovy
// settings.gradle
include 'erpm-message', 'erpm-message-common'

// build.gradle (子模块依赖)
project(':erpm-message') {
    dependencies {
        implementation project(':erpm-message-common')  // 不用写 version
    }
}
```

| 维度 | Maven | Gradle |
| --- | --- | --- |
| 模块声明 | 父 pom 的 `<modules>` | `settings.gradle` 的 `include` |
| 模块间依赖 | `<dependency>` + 显式 version | `project(':xxx')`,无需 version |
| 版本传递 | `${project.version}` | 自动跟随 |
| 公共配置 | parent 继承 | `subprojects {}` 闭包 |


**你的项目正是 Gradle 多模块典型**:`settings.gradle` include 6 个模块,根 `build.gradle` 用 `subprojects {}` 统一 Java 11/Lombok/BOM,再逐个 `project(':xxx'){}` 配各模块依赖。

## 6. 依赖作用域(scope vs configuration)
**Maven — 6 个固定 scope**  
`compile` / `test` / `provided` / `runtime` / `system` / `import`

**Gradle — 可配置(configuration)体系,Java 插件提供一组**

| Gradle | 对应 Maven | 含义 |
| --- | --- | --- |
| `implementation` | compile(新) | 编译+运行,不暴露给上游 |
| `api` | compile(暴露) | 编译+运行,**暴露给上游模块** |
| `compileOnly` | provided | 仅编译,不打包 |
| `runtimeOnly` | runtime | 仅运行 |
| `testImplementation` | test | 测试编译+运行 |
| `annotationProcessor` | (无直接对应) | 注解处理器(Lombok 等) |


> 关键区别:Gradle 区分 `api` 和 `implementation`——`api` 会出现在下游模块的编译 classpath,`implementation` 不会。Maven 的 `compile` 一律传递。**你的项目大量用 **`api`(如 `erpm-message-common` 的 wotu 依赖用 `api`),这样依赖能透传到 `erpm-message`/`erpm-message-api`。
>

还有 `java-library` 插件(你项目用了)才提供 `api`,普通 `java` 插件只有 `implementation`。

## 7. 常用命令对照表
| 操作 | Maven | Gradle |
| --- | --- | --- |
| 清理 | `mvn clean` | `gradle clean` |
| 编译 | `mvn compile` | `gradle compileJava` |
| 测试 | `mvn test` | `gradle test` |
| 打包 | `mvn package` | `gradle build`(含 test)/ `gradle bootJar`(只要 fat jar) |
| 跳过测试 | `mvn install -DskipTests` | `gradle build -x test` |
| 运行 | `mvn spring-boot:run` | `gradle bootRun` |
| 查看依赖树 | `mvn dependency:tree` | `gradle dependencies`(你项目还自定义了 `allDeps` 任务) |
| 单模块操作 | `mvn -pl erpm-message ...` | `gradle :erpm-message:bootRun` |
| 安装到本地仓库 | `mvn install` | `gradle build`(配合 maven-publish 插件 `publishToMavenLocal`) |
| 发布到 Nexus | `mvn deploy` | `gradle publish`(maven-publish 插件) |


> Gradle 的多模块任务路径用冒号:`:erpm-message:bootRun`(你刚才一直用的就是这个)。
>

## 8. 性能与生态
| 维度 | Maven | Gradle |
| --- | --- | --- |
| 大项目构建速度 | 较慢(全量为主) | 快(增量 + Daemon + 缓存) |
| 配置灵活度 | 低(XML 难写逻辑) | 高(DSL 可编程) |
| 学习曲线 | 平缓(规则固定) | 较陡(要懂 Groovy/DAG) |
| 插件生态 | 极丰富,行业标准 | 丰富,Android 阵营首选 |
| 企业 CI | 几乎通用 | 通用 |
| Spring Boot 官方支持 | ✅ 一等公民 | ✅ 一等公民 |


## 总结一句话
**Spring Boot 在 Maven 和 Gradle 上功能完全对等**;选哪个取决于团队偏好和项目规模——

+ **小/中型、团队不熟 DSL、要稳定可预期** → Maven(XML 啰嗦但"所见即所得",不会出 DSL 魔法 bug)
+ **大/多模块、追求构建速度、需要灵活逻辑(条件依赖、自定义任务)** → Gradle(配置简洁、增量快,但调试 DSL 要花功夫)

你的 `erpm-msgcenter` 是 6 模块的中大型工程,用 wotu 自研 BOM,用 Jib 打镜像,**用 Gradle 是合理选择**——`subprojects {}` 统一配置、`api`/`implementation` 精细控依赖透传,这些都是 Maven 做起来更费劲的点。

---

需要我接着讲一个具体点吗?比如:

+ 你这个 Gradle 项目如何**配置 bootRun 的断点调试**(让 IDEA 能 debug bootRun)
+ 或 Gradle 的**依赖冲突排查**(`dependencies` / `dependencyInsight`)实战

