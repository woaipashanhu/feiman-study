/**
 * ============================================================
 *  db-adapter.ts — V3.8 数据库适配器抽象
 *
 *  目标:
 *    1. 统一接口: query(sql, params) / exec(sql) / close()
 *    2. 多实现: SqliteAdapter(默认, better-sqlite3) + PostgresAdapter(pg)
 *    3. 占位配置自动用 Sqlite,不影响开发
 *    4. 切到 Postgres 步骤:
 *       a) 服务器装 pg + npm i pg
 *       b) 阿里云 RDS 建 Postgres 实例,拿 connectionString
 *       c) /etc/feiman-letters.env 加:
 *            DB_TYPE=postgres
 *            DATABASE_URL=postgres://user:pass@host:5432/feiman_letters
 *       d) 跑迁移脚本(从 SQLite 导数据到 Postgres)— 见 migrate-sqlite-to-pg.ts
 *       e) pm2 restart letters-server
 *
 *  不做的事(V3.x 范围):
 *    - 不替换现有 db.ts 的 db.prepare / db.exec 调用(避免改 100+ 处)
 *    - 不做 schema 双向同步(只单向导数据)
 *    - 不接 connection pool tuning(默认够用)
 *
 *  重新启用条件:
 *    - QPS > 1k
 *    - SQLite 出现 WAL 锁竞争
 *    - 需要并发写
 * ============================================================
 */
import Database from 'better-sqlite3'
import { dirname, resolve } from 'node:path'
import { mkdirSync, existsSync } from 'node:fs'

// =============== 抽象接口 ===============

export interface QueryResult<T = any> {
  rows: T[]
  rowCount: number
  /** 插入时返回的 ID(SQLite: lastInsertRowid, Postgres: RETURNING id) */
  lastInsertId?: number | string
}

export interface DbAdapter {
  name: 'sqlite' | 'postgres'
  /** 简单查询,返回多行 */
  query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>
  /** 执行 INSERT/UPDATE/DELETE,返回 lastInsertId + affected rows */
  exec(sql: string, params?: any[]): Promise<{ lastInsertId?: number | string; affected: number }>
  /** 事务(传 fn,内部用 BEGIN/COMMIT) */
  transaction<T>(fn: () => Promise<T>): Promise<T>
  /** 关闭 */
  close(): void
}

// =============== SQLite Adapter ===============

class SqliteAdapter implements DbAdapter {
  name = 'sqlite' as const
  private db: Database.Database

  constructor(dbPath: string) {
    mkdirSync(dirname(dbPath), { recursive: true })
    this.db = new Database(dbPath)
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('foreign_keys = ON')
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    // 转换 ? 占位符(SQLite 原生支持)
    const stmt = this.db.prepare(sql)
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      const rows = stmt.all(...params) as T[]
      return { rows, rowCount: rows.length }
    }
    // INSERT/UPDATE/DELETE 走 exec
    const info = stmt.run(...params)
    return {
      rows: [],
      rowCount: info.changes,
      lastInsertId: info.lastInsertRowid as number,
    }
  }

  async exec(sql: string, params: any[] = []): Promise<{ lastInsertId?: number | string; affected: number }> {
    const stmt = this.db.prepare(sql)
    const info = stmt.run(...params)
    return { lastInsertId: info.lastInsertRowid as number, affected: info.changes }
  }

  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    // SQLite 是同步, BEGIN + 提交
    this.db.exec('BEGIN')
    try {
      const result = await fn()
      this.db.exec('COMMIT')
      return result
    } catch (err) {
      this.db.exec('ROLLBACK')
      throw err
    }
  }

  close() {
    this.db.close()
  }
}

// =============== Postgres Adapter ===============

class PostgresAdapter implements DbAdapter {
  name = 'postgres' as const
  private pool: any  // pg.Pool,避免引 type

  constructor(connectionString: string) {
    // 动态 import,默认不装 pg 也能跑
    // 用户切到 Postgres 时: npm i pg + 提供 connectionString
    let pg: any
    try {
      pg = require('pg')
    } catch {
      throw new Error('pg package not installed. Run: npm i pg')
    }
    this.pool = new pg.Pool({ connectionString, max: 10 })
  }

  /** 把 ? 占位符转 $1 $2 $3(Pg 风格) */
  private pgSql(sql: string): string {
    let i = 0
    return sql.replace(/\?/g, () => `$${++i}`)
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    const pgSql = this.pgSql(sql)
    const result = await this.pool.query(pgSql, params)
    return {
      rows: result.rows as T[],
      rowCount: result.rowCount || result.rows.length,
      // lastInsertId 需用 RETURNING id 显式拿
    }
  }

  async exec(sql: string, params: any[] = []): Promise<{ lastInsertId?: number | string; affected: number }> {
    const pgSql = this.pgSql(sql)
    const result = await this.pool.query(pgSql, params)
    return { affected: result.rowCount || 0 }
  }

  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      const result = await fn()
      await client.query('COMMIT')
      return result
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  close() {
    this.pool.end()
  }
}

// =============== 工厂 ===============

let _adapter: DbAdapter | null = null

export function getDbAdapter(): DbAdapter {
  if (_adapter) return _adapter

  const dbType = (process.env.DB_TYPE || 'sqlite').toLowerCase()
  if (dbType === 'postgres') {
    const url = process.env.DATABASE_URL
    if (!url) {
      console.warn('[db] DB_TYPE=postgres but DATABASE_URL not set, fallback to sqlite')
    } else {
      try {
        _adapter = new PostgresAdapter(url)
        console.log('[db] using postgres adapter')
        return _adapter
      } catch (err: any) {
        console.warn('[db] postgres init failed:', err.message, '- fallback to sqlite')
      }
    }
  }
  const sqlitePath = process.env.DB_PATH || resolve('./data/letters.db')
  _adapter = new SqliteAdapter(sqlitePath)
  console.log(`[db] using sqlite adapter at ${sqlitePath}`)
  return _adapter
}

/** 兼容旧 db.ts 的 helper:直接暴露 query */
export const db_ = {
  query: <T = any>(sql: string, params?: any[]) => getDbAdapter().query<T>(sql, params),
  exec: (sql: string, params?: any[]) => getDbAdapter().exec(sql, params),
}
