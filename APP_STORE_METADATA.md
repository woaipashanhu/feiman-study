# App Store 上架文案 — 小纸条 V3.8

## App Store (Apple)

### App 信息

| 字段 | 值 |
|---|---|
| App Name | 小纸条 - 一封写给你的信 |
| Subtitle | 一封写给你的温暖信 |
| Category | Lifestyle (生活方式) 或 Social Networking |
| Content Rating | 4+ |
| Price | 免费 (Free) |
| Languages | 中文(简体)、English |

### 描述 (Description)

```
小纸条是一个温暖的角落,收下每封写给你的信。

「现在这个时代,大家都在发消息,但很少有人写信。」
小纸条想做的,就是让你写一封"不是群发的"信。
可以匿名,可以署名,可以引用,可以把信变成一张长图分享给朋友。

核心功能:
- 写信: 支持匿名 / 署名,可引用别人的信,可分享到社交网络
- AI 润色 / 改写 / 翻译: 文字不顺?一键让 AI 帮你打磨
- 信纸底色: 象牙白 / 午夜蓝 / 牛皮纸,三种氛围切换
- 收信: 每个人有专属的"收件箱",他人写的信自动送进来
- 收藏: 把喜欢的信收藏到"时空纸条",永远不丢
- 跨端: 网页 / iOS / Android / PWA(桌面),数据自动同步

面向用户:
- 想给朋友写一封走心信,但又怕被截图群发的人
- 想找地方写下不轻易展示的情绪、想法、灵感
- 想收到陌生人的善意(匿名信)
- 想用文字记录生活,像写日记但更轻

小纸条不卖广告、不卖数据、不卖你的信。
所有信件都只属于写信人和收信人。
```

### 关键词 (Keywords)

```
信,写信,匿名信,小纸条,情书,日记,AI 写作,长图分享,温暖,慢社交
letter, anonymous, AI writing, journaling, slow social, mindful
```

### Promotional Text (推广文案 170 字符内)

```
小纸条 1.0 上线:写信不再群发。
写一封只属于某个人的信,匿名或署名都行,还能用 AI 帮你打磨文字。
```

### Release Notes (V1.0 首发说明)

```
🎉 小纸条首发上线!

写第一封信吧。
```

### What's New (V1.1 / V1.2 更新)

```
🎉 V1.1
- 手机号验证码登录(支持阿里云短信)
- 微信一键登录
- 多语言切换(中/英)

📦 V1.0
- 写信 / 收信 / 收藏 / 分享长图
- AI 润色 / 改写 / 翻译
- 三种信纸底色
- PWA + iOS + Android 三端
```

### 隐私政策 (Privacy Policy URL)

需要在网页上写一个 `/privacy` 页面,内容:
- 我们收集什么:邮箱/手机号(用于登录)、头像(可选)、信内容
- 我们不收集什么:浏览历史、IP 位置、设备指纹
- 第三方 SDK:阿里云 OSS(头像/插图存储)、阿里云短信(验证码)、Sentry(错误监控)
- 你的权利:导出数据、删除账号(写信 /auth → 申请)
- 联系方式:邮件

### 截图需求 (App Store 必填)

iPhone 6.7" 显示屏(1290×2796):至少 3 张,推荐 5-8 张
iPhone 6.5" 显示屏(1242×2688):至少 3 张
iPad Pro 12.9"(2048×2732):至少 3 张(可选,V1 不强求)

**截图主题建议**:
1. 主页(今日一封 + 三种信纸)
2. 写信页(AI 润色)
3. 收件箱(收到的信)
4. 信详情(长图分享)
5. 个人中心
6. 注册页(中英文版)
7. 暗色模式(若有)

**截图工具**:
```bash
# Puppeteer 自动截图(已有)
node scripts/screenshot-letters.mjs
node scripts/screenshot-paper.mjs
# 新增:
node scripts/screenshot-appstore.mjs   # 待写
```

---

## Google Play

### App 信息

| 字段 | 值 |
|---|---|
| App Name | 小纸条 - Letters |
| Short Description | A warm corner for letters — anonymous or signed |
| Full Description | (与 App Store 描述相同,英文为主) |
| Category | Lifestyle |
| Content Rating | Everyone |
| Price | Free |

### Short Description (80 字符内)

```
Letters: anonymous, signed, AI-polished. A warm corner for words that matter.
```

### Full Description

```
(见上方 App Store 描述,英文版)
```

### Graphic Assets

- App icon: 512x512 PNG
- Feature graphic: 1024x500 PNG
- Phone screenshots: 至少 4 张(320-3840px 宽,16:9 或 9:16)
- 7-inch tablet screenshots: 至少 1 张(可选)
- 10-inch tablet screenshots: 至少 1 张(可选)

### Privacy

需要在 Google Play Console 填 Data safety 表单:
- 账号信息:邮箱/手机号(必选)
- 用户内容:信内容 + 头像(必选)
- 应用活动:使用 AI 处理(可选,Sentry 监控错误)
- 共享:不与第三方共享

---

## 通用

### App Icon (已生成)

✅ `ios/App/App/Assets.xcassets/AppIcon.appiconset/icon-1024.png`(1024×1024)
✅ `android/app/src/main/res/mipmap-*/ic_launcher.png`(5 套密度)
✅ `public/icons/icon-192.png` + `icon-512.png` + `icon-maskable-512.png`

### 启动图 (Splash)

✅ `ios/App/App/Assets.xcassets/Splash.imageset/Default@1x|2x|3x.png`
✅ `android/app/src/main/res/drawable-*/splash.png`(Capacitor 默认)

### App Privacy URL

需要建一个公开网页:https://47.99.101.168:8890/privacy
简化版(下面"隐私政策"内容),英文 + 中文双语

### Terms of Service URL

https://47.99.101.168:8890/terms
简化版(服务条款)英文 + 中文双语

### Support URL

https://47.99.101.168:8890/support
或邮件:support@feiman.letters(注册一个企业邮箱)

---

## 上架时间表估算

| 步骤 | 估时 | 备注 |
|---|---|---|
| 写隐私政策 / 服务条款 网页 | 1-2 小时 | 模板写 |
| 申请 Apple Developer 账号 | 1-2 天审核 | $99/年 |
| 申请 Google Play 账号 | 1 天 | $25 一次性 |
| Xcode Archive + 上传 App Store Connect | 1 小时 | 需 macOS |
| 填 App Store 元数据 | 2-3 小时 | 含截图 |
| 提交审核(Apple) | 1-3 天 | |
| 上传 Google Play | 1 小时 | 内部测试先 |
| 准备 6.7"/6.5" 设备截图 | 1-2 小时 | 跑 Puppeteer + 真机 |

**总: 1-2 周** 完成首次上架,主要瓶颈是 Apple Developer 审核。

---

## 营销卖点(社交媒体 / 视频脚本)

### 1 句话版本

"写一封只属于某人的信,小纸条让你认真说一次话。"

### 30 秒视频脚本

[画面:打字机声音 + 黑屏]
旁白:"你有没有想对某个人说,但是一直没说的话?"
[画面:小纸条写信页,文字从无到有]
"也许是一句道歉,一句好久不见,或者只是谢谢。"
[画面:长图生成,右上角"分享"按钮]
"小纸条,让这些重要的话,只给那一个人看。"
[画面:收件箱里有信]
[品牌 LOGO + "下载小纸条"]

### 关键文案

- 「小纸条,认真说话的地方。」
- 「发消息太随便,打电话太正式,小纸条刚刚好。」
- 「写一封信给未来的自己,或者给现在最想见到的人。」
- 「这里没有点赞,只有珍藏。」
- 「每一封信都是独一份的,不是群发的。」
- 「AI 帮你润色,文字不再卡壳。」

---

**Status**: 文案就绪,等用户:
1. 注册 Apple Developer + Google Play
2. 写隐私政策 / 服务条款 网页
3. 跑 Puppeteer 截图
4. 填表提交(我协助)
