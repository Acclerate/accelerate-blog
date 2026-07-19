/**
 * 自动打标签器 —— 给语雀文章按标题/内容打分类标签
 *
 * 设计：两阶段匹配
 *   1. 主分类（PRIMARY_RULES）：首条命中即返回，决定第一个标签
 *      - 这是文章的"主题"，唯一明确
 *   2. 附加标签（EXTRA_RULES）：所有规则都试一遍，命中的全部累加
 *      - 用于补充技术点、工具名等次要标签
 *
 * 最终 tags = 主分类 + 附加标签（去重，保持顺序）
 *
 * 用法：
 *   const { autoTag } = require('./scripts/auto-tagger');
 *   autoTag('文章标题', '正文前 500 字');
 */

// ============================================================
// 阶段 1：主分类规则（按优先级，首条命中即返回）
// ============================================================
const PRIMARY_RULES = [
  // ===== Spring 生态（最高优先级）=====
  // 注意：标题/正文明确以 Spring 为主题才算
  // ShenYu / 前端 / K8s 等文章里偶尔提到 spring 不算
  {
    tags: ['Spring', '事务'],
    match: (t, b) => /事务|@Transactional/i.test(t),
  },
  {
    tags: ['Spring', '源码', 'IoC'],
    match: (t) => /三级缓存|循环依赖/i.test(t),
  },
  {
    tags: ['Spring', '缓存', 'AOP'],
    match: (t) => /接口缓存|自定义注解.*缓存|缓存.*AOP/i.test(t),
  },
  {
    tags: ['Spring', '微服务', 'Spring Cloud'],
    match: (t) => /Spring\s*Cloud/i.test(t),
  },
  {
    tags: ['Spring', 'Redis', '分布式锁'],
    match: (t) => /Lock4j/i.test(t),
  },
  {
    tags: ['Spring', 'MapStruct'],
    match: (t) => /MapStruct/i.test(t),
  },
  {
    // maven/gradle + Spring Boot 强相关
    tags: ['Spring', 'Maven', 'Gradle', '构建工具'],
    match: (t, b) => /\b(?:maven|gradle)\b/i.test(t) &&
                     /spring|spring\s*boot/i.test(t + b),
  },
  {
    // Spring Boot / Spring 注解为正文主题
    tags: ['Spring'],
    match: (t) => /\bSpring\b/i.test(t),
  },

  // ===== 其他主分类（Spring 没命中才走这些）=====
  {
    tags: ['微服务', 'ShenYu', '网关'],
    match: (t) => /ShenYu|shenyu|divide-plugin|sign-plugin/i.test(t),
  },
  {
    tags: ['微服务'],
    match: (t, b) => /微服务|Spring\s*Cloud|Nacos|Sentinel/i.test(t + b),
  },
  {
    tags: ['前端', 'Vue'],
    match: (t) => /\bvue\b/i.test(t),
  },
  {
    tags: ['前端', 'ElementUI'],
    match: (t) => /el-date-picker|el-form|elementui/i.test(t),
  },
  {
    tags: ['Nginx'],
    match: (t) => /nginx/i.test(t),
  },
  {
    tags: ['Python', 'Anaconda'],
    match: (t) => /anaconda|conda/i.test(t),
  },
  {
    tags: ['Node.js', 'npm'],
    match: (t) => /\bnpm\b/i.test(t),
  },
  {
    tags: ['Node.js', 'nvm'],
    match: (t) => /\bnvm\b/i.test(t),
  },
  {
    tags: ['Maven', 'Gradle', '构建工具'],
    match: (t) => /\b(?:maven|gradle)\b/i.test(t),
  },
  {
    tags: ['Java', 'Arthas', '排查'],
    match: (t) => /arthas/i.test(t),
  },
  {
    tags: ['K8s', '云原生'],
    match: (t, b) => /kubernetes|k8s|\bpod\b/i.test(t) ||
                     /\bpod\b.*漂移/i.test(t + b),
  },
  {
    tags: ['安全', '加签验签'],
    match: (t, b) => /加签|验签|防重放|rsa-?sha?256/i.test(t + b),
  },
  {
    tags: ['Redis'],
    match: (t) => /redis/i.test(t),
  },
  {
    tags: ['数据库', 'MySQL', '索引', '数据结构'],
    match: (t) => /B\+Tree|B树|索引/i.test(t),
  },
  {
    tags: ['数据库', 'MySQL', '性能优化'],
    match: (t) => /深度分页|分页.*优化/i.test(t),
  },
  {
    tags: ['数据库'],
    match: (t) => /\bmysql\b|\bsql\b|数据库/i.test(t),
  },
  {
    tags: ['Java', '并发', '线程池'],
    match: (t) => /线程池|ThreadPool/i.test(t),
  },
  {
    tags: ['Java', '并发'],
    match: (t) => /CompletableFuture|多线程|并发/i.test(t),
  },
  {
    tags: ['Java', 'JVM'],
    match: (t) => /\bjvm\b|内存溢出|OutOfMemory/i.test(t),
  },
  {
    tags: ['Java', 'SPI'],
    match: (t) => /\bspi\b|服务发现/i.test(t),
  },
  {
    tags: ['Java', '集合', '数据结构'],
    match: (t) => /HashMap|ArrayList|LinkedList|ConcurrentHashMap/i.test(t),
  },
  {
    tags: ['Java'],
    match: (t) => /\bjava\b/i.test(t),
  },
  {
    tags: ['Windows', '运维'],
    match: (t) => /\bwin\b|windows|端口|pid/i.test(t),
  },
];

// ============================================================
// 阶段 2：附加标签规则（全部试一遍，命中的都加）
// ============================================================
const EXTRA_RULES = [
  { tag: '源码',       match: (t) => /源码|源码解析/i.test(t) },
  { tag: '原理',       match: (t, b) => /原理|如何实现|运行原理|深度解析|机制/i.test(t) },
  { tag: '踩坑',       match: (t, b) => /踩坑|失效|异常排查|问题分析|坑/i.test(t) },
  { tag: '排查',       match: (t, b) => /排查|问题工具|线上问题/i.test(t) },
  { tag: '性能优化',   match: (t) => /性能优化|优化|调优/i.test(t) },
  { tag: 'JVM',        match: (t) => /\bjvm\b|内存溢出|GC/i.test(t) },
  { tag: 'Arthas',     match: (t) => /arthas/i.test(t) },
  { tag: 'IDEA',       match: (t, b) => /\bidea\b|\bide\b/i.test(t) },
  { tag: '工具',       match: (t, b) => /^(.*工具.*|.*命令.*|.*手册.*)$|常用命令|指令/i.test(t) },
  { tag: '运维',       match: (t, b) => /运维|部署|安装|端口|pid/i.test(t) },
  { tag: '安全',       match: (t, b) => /加签|验签|防重放|签名/i.test(t + b) },
  { tag: '微服务',     match: (t, b) => /微服务|网关|Spring\s*Cloud|Nacos/i.test(t + b) },
  { tag: '分布式锁',   match: (t, b) => /Lock4j|Redisson|分布式锁/i.test(t + b) },
  { tag: '云原生',     match: (t, b) => /kubernetes|k8s|pod|docker/i.test(t + b) },
];

// ============================================================
// 主函数
// ============================================================

const DEFAULT_TAGS = ['笔记'];

function autoTag(title, body = '') {
  const safeTitle = title || '';
  const safeBody = (body || '').slice(0, 500);

  // 阶段 1：找主分类
  let primary = null;
  for (const rule of PRIMARY_RULES) {
    try {
      if (rule.match(safeTitle, safeBody)) {
        primary = rule.tags;
        break;
      }
    } catch (e) {
      continue;
    }
  }

  // 阶段 2：累加附加标签
  const extras = [];
  for (const rule of EXTRA_RULES) {
    try {
      if (rule.match(safeTitle, safeBody)) {
        extras.push(rule.tag);
      }
    } catch (e) {
      continue;
    }
  }

  // 合并 + 去重（保持顺序）
  const all = (primary || DEFAULT_TAGS).concat(extras);
  const seen = new Set();
  const result = [];
  for (const t of all) {
    if (!seen.has(t)) {
      seen.add(t);
      result.push(t);
    }
  }

  return result;
}

// ============================================================
// 自动生成 description（用于未来同步的新文章）
// 策略：取正文第一段非空文本，截断到 ~80 字
// ============================================================

/**
 * 从正文中提取第一段有意义的文字作为 description
 * @param {string} title 文章标题（避免 description 与 title 完全相同）
 * @param {string} body  正文
 * @returns {string}
 */
function autoDescription(title, body = '') {
  if (!body) return title || '';

  let text = body;

  // 去掉代码块 ```...```
  text = text.replace(/```[\s\S]*?```/g, '');
  // 去掉行内代码 `xxx`
  text = text.replace(/`[^`]+`/g, '');
  // 去掉 HTML 标签（语雀导出的 font/span/div 等）
  text = text.replace(/<[^>]+>/g, '');
  // 去掉 markdown 标题井号
  text = text.replace(/^#{1,6}\s*/gm, '');
  // 去掉 markdown 图片/链接语法
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  // 去掉语雀的 :::xxx 块标记
  text = text.replace(/^:::[a-zA-Z0-9]*$/gm, '');

  // 按空行分段，取第一个非空且长度 > 5 的段
  const paragraphs = text.split(/\n\s*\n/);
  let firstParagraph = '';
  for (const p of paragraphs) {
    const cleaned = p.replace(/\s+/g, ' ').trim();
    if (cleaned.length > 5) {
      firstParagraph = cleaned;
      break;
    }
  }

  if (!firstParagraph) {
    // 实在提取不到，退化为标题
    return title || '';
  }

  // 截断到 80 字（加省略号）
  if (firstParagraph.length > 80) {
    return firstParagraph.slice(0, 80) + '…';
  }
  return firstParagraph;
}

module.exports = { autoTag, autoDescription, PRIMARY_RULES, EXTRA_RULES, DEFAULT_TAGS };
