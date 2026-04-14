# RSS 聚合工具

![:name](https://count.getloli.com/@rss-aggregator?name=rss-aggregator&theme=minecraft&padding=6&offset=0&align=top&scale=1&pixelated=1&darkmode=auto)

[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Serverless-000000?logo=vercel&logoColor=white)](https://vercel.com/)

将多条 RSS/Atom 订阅源聚合为一条，支持 Cloudflare Workers 与 Vercel 一键部署。

## 🚀 一键部署

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/yuwanyuan/rss-aggregator)　[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/yuwanyuan/rss-aggregator)

> **Vercel**：点击按钮 → 登录 → 自动 Fork 并部署，根路径即 API 入口。
> **Cloudflare Workers**：点击按钮 → 登录 → 自动 Fork 并部署到 CF Workers。

## ✨ 功能特性

- 🖥 **Web UI** — 访问根路径即可视化操作，填写 Feed 地址、参数，一键生成聚合链接或预览结果
- 💾 **配置持久化** — Feed 地址和参数自动保存到浏览器 localStorage，下次打开自动恢复
- ⚙️ **环境变量预设** — 通过 `DEFAULT_FEEDS` 配置默认订阅源，无参数时自动聚合
- 🔀 **多源聚合** — 一次性聚合多条 RSS/Atom feed，按更新时间倒序排列
- 📄 **双格式输出** — 支持 RSS 2.0 XML 或 JSON 格式
- ⚡ **零依赖** — 纯 Runtime 原生 API，无需任何 npm 包
- 🚀 **双平台部署** — Cloudflare Workers / Vercel Serverless 一键部署

## 📖 使用方法

### API 参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `urls` | 多条 feed 地址，英文逗号分隔 | — |
| `url` | 可重复参数（`&url=A&url=B`） | — |
| `days` | 最近 N 天内的文章 | `3` |
| `limit` | 返回条数上限 | `100` |
| `format` | `rss` 或 `json` | `rss` |

### 示例

```bash
# 聚合两个 feed，输出 RSS
https://你的域名/api?urls=https://feeds.feedburner.com/TechCrunch,https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml&days=3&limit=20

# 输出 JSON
https://你的域名/api?urls=https://hnrss.org/frontpage&days=7&format=json

# 使用 url 可重复参数
https://你的域名/api?url=https://hnrss.org/frontpage&url=https://feeds.feedburner.com/TechCrunch&days=2
```

## 🔧 环境变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `DEFAULT_FEEDS` | 预设默认 feeds（逗号分隔），无 `urls` 参数时自动聚合 | `https://hnrss.org/frontpage,https://feeds.feedburner.com/TechCrunch` |

### Cloudflare Workers 配置

在 `wrangler.toml` 中添加：

```toml
[vars]
DEFAULT_FEEDS = "https://hnrss.org/frontpage,https://feeds.feedburner.com/TechCrunch"
```

或在 CF Dashboard → Workers → Settings → Variables 中配置。

### Vercel 配置

在 Vercel Dashboard → Settings → Environment Variables 中添加 `DEFAULT_FEEDS`。

## 🏗 手动部署

### Cloudflare Workers

```bash
npm i -g wrangler
wrangler login
wrangler deploy
```

### Vercel

```bash
npm i -g vercel
vercel --prod
```

## 📁 项目结构

```
├── api/
│   └── index.js        # Vercel Serverless Function 入口
├── src/
│   ├── shared.js       # 核心逻辑（抓取/解析/聚合/输出）
│   ├── cf-worker.js    # Cloudflare Workers 入口
│   └── ui.js           # Web UI HTML
├── vercel.json         # Vercel 路由配置
├── wrangler.toml       # CF Workers 配置
└── package.json
```

## 🔍 实现原理

1. **参数解析** — 从 URL query string 提取 `urls`/`days`/`limit`/`format`，无 `urls` 时读环境变量 `DEFAULT_FEEDS`
2. **并发抓取** — `Promise.allSettled` 并发 fetch 所有 feed，10 秒超时，单条失败不影响其他
3. **XML 解析** — 正则匹配 `<item>`/`<entry>`（兼容 RSS 2.0 和 Atom），处理 CDATA、HTML 实体
4. **过滤排序** — 按时间窗口过滤，`timestamp` 降序排列，`slice` 截断
5. **输出** — `format=rss` 拼接 RSS 2.0 XML，`format=json` 返回结构化 JSON，缓存 5 分钟
6. **平台适配** — CF Workers 和 Vercel 各一个薄适配层，核心逻辑在 `shared.js` 复用

## ⚠️ 注意事项

- 聚合结果受源站可用性影响，单条 feed 失败不会影响其他源
- 参数约束：`days` 1~365，`limit` 1~500，最多支持 20 条 feed
- API 响应缓存 5 分钟（`cache-control: max-age=300`）
- feed 地址中的查询参数建议先做 URL 编码

## 📄 许可证

[MIT](LICENSE)

---

> 🤖 本项目由 AI 辅助创建
