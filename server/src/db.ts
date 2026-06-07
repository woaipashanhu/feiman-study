/**
 * 费曼 V3 — 小纸条后端数据库
 *
 * 技术栈: better-sqlite3 (同步,无 callback,零配置,本地文件)
 * 路径:  /var/lib/feiman-letters/letters.db (生产)
 *         ./data/letters.db (开发)
 *
 * 表设计 (V2.5+ 加 users):
 *   users
 *     - id            TEXT PK (usr_xxx 格式)
 *     - email         TEXT 唯一
 *     - phone         TEXT 唯一(可选)
 *     - password_hash TEXT  bcrypt
 *     - nickname      TEXT  显示名
 *     - created_at    INT   timestamp
 *     - updated_at    INT   timestamp
 *
 *   letters
 *     - id            TEXT PK (lt_xxx 格式)
 *     - content       TEXT  原文
 *     - author        TEXT  写信人(显示用)
 *     - author_user_id TEXT 关联 users.id(可选,登录用户才有)
 *     - bg_key        TEXT  信纸底色
 *     - translations  TEXT  JSON
 *     - share_token   TEXT  唯一分享 token
 *     - collect_count INT
 *     - view_count    INT
 *     - created_at    INT
 *     - updated_at    INT
 *
 *   user_letter_actions (V3 加,记录登录用户对纸条的收藏/已读)
 *     - id            INTEGER PK auto
 *     - user_id       TEXT 关联 users.id
 *     - letter_id     TEXT 关联 letters.id
 *     - is_starred    INT  0/1
 *     - is_read       INT  0/1
 *     - created_at    INT
 *     - updated_at    INT
 *     - UNIQUE(user_id, letter_id)
 */
import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const DB_PATH = process.env.DB_PATH || resolve('./data/letters.db')

// 确保目录存在
mkdirSync(dirname(DB_PATH), { recursive: true })

export const db = new Database(DB_PATH)

// 启用 WAL 模式
db.pragma('journal_mode = WAL')
db.pragma('synchronous = NORMAL')
db.pragma('foreign_keys = ON')

// =============== Migration ===============
// V3 增量: 给老库加 author_user_id 列 + 新表(users / user_letter_actions)
// 幂等: 不存在才加

function safeExec(sql: string) {
  try { db.exec(sql) } catch (e) { /* 列已存在,忽略 */ }
}

function hasColumn(table: string, col: string): boolean {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]
  return rows.some((r) => r.name === col)
}

function hasTable(table: string): boolean {
  const rows = db.prepare(
    `SELECT name FROM sqlite_master WHERE type='table' AND name=?`
  ).all(table) as { name: string }[]
  return rows.length > 0
}

// V3.6 加: token_blacklist 表(token 登出后失效)
if (!hasTable("token_blacklist")) {
  safeExec(`CREATE TABLE token_blacklist (
    jti TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`)
  safeExec(`CREATE INDEX IF NOT EXISTS idx_blacklist_expires ON token_blacklist(expires_at)`)
}

// V3.5 加: users.avatar_url
if (hasTable("users") && !hasColumn("users", "avatar_url")) {
  safeExec("ALTER TABLE users ADD COLUMN avatar_url TEXT")
}

// V3 加: letters.author_user_id
if (hasTable('letters') && !hasColumn('letters', 'author_user_id')) {
  safeExec(`ALTER TABLE letters ADD COLUMN author_user_id TEXT REFERENCES users(id) ON DELETE SET NULL`)
  safeExec(`CREATE INDEX IF NOT EXISTS idx_letters_author_user ON letters(author_user_id)`)
}

// =============== Schema ===============

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    email         TEXT UNIQUE,
    phone         TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    nickname      TEXT NOT NULL,
    avatar_url    TEXT,
    created_at    INTEGER NOT NULL,
    updated_at    INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

  CREATE TABLE IF NOT EXISTS letters (
    id              TEXT PRIMARY KEY,
    content         TEXT NOT NULL,
    author          TEXT,
    author_user_id  TEXT,
    bg_key          TEXT NOT NULL DEFAULT 'ivory',
    translations    TEXT,
    share_token     TEXT NOT NULL UNIQUE,
    collect_count   INTEGER NOT NULL DEFAULT 0,
    view_count      INTEGER NOT NULL DEFAULT 0,
    created_at      INTEGER NOT NULL,
    updated_at      INTEGER NOT NULL,
    FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_letters_created_at ON letters(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_letters_share_token ON letters(share_token);
  CREATE INDEX IF NOT EXISTS idx_letters_author_user ON letters(author_user_id);

  CREATE TABLE IF NOT EXISTS token_blacklist (
    jti         TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    expires_at  INTEGER NOT NULL,
    created_at  INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_blacklist_expires ON token_blacklist(expires_at);

  CREATE TABLE IF NOT EXISTS user_letter_actions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     TEXT NOT NULL,
    letter_id   TEXT NOT NULL,
    is_starred  INTEGER NOT NULL DEFAULT 0,
    is_read     INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL,
    UNIQUE(user_id, letter_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (letter_id) REFERENCES letters(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_actions_user ON user_letter_actions(user_id);
  CREATE INDEX IF NOT EXISTS idx_actions_letter ON user_letter_actions(letter_id);
`)

// =============== 类型 ===============

export interface UserRow {
  id: string
  email: string | null
  phone: string | null
  password_hash: string
  nickname: string
  avatar_url: string | null
  created_at: number
  updated_at: number
}

export interface User {
  id: string
  email: string | null
  phone: string | null
  nickname: string
  avatarUrl: string | null
  createdAt: number
  updatedAt: number
}

export interface LetterRow {
  id: string
  content: string
  author: string | null
  author_user_id: string | null
  bg_key: string
  translations: string | null
  share_token: string
  collect_count: number
  view_count: number
  created_at: number
  updated_at: number
}

export interface Letter {
  id: string
  content: string
  author: string | null
  authorUserId: string | null
  bgKey: string
  translations: { classicalChinese?: string; english?: string } | null
  shareToken: string
  collectCount: number
  viewCount: number
  createdAt: number
  updatedAt: number
}

/** row → API DTO(剥离 password_hash) */
export function rowToUser(r: UserRow): User {
  return {
    id: r.id,
    email: r.email,
    phone: r.phone,
    nickname: r.nickname,
    avatarUrl: r.avatar_url,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

/** row → API DTO */
export function rowToLetter(r: LetterRow): Letter {
  return {
    id: r.id,
    content: r.content,
    author: r.author,
    authorUserId: r.author_user_id,
    bgKey: r.bg_key,
    translations: r.translations ? JSON.parse(r.translations) : null,
    shareToken: r.share_token,
    collectCount: r.collect_count,
    viewCount: r.view_count,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}
