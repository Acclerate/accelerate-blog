#!/usr/bin/env node
/**
 * 批量为 content/posts/yuque/*.md 打 tags
 *
 * 工作方式：
 *   - 使用 scripts/auto-tagger.js 的 autoTag 函数（与 elog 同步时用同一套规则）
 *   - 默认跳过已有 tags 的文件（保留手动设置）
 *   - 加 --force 参数：强制覆盖所有文件的 tags（用最新规则重新打）
 *
 * 用法：
 *   node scripts/tag-yuque-posts.js            # 只给没标签的文件补标签
 *   node scripts/tag-yuque-posts.js --force    # 强制用最新规则重打所有文件
 *   node scripts/tag-yuque-posts.js --dry-run  # 只看不写
 */

const fs = require('fs');
const path = require('path');
const { autoTag } = require('./auto-tagger');

const POSTS_DIR = path.join(__dirname, '..', 'content', 'posts', 'yuque');

const argv = process.argv.slice(2);
const FORCE = argv.includes('--force') || argv.includes('-f');
const DRY_RUN = argv.includes('--dry-run') || argv.includes('-n');

// ============ Front matter 解析/序列化 ============

function parseFrontMatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { hasFM: false, fm: {}, body: content };
  }
  const fmText = match[1];
  const body = match[2];
  const fm = {};
  let currentArrayKey = null;

  fmText.split(/\r?\n/).forEach((line) => {
    if (!line.trim()) return;

    // YAML 数组项：  - xxx
    const arrayItemMatch = line.match(/^\s+-\s+(.*)$/);
    if (arrayItemMatch && currentArrayKey) {
      if (!Array.isArray(fm[currentArrayKey])) {
        fm[currentArrayKey] = [];
      }
      let val = arrayItemMatch[1];
      if ((val.startsWith("'") && val.endsWith("'")) ||
          (val.startsWith('"') && val.endsWith('"'))) {
        val = val.slice(1, -1);
      }
      fm[currentArrayKey].push(val);
      return;
    }

    // 普通 key: value
    const m = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (m) {
      currentArrayKey = null;
      let val = m[2];
      if ((val.startsWith("'") && val.endsWith("'")) ||
          (val.startsWith('"') && val.endsWith('"'))) {
        val = val.slice(1, -1);
      }
      // 空值说明可能是数组开头
      if (val === '') {
        fm[m[1]] = [];
        currentArrayKey = m[1];
      } else {
        fm[m[1]] = val;
      }
    }
  });
  return { hasFM: true, fm, body };
}

function buildFrontMatter(fm) {
  const lines = ['---'];
  const order = ['title', 'urlname', 'date', 'updated', 'tags', 'description', 'draft'];
  for (const key of order) {
    if (fm[key] === undefined) continue;
    const val = fm[key];
    if (key === 'tags') {
      if (Array.isArray(val) && val.length > 0) {
        lines.push(`tags:`);
        val.forEach((t) => lines.push(`  - ${t}`));
      }
    } else if (val !== undefined && val !== null) {
      const safeVal = String(val).replace(/'/g, "''");
      lines.push(`${key}: '${safeVal}'`);
    }
  }
  // 其他字段
  for (const key of Object.keys(fm)) {
    if (order.includes(key)) continue;
    const val = fm[key];
    if (Array.isArray(val)) {
      lines.push(`${key}:`);
      val.forEach((t) => lines.push(`  - ${t}`));
    } else {
      const safeVal = String(val).replace(/'/g, "''");
      lines.push(`${key}: '${safeVal}'`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

// ============ 主流程 ============

function processFile(filePath) {
  const filename = path.basename(filePath);
  const original = fs.readFileSync(filePath, 'utf8');
  const { hasFM, fm, body } = parseFrontMatter(original);

  if (!hasFM) {
    console.warn(`⚠️  无 front matter: ${filename}（跳过）`);
    return { skipped: true };
  }

  const hasTags = Array.isArray(fm.tags) ? fm.tags.length > 0 : Boolean(fm.tags);

  // 非 force 模式下，已有 tags 就跳过
  if (hasTags && !FORCE) {
    console.log(`⏭️  已有 tags（用 --force 覆盖）: ${filename}`);
    return { skipped: true };
  }

  // 用 autoTag 规则计算新标签
  const title = fm.title || filename.replace(/\.md$/, '');
  const bodyPreview = body.slice(0, 500);
  const newTags = autoTag(title, bodyPreview);

  fm.tags = newTags;

  if (!fm.description) {
    fm.description = title;
  }

  const newContent = buildFrontMatter(fm) + '\n' + body;

  if (newContent === original) {
    console.log(`=  无变化: ${filename}`);
    return { skipped: true };
  }

  const action = FORCE ? '🔄' : '✅';
  console.log(`${action} ${filename}`);
  console.log(`     标签: [${newTags.join(', ')}]`);

  if (!DRY_RUN) {
    fs.writeFileSync(filePath, newContent, 'utf8');
  }
  return { updated: true };
}

// ============ 入口 ============

if (!fs.existsSync(POSTS_DIR)) {
  console.error(`❌ 目录不存在: ${POSTS_DIR}`);
  process.exit(1);
}

console.log(`📚 找到目录: ${POSTS_DIR}`);
console.log(`⚙️  模式: ${FORCE ? '强制覆盖' : '仅补缺'}${DRY_RUN ? '（dry-run 不写入）' : ''}\n`);

const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));
console.log(`📄 共 ${files.length} 篇文章\n`);

let updated = 0;
let skipped = 0;

for (const f of files) {
  const result = processFile(path.join(POSTS_DIR, f));
  if (result.updated) updated++;
  else if (result.skipped) skipped++;
}

console.log(`\n📊 统计：更新 ${updated} / 跳过 ${skipped} / 共 ${files.length}`);
if (DRY_RUN) console.log('⚠️  dry-run 模式，未写入任何文件');
