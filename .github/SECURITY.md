# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| V3.8+   | :white_check_mark: |
| V3.5-V3.7 | :white_check_mark: (security patches only) |
| < V3.5  | :x:                |

## Reporting a Vulnerability

我们重视安全问题。如发现漏洞,请**私下**报告:

📧 **Email**: security@feiman.letters
⏰ **响应时间**: 48 小时内确认,7 天内修复
🔐 **PGP 加密**: 公开 key 见 [security.asc](./security.asc)(待提供)

### 请在报告中包含:

1. 漏洞描述(一句话)
2. 复现步骤(详细)
3. 影响范围(哪些用户/数据受影响)
4. 你的联系信息(可选,匿名报告也接受)
5. 是否已公开披露

### 我们承诺:

- 48 小时内首次响应
- 7 天内修复高危 / 30 天内修复中危
- 修复前不公开漏洞细节
- 修复后给报告者致谢(如果你愿意)
- 不会因为善意报告而采取法律行动

## Out of Scope

- 自我 XSS(用户主动粘贴恶意代码)
- 拒绝服务攻击(请私下报告,我们有 rate limit)
- 第三方 SDK 自身的漏洞(请同时报告给对应厂商)
- 物理访问攻击
- 已发布 < V3.5 的旧版本

## Security Headers

V3.8+ 通过 helmet 自动添加:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Strict-Transport-Security: max-age=15552000; includeSubDomains`
- `X-XSS-Protection: 0`
- `Referrer-Policy: no-referrer`

## 凭据管理

- **生产密钥**: 服务器 `/etc/feiman-letters.env` (chmod 600, root only)
- **本地开发**: `/.env.local` (gitignored)
- **V3 已知问题**: LongCat API key 曾在对话中明文发出(已 rotate)
- **正式上线前必做**: 全 key rotate + SSH 改密钥 + 关密码登录(见 §13.9)

## Acknowledgments

感谢以下贡献者(报告安全问题):

_(待添加)_

---

Last updated: 2026-06-07
