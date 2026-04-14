# RSS 聚合工具（Cloudflare Workers / Vercel）

## 一键部署

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/yuwanyuan/rss-aggregator)　[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/yuwanyuan/rss-aggregator)

> **Vercel**：点击按钮 → 登录 → 自动 Fork 并部署，根路径即 API 入口。  
> **Cloudflare Workers**：点击按钮 → 登录 → 自动 Fork 并部署到 CF Workers。

## 功能

- 🖥 **Web UI**：访问根路径即可使用可视化界面，填写 Feed 地址、参数，一键生成聚合链接或预览结果
- 💾 **配置持久化**：UI 中的 Feed 地址和参数自动保存到浏览器 localStorage，下次打开自动恢复
- ⚙️ **环境变量预设**：通过 `DEFAULT_FEEDS` 环境变量配置默认订阅源，无参数时自动聚合
- 一次性聚合多条 RSS/Atom feed，多天内文章按时间更新时间倒序排序
- 可输出为 RSS 2.0 XML 或 JSON
- 支持参数：
  - `urls`: 多条 feed 地址，英文逗号分隔（示例：`https://.../feed`）
  - `url`: 可重复参数（示例：`&url=https://a.com&url=https://b.com`）
  - `days`: 最近 N 天内，默认 `3`
  - `limit`: 返回条数上限，默认 `100`
  - `format`: `rss`（默认）或 `json`

## 环境与部署

### 1. Cloudflare Workers

#### 必需文件
- `src/cf-worker.js`
- `src/shared.js`

#### 部署步骤
1. `wrangler.toml`（可选）
   ```toml
   name = "rss-aggregator"
   main = "src/cf-worker.js"
   compatibility_date = "2026-01-01"
   ```
2. 安装 wrangler 并登录：
   ```bash
   npm i -g wrangler
   wrangler login
   wrangler deploy
   ```

### 2. Vercel

#### 必需文件
- `api/index.js`
- `src/shared.js`
- `vercel.json`

#### 部署步骤
1. 在根目录执行 `vercel` 完成初始化。
2. 选择项目后，`framework` 选择 **Other**。
3. 确认 `api/index.js` 会被识别为 Function（或在 `vercel.json` 中显式指定）。
4. 生产环境部署：
   ```bash
   npm install -g vercel
   npm run deploy:vercel
   ```

## 使用示例

```bash
# 聚合两个 feed，输出 RSS（注意：feed 地址中的查询参数要先 encode）
https://你的域名/api?url=https://feeds.feedburner.com/TechCrunch%3Fformat%3Drss&url=https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml&days=3&limit=20

# 输出 JSON
https://你的域名/api?urls=https://feeds.feedburner.com/TechCrunch%3Fformat%3Drss&days=7&format=json

# 使用 urls 一次性传入多个（英文逗号分隔，尽量对含查询符号的链接做 URL 编码）
https://你的域名/api?urls=https://feeds.feedburner.com/TechCrunch%3Fformat%3Drss,https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml&days=2&format=rss

```


## 本地运行
- 安装依赖：`npm install`
- 启动本地开发（Vercel）：`vercel dev`

## GitHub 直接推送（推荐）

如果你要直接把当前版本同步到 GitHub，可按下面执行（Windows PowerShell）：

```bash
# 1) 进入仓库目录
cd C:\Users\yuwanyuan\WorkBuddy\20260414161726

# 2) 初始化（如果这个目录还不是 git 仓库）
git init
git add .
git commit -m "feat: add RSS aggregator for CF/Vercel"

# 3) 绑定远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/<你的用户名>/<你的仓库>.git
git branch -M main

git push -u origin main
```

如果是已存在仓库（有 remote）

```bash
git add .
git commit -m "chore: update RSS aggregator"
git push
```

如果你的默认分支是 master，把 `main` 改成 `master`。

### 常见失败与处理
- `fatal: not a git repository`：当前目录还没 init，先执行 `git init`。
- `failed to push some refs`：先执行 `git pull --rebase origin main` 再 push。
- 无法访问 GitHub：确认 `git` 已安装、能访问网络，或用 HTTPS Token/SSH 方式重新认证。

## 注意事项
- 为了避免 CORS/跨域问题，通常通过服务端直接读取，前端直接展示该接口返回即可。
- `limit`、`days`、`format` 采用服务端参数约束，默认安全值为：
  - `days`: 1~365
  - `limit`: 1~500
- 依赖 RSS 可用性：聚合结果受源站限流和可访问性影响。

## 环境变量

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
