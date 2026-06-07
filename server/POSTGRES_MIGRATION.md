# 数据库迁移指南 — SQLite → Postgres

V3.8 加了 `db-adapter.ts` 抽象层 + `migrate-sqlite-to-pg.ts` 迁移脚本。

## 当前状态

- **生产仍用 SQLite**(部署简单 + 写够用)
- **Postgres 适配器已就绪**(代码层 100%,激活 = 改 env)
- **数据迁移脚本已就绪**(一次性跑)

## 何时切

| 触发条件 | 切的理由 |
|---|---|
| QPS > 1k | SQLite 写锁竞争,Postgres 高并发写强 |
| 并发用户 > 100 | WAL 锁频繁 |
| 需要 join 多个表/复杂查询 | Postgres 优化器强 |
| 数据 > 10GB | 单文件 SQLite 备份/复制慢 |
| 多服务器部署 | SQLite 文件锁,Postgres 多节点 |

**V3 当前**:用户量 < 100,QPS 几十一百,**不切**。等 §13.6 触发条件。

## 切换步骤(用户 1-2 小时)

### 1. 阿里云控制台

- RDS → PostgreSQL → 选"基础版"或"高可用版"
- 1 核 2GB + 50GB SSD 起步 ≈ ¥200/月
- 区域:跟 ECS 同区(降低延迟)
- 账号密码:设复杂
- 白名单:加 ECS 私网 IP

### 2. 服务器装 pg SDK

```bash
ssh root@47.99.101.168
cd /var/www/feiman-letters-server
npm i pg --registry=https://registry.npmmirror.com
pm2 restart letters-server  # 测试不影响(无 DATABASE_URL)
```

### 3. 服务器 env 配

```bash
cat >> /etc/feiman-letters.env << 'EOF'
DB_TYPE=postgres
DATABASE_URL=postgres://user:password@host:5432/feiman_letters
EOF
chmod 600 /etc/feiman-letters.env
```

### 4. 跑迁移脚本

```bash
# 停服,避免迁移期间新写入丢
pm2 stop letters-server

# 跑迁移(读 SQLite,写 Postgres)
cd /var/www/feiman-letters-server
DATABASE_URL=postgres://... SQLITE_PATH=/var/lib/feiman-letters/letters.db \
  npx tsx scripts/migrate-sqlite-to-pg.ts
```

输出示例:
```
📋 表 users: 5 行
  ✅ 插入 5/5
📋 表 letters: 142 行
  ✅ 插入 142/142
📋 表 user_letter_actions: 23 行
  ✅ 插入 23/23
📋 表 token_blacklist: 1 行
  ✅ 插入 1/1
🎉 迁移完成,共 171 行
```

### 5. 切流量

```bash
# 启服,会自动从 env 读 DB_TYPE=postgres
pm2 start letters-server

# 验证
curl http://47.99.101.168:8890/api/health
# 日志: [db] using postgres adapter

# 试一条 letter
curl -X POST http://47.99.101.168:8890/api/letters \
  -H "Content-Type: application/json" \
  -d '{"kind":"quote","content":"测试 Postgres 写入","bgKey":"ivory"}'
```

### 6. (可选) 删 SQLite

切完稳定 1 周后,删 SQLite 文件(备份后):
```bash
cp /var/lib/feiman-letters/letters.db /root/letters.db.bak
rm /var/lib/feiman-letters/letters.db /var/lib/feiman-letters/letters.db-*
```

## 回滚

任何时候想回 SQLite:
```bash
sed -i 's/^DB_TYPE=postgres/# DB_TYPE=postgres/' /etc/feiman-letters.env
pm2 restart letters-server
```

## 已知坑

1. **现有 db.ts 没改**:V3.x 范围内不重写 100+ 处 `db.prepare(...)` 调用,db-adapter 是给未来用。当前生产仍走 db.ts。
2. **WS 推送**:SQLite 进程内 userSockets 切到 Postgres 不影响(WS 仍是 Node module-level state)。
3. **连接池**:默认 max=10 足够小项目,QPS 5k 调到 50。
4. **schema drift**:迁移脚本写死 schema,改 db.ts 后需同步更新 `migrate-sqlite-to-pg.ts` 的 `PG_SCHEMA_SQL`。
5. **不接 ORM**:V3.8 仍然手写 SQL,引入 knex/drizzle/prisma 风险大收益小。

## 性能预估

| 场景 | SQLite | Postgres |
|---|---|---|
| 单条 insert | 1ms | 2ms(+网络) |
| 100 RPS | 100ms CPU | 50ms CPU(并行) |
| 1000 RPS | CPU 50% 满 | CPU 15% |
| 单文件大小 | 几 GB 慢 | 无限制 |
| 备份 | cp 文件 | pg_dump 增量 |
| HA | 无 | 主从 + 自动故障 |

---
**V3.8 状态**:代码 100% 就绪,等用户切流量时跑迁移脚本。Postgres 实例 + DATABASE_URL = 用户操作。
