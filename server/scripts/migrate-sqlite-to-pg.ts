#!/usr/bin/env tsx
/**
 * ============================================================
 *  migrate-sqlite-to-pg.ts — V3.8 SQLite → Postgres 数据迁移
 *
 *  用法:
 *    1. 服务器: npm i pg
 *    2. 阿里云 RDS 建 Postgres 实例,白名单加服务器 IP
 *    3. 写 /etc/feiman-letters.env:
 *         DB_TYPE=postgres
 *         DATABASE_URL=postgres://user:pass@host:5432/feiman_letters
 *    4. 跑这个脚本(tsx 跑 TS,直连两端)
 *       tsx scripts/migrate-sqlite-to-pg.ts
 *    5. 验证: psql -c "SELECT count(*) FROM letters"
 *    6. 切换: pm2 restart letters-server
 *
 *  注意:
 *    - 迁移期间老服务继续跑(读 SQLite),新写入会丢
 *    - 建议停服 → 跑迁移 → 改 env → 启服
 *    - 大表(>10w 行)需要分批
 * ============================================================
 */
import Database from 'better-sqlite3'
import { Client } from 'pg'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const SQLITE_PATH = process.env.SQLITE_PATH || '/var/lib/feiman-letters/letters.db'
const PG_URL = process.env.DATABASE_URL
if (!PG_URL) {
  console.error('❌ DATABASE_URL not set')
  process.exit(1)
}
if (!existsSync(SQLITE_PATH)) {
  console.error('❌ SQLite file not found: ' + SQLITE_PATH)
  process.exit(1)
}

const TABLES = [
  { name: 'users', pk: 'id', orderBy: 'created_at' },
  { name: 'letters', pk: 'id', orderBy: 'created_at' },
  { name: 'user_letter_actions', pk: 'id', orderBy: 'id' },
  { name: 'token_blacklist', pk: 'jti', orderBy: 'expires_at' },
  { name: 'verification_codes', pk: 'id', orderBy: 'created_at' },
]

const PG_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  nickname TEXT,
  phone TEXT UNIQUE,
  password_hash TEXT,
  wechat_openid TEXT UNIQUE,
  wechat_unionid TEXT,
  wechat_nickname TEXT,
  wechat_avatar TEXT,
  avatar_url TEXT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS letters (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  content TEXT NOT NULL,
  author_nickname TEXT,
  author_user_id TEXT,
  bg_key TEXT DEFAULT 'ivory',
  share_token TEXT UNIQUE NOT NULL,
  quoted_letter_id TEXT,
  collect_count INTEGER DEFAULT 0,
  star_count INTEGER DEFAULT 0,
  created_at BIGINT NOT NULL,
  FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS user_letter_actions (
  id INTEGER PRIMARY KEY,
  user_id TEXT NOT NULL,
  letter_id TEXT NOT NULL,
  is_starred INTEGER DEFAULT 0,
  is_collected INTEGER DEFAULT 0,
  created_at BIGINT NOT NULL,
  UNIQUE(user_id, letter_id)
);
CREATE TABLE IF NOT EXISTS token_blacklist (
  jti TEXT PRIMARY KEY,
  user_id TEXT,
  expires_at BIGINT NOT NULL,
  created_at BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS verification_codes (
  id SERIAL PRIMARY KEY,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'login',
  expires_at BIGINT NOT NULL,
  created_at BIGINT NOT NULL,
  consumed INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_verif_phone_purpose ON verification_codes(phone, purpose, created_at);
`

async function main() {
  console.log('📦 打开 SQLite:', SQLITE_PATH)
  const sqlite = new Database(SQLITE_PATH, { readonly: true })

  console.log('🐘 连接 Postgres:', PG_URL.replace(/:[^:@]+@/, ':***@'))
  const pg = new Client({ connectionString: PG_URL })
  await pg.connect()

  console.log('🛠  初始化 PG schema...')
  await pg.query(PG_SCHEMA_SQL)

  let totalInserted = 0
  for (const t of TABLES) {
    const count = (sqlite.prepare(`SELECT COUNT(*) as c FROM ${t.name}`).get() as { c: number }).c
    console.log(`\n📋 表 ${t.name}: ${count} 行`)
    if (count === 0) {
      console.log('  (空,跳过)')
      continue
    }

    const rows = sqlite.prepare(`SELECT * FROM ${t.name} ORDER BY ${t.orderBy} ASC`).all() as any[]
    let inserted = 0
    for (const row of rows) {
      const keys = Object.keys(row)
      const values = keys.map((k) => row[k])
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
      const sql = `INSERT INTO ${t.name} (${keys.join(', ')}) VALUES (${placeholders}) ON CONFLICT (${t.pk}) DO NOTHING`
      try {
        await pg.query(sql, values)
        inserted++
      } catch (err: any) {
        console.warn(`  ⚠️  跳过 ${t.name} ${t.pk}=${row[t.pk]}: ${err.message}`)
      }
    }
    totalInserted += inserted
    console.log(`  ✅ 插入 ${inserted}/${count}`)
  }

  console.log(`\n🎉 迁移完成,共 ${totalInserted} 行`)

  // 验证
  const users = (await pg.query('SELECT COUNT(*) as c FROM users')).rows[0].c
  const letters = (await pg.query('SELECT COUNT(*) as c FROM letters')).rows[0].c
  console.log(`\n📊 PG 校验: users=${users}, letters=${letters}`)

  sqlite.close()
  await pg.end()
  console.log('\n✅ 完成。下一步:')
  console.log('  1. /etc/feiman-letters.env 设 DB_TYPE=postgres')
  console.log('  2. pm2 restart letters-server')
  console.log('  3. curl https://47.99.101.168:8890/api/health 验证')
}

main().catch((err) => {
  console.error('❌ 迁移失败:', err)
  process.exit(1)
})
