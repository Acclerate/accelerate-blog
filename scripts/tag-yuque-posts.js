#!/usr/bin/env node
/**
 * 一次性脚本：为 content/posts/yuque/*.md 补充 tags 字段
 *
 * 设计原则：
 *   - 主分类标签（必给）：Java/Spring/并发/数据库/Redis/微服务/工具/前端/K8s/安全/笔记
 *   - 技术点标签（可选）：HashMap/事务/缓存/线程池/Nginx/Maven...
 *   - 已有 tags 则跳过（不覆盖手动设置）
 *   - 保持原有 front matter 其他字段不动
 *
 * 用法： node scripts/tag-yuque-posts.js
 */

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '..', 'content', 'posts', 'yuque');

// ============ 文件 → 标签 映射表（手动分类）============
// 每篇文章的主分类 + 技术点标签
const TAG_RULES = {
  // ===== Java 语言/基础 =====
  'HashMap.md':                                    ['Java', '集合', '数据结构'],
  'Java - SPI机制.md':                             ['Java', 'SPI', '源码'],
  'JVM参数说明.md':                                ['Java', 'JVM', '调优'],
  'Java内存溢出排查思路.md':                       ['Java', 'JVM', '排查'],
  'Java线上排查问题工具——Arthas.md':               ['Java', 'Arthas', '排查', '工具'],
  '多线程场景下使用 ArrayList.md':                 ['Java', '并发', '集合'],
  '线程池的核心参数以及运行原理.md':               ['Java', '并发', '线程池'],
  'CompletableFuture.allOf(XXX).join();.md':       ['Java', '并发'],
  'Thread-CompletableFuture-Test.md':              ['Java', '并发'],

  // ===== Spring 框架 =====
  'Spring三级缓存详解.md':                         ['Spring', '源码', 'IoC'],
  'Spring事务源码解析.md':                         ['Spring', '事务', '源码'],
  'Spring使用@Transactional 管理事务，Java事务详解。.md': ['Spring', '事务'],
  'spring 事务失效.md':                            ['Spring', '事务', '踩坑'],
  'Spring boot自定义注解实现接口缓存.md':          ['Spring', '缓存', 'AOP'],
  'MapStruct 语法和技术点说明及最小用例.md':       ['Java', 'MapStruct', '工具'],

  // ===== 数据库 =====
  'B+Tree详解.md':                                 ['数据库', 'MySQL', '索引', '数据结构'],
  '深度分页问题分析和优化.md':                     ['数据库', 'MySQL', '性能优化'],

  // ===== Redis =====
  'redis模糊批量删除.md':                          ['Redis', '运维'],
  'Lock4j + Redis基于 Redis 的 AP 特性来实现分布式锁.md': ['Redis', '并发', '分布式锁', '微服务'],

  // ===== 微服务 =====
  'ShenYu 网关注册接入 — 改动总结.md':              ['微服务', 'ShenYu', '网关'],
  'divide-plugin-验证手册.md':                     ['微服务', 'ShenYu', '网关'],
  'sign-plugin-验证手册.md':                       ['微服务', 'ShenYu', '安全', '加签验签'],
  '微服务模块化结构规范（Spring Cloud + Gradle）.md': ['微服务', 'Spring Cloud', '规范'],

  // ===== K8s / 云原生 =====
  '挂载自定义 JAR 导致 Pod 漂移到其他 Node 的深层次原因分析.md': ['K8s', '踩坑', '原理'],

  // ===== 安全 =====
  '时间戳防重放机制深度解析.md':                    ['安全', '原理', '加签验签'],

  // ===== 工具 / 运维 =====
  'Nginx 配置.md':                                 ['Nginx', '运维', '工具'],
  'maven&gradle.md':                               ['Maven', 'Gradle', '构建工具'],
  '常用类似 maven idea 的命.md':                    ['Maven', 'IDEA', '工具'],
  'Anaconda创建、删除虚拟环境以及一些conda常用指令.md': ['Python', 'Anaconda', '工具'],
  'npm常用命令.md':                                ['Node.js', 'npm', '工具'],
  'nvm安装.md':                                    ['Node.js', 'nvm', '工具'],
  'win查看所有端口和PID.md':                       ['Windows', '运维', '工具'],

  // ===== 前端 =====
  'vue! 2.6.10 随笔.md':                           ['前端', 'Vue'],
  '前端el-date-picker标签异常排查小记.md':          ['前端', 'ElementUI', '踩坑'],

  // ===== 其他 =====
  '玩转语雀文档💡.md':                              ['笔记'],
};

// ============ Front matter 解析/序列化 ============
// 简单的 YAML front matter 解析（只处理我们用的简单 KV 格式）

function parseFrontMatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { hasFM: false, fm: {}, body: content };
  }
  const fmText = match[1];
  const body = match[2];
  const fm = {};
  fmText.split(/\r?\n/).forEach((line) => {
    // 跳过空行
    if (!line.trim()) return;
    // 简单解析 key: value（不处理嵌套）
    const m = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (m) {
      let val = m[2];
      // 去掉单/双引号包裹
      if ((val.startsWith("'") && val.endsWith("'")) ||
          (val.startsWith('"') && val.endsWith('"'))) {
        val = val.slice(1, -1);
      }
      fm[m[1]] = val;
    }
  });
  return { hasFM: true, fm, body };
}

function buildFrontMatter(fm) {
  const lines = ['---'];
  // 固定字段顺序：title → urlname → date → updated → tags → description
  const order = ['title', 'urlname', 'date', 'updated', 'tags', 'description', 'draft'];
  for (const key of order) {
    if (fm[key] === undefined) continue;
    const val = fm[key];
    if (key === 'tags') {
      // tags 是数组，输出 YAML 数组格式
      if (Array.isArray(val) && val.length > 0) {
        lines.push(`tags:`);
        val.forEach((t) => lines.push(`  - ${t}`));
      } else if (Array.isArray(val) && val.length === 0) {
        // 空数组不输出
      } else {
        lines.push(`tags: ${val}`);
      }
    } else if (val !== undefined && val !== null) {
      // 字符串值用引号包起来（防止特殊字符破坏 YAML）
      const safeVal = String(val).replace(/'/g, "''");
      lines.push(`${key}: '${safeVal}'`);
    }
  }
  // 其他不在 order 里的字段
  for (const key of Object.keys(fm)) {
    if (order.includes(key)) continue;
    const val = fm[key];
    const safeVal = String(val).replace(/'/g, "''");
    lines.push(`${key}: '${safeVal}'`);
  }
  lines.push('---');
  return lines.join('\n');
}

// ============ 主流程 ============

function processFile(filePath) {
  const filename = path.basename(filePath);
  const tags = TAG_RULES[filename];

  if (!tags) {
    console.warn(`⚠️  未配置标签规则: ${filename}（跳过）`);
    return { skipped: true };
  }

  const original = fs.readFileSync(filePath, 'utf8');
  const { hasFM, fm, body } = parseFrontMatter(original);

  if (!hasFM) {
    console.warn(`⚠️  无 front matter: ${filename}（跳过）`);
    return { skipped: true };
  }

  // 已有 tags 就不覆盖
  if (fm.tags && (!Array.isArray(fm.tags) || fm.tags.length > 0)) {
    console.log(`⏭️  已有 tags: ${filename}`);
    return { skipped: true };
  }

  fm.tags = tags;

  // 生成 description（如果缺失，用 title 兜底）
  if (!fm.description) {
    fm.description = fm.title || filename.replace(/\.md$/, '');
  }

  const newContent = buildFrontMatter(fm) + '\n' + body;

  if (newContent === original) {
    return { skipped: true };
  }

  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`✅ ${filename} → [${tags.join(', ')}]`);
  return { updated: true };
}

// ============ 入口 ============

if (!fs.existsSync(POSTS_DIR)) {
  console.error(`❌ 目录不存在: ${POSTS_DIR}`);
  process.exit(1);
}

const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));
console.log(`📚 找到 ${files.length} 篇文章\n`);

let updated = 0;
let skipped = 0;
let unmatched = 0;

for (const f of files) {
  const result = processFile(path.join(POSTS_DIR, f));
  if (result.updated) updated++;
  else if (result.skipped) skipped++;
  else unmatched++;
}

console.log(`\n📊 统计：更新 ${updated} / 跳过 ${skipped} / 未匹配 ${unmatched} / 共 ${files.length}`);
