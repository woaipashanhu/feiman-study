/**
 * 费曼 V3 — 小纸条后端数据库
 *
 * 技术栈: better-sqlite3 (同步,无 callback,零配置,本地文件)
 * 路径:  /var/lib/feiman-letters/letters.db (生产)
 *         ./data/letters.db (开发)
 *
 * 表设计 (V1 无登录,只做匿名分享 + 公开浏览):
 *   letters
 *     - id           TEXT  PK  (lt_xxx 格式)
 *     - content      TEXT  原文
 *     - author       TEXT  写信人(可选,匿名)
 *     - bg_key       TEXT  信纸底色
 *     - translations TEXT  JSON ({classicalChinese?, english?})
 *     - share_token  TEXT  唯一分享 token (sl_xxx)
 *     - collect_count INT  被收藏次数(V1 全局计数)
 *     - view_count   INT  被查看次数
 *     - created_at   INT  timestamp
 *     - updated_at   INT  timestamp
 *
 * V2 加 users / letter_recipients:
 *   users(id, phone?, email?, password_hash, nickname, created_at)
 *   letter_recipients(id, letter_id, user_id, read_at, is_starred)
 *   letter_replies(id, parent_id, from_user_id, content, ...)
 */
import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const DB_PATH = process.env.DB_PATH || resolve('./data/letters.db')

// 确保目录存在
mkdirSync(dirname(DB_PATH), { recursive: true })

export const db = new Database(DB_PATH)

// 启用 WAL 模式(性能 + 并发读)
db.pragma('journal_mode = WAL')
db.pragma('synchronous = NORMAL')
db.pragma('foreign_keys = ON')

// =============== Schema ===============

db.exec(`
  CREATE TABLE IF NOT EXISTS letters (
    id            TEXT PRIMARY KEY,
    content       TEXT NOT NULL,
    author        TEXT,
    bg_key        TEXT NOT NULL DEFAULT 'ivory',
    translations  TEXT,  -- JSON
    share_token   TEXT NOT NULL UNIQUE,
    collect_count INTEGER NOT NULL DEFAULT 0,
    view_count    INTEGER NOT NULL DEFAULT 0,
    created_at    INTEGER NOT NULL,
    updated_at    INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_letters_created_at ON letters(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_letters_share_token ON letters(share_token);
`)

// =============== 类型 ===============

export interface LetterRow {
  id: string
  content: string
  author: string | null
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
  bgKey: string
  translations: { classicalChinese?: string; english?: string } | null
  shareToken: string
  collectCount: number
  viewCount: number
  createdAt: number
  updatedAt: number
}

/** row → API DTO */
export function rowToLetter(r: LetterRow): Letter {
  return {
    id: r.id,
    content: r.content,
    author: r.author,
    bgKey: r.bg_key,
    translations: r.translations ? JSON.parse(r.translations) : null,
    shareToken: r.share_token,
    collectCount: r.collect_count,
    viewCount: r.view_count,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}
