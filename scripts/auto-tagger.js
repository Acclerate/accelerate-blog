/**
 * 自动打标签器 —— 给语雀文章按标题/内容打分类标签
 *
 * 用法：
 *   1. 在 elog.config.js 的 deploy.local.formatExt 里引用
 *   2. 在 scripts/tag-yuque-posts.js 里引用（给已存在的文件补 tags）
 *
 * 规则按"优先级 + 关键词匹配"，第一条命中即停止。
 */

/**
 * 主分类规则表（按优先级排序，越靠前越优先）
 * @type {Array<{tags: string[], match: (title: string, body: string) => boolean}>}
 */
const RULES = [
  // ===== 高优先级：明确的工具/产品名 =====
  {
    tags: ['微服务', 'ShenYu', '网关'],
    match: (t) => /ShenYu|shenyu|divide-plugin|sign-plugin/i.test(t),
  },
  {
    tags: ['前端', 'Vue'],
    match: (t) => /\bvue\b|el-form|el-date-picker|elementui/i.test(t),
  },
  {
    tags: ['前端', 'ElementUI'],
    match: (t, b) => /el-date-picker|el-form|elementui/i.test(t + b),
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
    tags: ['Maven', 'Gradle'],
    match: (t) => /maven|gradle/i.test(t),
  },
  {
    tags: ['Java', 'Arthas'],
    match: (t) => /arthas/i.test(t),
  },
  {
    tags: ['Java', 'MapStruct'],
    match: (t) => /mapstruct/i.test(t),
  },
  {
    tags: ['K8s', '云原生'],
    match: (t, b) => /kubernetes|k8s|\bpod\b|\bnode\b.*漂移/i.test(t + b),
  },
  {
    tags: ['安全', '加签验签'],
    match: (t, b) => /加签|验签|防重放|签名.*验证|rsa-?sha?256/i.test(t + b),
  },

  // ===== Spring 框架相关 =====
  {
    tags: ['Spring', '事务'],
    match: (t) => /事务|Transactional/i.test(t),
  },
  {
    tags: ['Spring', '源码', 'IoC'],
    match: (t) => /三级缓存|循环依赖/i.test(t),
  },
  {
    tags: ['Spring', '缓存', 'AOP'],
    match: (t, b) => /接口缓存|自定义注解.*缓存|AOP.*缓存/i.test(t + b),
  },
  {
    tags: ['Spring'],
    match: (t) => /\bspring\b/i.test(t),
  },

  // ===== Redis =====
  {
    tags: ['Redis'],
    match: (t) => /redis|分布式锁|Lock4j/i.test(t),
  },
  {
    tags: ['Redis', '分布式锁'],
    match: (t, b) => /Lock4j|Redisson|分布式锁/i.test(t + b),
  },

  // ===== 数据库 =====
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
    match: (t) => /\bmysql\b|\bsql\b|数据库|索引|事务/i.test(t),
  },

  // ===== Java 并发 =====
  {
    tags: ['Java', '并发', '线程池'],
    match: (t) => /线程池|ThreadPool/i.test(t),
  },
  {
    tags: ['Java', '并发'],
    match: (t) => /CompletableFuture|多线程|并发|concurrent/i.test(t),
  },

  // ===== Java 基础 / JVM =====
  {
    tags: ['Java', 'JVM'],
    match: (t) => /\bjvm\b|内存溢出|OutOfMemory|GC/i.test(t),
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

  // ===== 运维 / 工具类（兜底） =====
  {
    tags: ['Windows', '运维'],
    match: (t) => /win|windows|端口|pid/i.test(t),
  },
  {
    tags: ['IDEA', '工具'],
    match: (t) => /idea|ide/i.test(t),
  },
];

/**
 * 默认标签（所有规则都没命中时）
 */
const DEFAULT_TAGS = ['笔记'];

/**
 * 给一篇文章打标签
 * @param {string} title 文章标题
 * @param {string} body  正文内容（可选，传前 500 字够用）
 * @returns {string[]}
 */
function autoTag(title, body = '') {
  const safeTitle = title || '';
  const safeBody = (body || '').slice(0, 500);

  for (const rule of RULES) {
    try {
      if (rule.match(safeTitle, safeBody)) {
        return rule.tags;
      }
    } catch (e) {
      // 单条规则出错不影响其他规则
      continue;
    }
  }
  return DEFAULT_TAGS;
}

module.exports = { autoTag, RULES, DEFAULT_TAGS };
