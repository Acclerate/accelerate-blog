#!/usr/bin/env node
/**
 * 批量重写 content/posts/yuque/*.md 的 description 字段
 *
 * 之前的 description 都是直接复制 title，没意义。
 * 现在根据每篇文章的标题 + 正文前几段，手写简短描述。
 *
 * 用法：
 *   node scripts/rewrite-descriptions.js            # 实际写入
 *   node scripts/rewrite-descriptions.js --dry-run  # 只预览不写入
 */

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '..', 'content', 'posts', 'yuque');

// ============================================================
// 文件名 → 新 description 映射表
// 每条都是基于标题+正文人工提炼的简短描述（与标题不同）
// ============================================================
const DESCRIPTIONS = {
  // ===== Java 语言/基础 =====
  'HashMap.md':
    '从默认长度、扩容机制到数组/链表/红黑树的转换流程，梳理 HashMap 的核心原理。',
  'Java - SPI机制.md':
    '介绍 Java SPI 服务发现机制的概念、使用场景与实现原理，解耦模块装配。',
  'JVM参数说明.md':
    '梳理常用 JVM 启动参数：堆大小、GC 策略、日志输出、内存溢出转储等配置项。',
  'Java内存溢出排查思路.md':
    '从确认 OOM、生成 Heap Dump 到使用 jmap 等工具分析，总结内存溢出的排查步骤。',
  'Java线上排查问题工具——Arthas.md':
    '阿里开源的 Java 在线诊断工具，无需重启应用即可查看方法调用、监控耗时。',
  '多线程场景下使用 ArrayList.md':
    'ArrayList 非线程安全，多线程下可用 Collections.synchronizedList 或 CopyOnWriteArrayList。',
  '线程池的核心参数以及运行原理.md':
    '梳理 Java 创建线程的四种方式，详解 ThreadPoolExecutor 的核心参数与运行流程。',
  'CompletableFuture.allOf(XXX).join();.md':
    '使用 CompletableFuture.allOf 等待多个异步任务全部完成后继续执行的代码示例。',
  'Thread-CompletableFuture-Test.md':
    'Java 多线程与 CompletableFuture 异步编程的测试代码合集。',

  // ===== Spring 框架 =====
  'Spring三级缓存详解.md':
    '从getSingleton、doCreateBean 到三级缓存源码，解析 Spring 如何解决循环依赖。',
  'Spring事务源码解析.md':
    '深入 Spring 声明式事务源码，解析基于 AOP 的代理对象生成与事务拦截流程。',
  'Spring使用@Transactional 管理事务，Java事务详解。.md':
    '从 ACID 特性出发，介绍 Spring @Transactional 注解的声明式事务管理与 Java 事务基础。',
  'spring 事务失效.md':
    '汇总 Spring 事务常见的失效场景：非 public 方法、自调用、异常被吞、传播行为错误等。',
  'Spring boot自定义注解实现接口缓存.md':
    '结合 Spring AOP 与 Redis，通过自定义注解优雅地为接口加上缓存以提升访问效率。',
  'MapStruct 语法和技术点说明及最小用例.md':
    '梳理 MapStruct 的 @Mapper、多源参数映射等 5 个核心特性，含最小可运行用例。',

  // ===== 数据库 =====
  'B+Tree详解.md':
    '从二叉查找树、平衡二叉树到 B 树，层层递进解析 InnoDB 索引背后的 B+Tree 结构。',
  '深度分页问题分析和优化.md':
    '分析 MySQL 深度分页 LIMIT offset,size 性能下降的根因，给出子查询与游标方案。',

  // ===== Redis =====
  'redis模糊批量删除.md':
    'Redis 没有直接的模糊批量删除命令，通过 SCAN + DEL 组合实现安全的批量删除。',
  'Lock4j + Redis基于 Redis 的 AP 特性来实现分布式锁.md':
    '解析 @Lock4j 注解的属性、key 生成规则、典型用法与基于 Redis AP 特性的底层流程。',

  // ===== 微服务 =====
  'ShenYu 网关注册接入 — 改动总结.md':
    '将应用作为 ShenYu client，启动时上报 HTTP 接口元数据，由 divide 插件统一转发。',
  'divide-plugin-验证手册.md':
    'ShenYu 2.6.1 divide 插件的功能验证手册，覆盖环境搭建与流量转发测试。',
  'sign-plugin-验证手册.md':
    'ShenYu 加签验签插件验证手册，基于 RSA-SHA256 实现支付级请求签名校验。',
  '微服务模块化结构规范（Spring Cloud + Gradle）.md':
    'Spring Cloud + Gradle 微服务的模块划分规范：公共、API、服务、Web、启动模块的职责拆分。',

  // ===== K8s / 云原生 =====
  '挂载自定义 JAR 导致 Pod 漂移到其他 Node 的深层次原因分析.md':
    '分析挂载自定义 JAR 后 Kubernetes Pod 漂移到其他 Node 的深层次原因与迁移预案。',

  // ===== 安全 =====
  '时间戳防重放机制深度解析.md':
    '从签名、时间戳、随机数三要素剖析防重放机制原理，结合 PayRsaSignService 代码深度解析。',

  // ===== 工具 / 运维 =====
  'Nginx 配置.md':
    '常用 Nginx 配置片段合集：SSL 证书、动静分离、直接返回文本、location 重写等。',
  'maven&gradle.md':
    '对比 Maven 与 Gradle 在 Spring Boot 项目下的差异，分析 bootRun 是否为推荐运行方式。',
  '常用类似 maven idea 的命.md':
    'IntelliJ IDEA 项目文件 .ipr / .iws / .iml 的生成命令与作用说明。',
  'Anaconda创建、删除虚拟环境以及一些conda常用指令.md':
    '使用 conda create / remove / clone 管理虚拟环境，附常用 conda 指令速查。',
  'npm常用命令.md':
    'npm 常用配置与命令：修改 prefix/cache 路径、.npmrc 文件、全局包管理等。',
  'nvm安装.md':
    'Windows 下 nvm-setup.exe 的安装步骤、Node 版本管理与常用命令中文示意。',
  'win查看所有端口和PID.md':
    '应用启动失败时端口被占用的排查：netstat 查端口 PID、taskkill 杀进程。',

  // ===== 前端 =====
  'vue! 2.6.10 随笔.md':
    'Vue 2.6 中 el-form 表单校验：通过 :rules 设置规则、prop 绑定，封装让校验更便捷。',
  '前端el-date-picker标签异常排查小记.md':
    'ElementUI el-date-picker 更新时数据为空的排查：用 this.$forceUpdate() 强制刷新视图。',

  // ===== 其他 =====
  '玩转语雀文档💡.md':
    '语雀文档编辑器入门介绍：字体、排版、代码块、附件等常用功能的使用说明。',
};

// ============================================================
// front matter 解析与重写
// ============================================================

function updateDescription(filePath, newDesc) {
  const filename = path.basename(filePath);
  const original = fs.readFileSync(filePath, 'utf8');

  // 匹配 front matter 里的 description 行
  // 支持：description: xxx | description: 'xxx' | description: "xxx"
  const descRegex = /^description:\s*(.*)$/m;
  const match = original.match(descRegex);
  if (!match) {
    console.warn(`⚠️  无 description 字段: ${filename}`);
    return false;
  }

  // 转义单引号（YAML 字符串用单引号包裹时内部单引号要写成两遍）
  const safeDesc = newDesc.replace(/'/g, "''");
  const newLine = `description: '${safeDesc}'`;

  return { original, newContent: original.replace(descRegex, newLine) };
}

// ============================================================
// 主流程
// ============================================================

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run') || argv.includes('-n');

if (!fs.existsSync(POSTS_DIR)) {
  console.error(`❌ 目录不存在: ${POSTS_DIR}`);
  process.exit(1);
}

const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));
console.log(`📄 共 ${files.length} 篇文章`);
console.log(`⚙️  模式: ${DRY_RUN ? '预览（不写入）' : '实际写入'}\n`);

let updated = 0;
let skipped = 0;
let noRule = 0;

for (const f of files) {
  const newDesc = DESCRIPTIONS[f];
  if (!newDesc) {
    console.log(`⚠️  未配置描述: ${f}`);
    noRule++;
    continue;
  }

  const filePath = path.join(POSTS_DIR, f);
  const result = updateDescription(filePath, newDesc);

  if (!result) {
    skipped++;
    continue;
  }

  if (result.newContent === result.original) {
    skipped++;
    continue;
  }

  console.log(`✅ ${f}`);
  console.log(`     → ${newDesc}`);

  if (!DRY_RUN) {
    fs.writeFileSync(filePath, result.newContent, 'utf8');
  }
  updated++;
}

console.log(`\n📊 统计：更新 ${updated} / 跳过 ${skipped} / 未配置 ${noRule} / 共 ${files.length}`);
if (DRY_RUN) console.log('⚠️  dry-run 模式，未写入任何文件');
