const HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>RSS 聚合工具</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh}
.container{max-width:720px;margin:0 auto;padding:24px 16px}
h1{font-size:1.5rem;margin-bottom:6px;background:linear-gradient(135deg,#38bdf8,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.sub{color:#94a3b8;font-size:.85rem;margin-bottom:24px}
.card{background:#1e293b;border-radius:12px;padding:20px;margin-bottom:16px;border:1px solid #334155}
label{display:block;font-size:.8rem;color:#94a3b8;margin-bottom:6px;font-weight:500}
input,textarea,select{width:100%;background:#0f172a;border:1px solid #334155;border-radius:8px;padding:10px 12px;color:#e2e8f0;font-size:.9rem;outline:none;transition:border .2s}
input:focus,textarea:focus,select:focus{border-color:#38bdf8}
textarea{resize:vertical;min-height:80px;font-family:monospace}
.row{display:flex;gap:12px}
.row>div{flex:1}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:10px 20px;border-radius:8px;border:none;cursor:pointer;font-size:.9rem;font-weight:600;transition:all .2s}
.btn-primary{background:linear-gradient(135deg,#38bdf8,#818cf8);color:#0f172a}
.btn-primary:hover{opacity:.9;transform:translateY(-1px)}
.btn-secondary{background:#334155;color:#e2e8f0}
.btn-secondary:hover{background:#475569}
.btn-copy{background:#059669;color:#fff}
.btn-copy:hover{background:#047857}
.actions{display:flex;gap:10px;margin-top:16px;flex-wrap:wrap}
.output{margin-top:16px}
.output-url{background:#0f172a;border-radius:8px;padding:12px;font-family:monospace;font-size:.8rem;word-break:break-all;color:#a5f3fc;border:1px solid #334155;position:relative}
#result-area{display:none;margin-top:16px}
.result-card{background:#1e293b;border-radius:10px;padding:14px 16px;margin-bottom:10px;border:1px solid #334155}
.result-card h3{font-size:.95rem;margin-bottom:4px}
.result-card h3 a{color:#38bdf8;text-decoration:none}
.result-card h3 a:hover{text-decoration:underline}
.result-card .meta{font-size:.75rem;color:#64748b;margin-bottom:6px}
.result-card p{font-size:.85rem;color:#cbd5e1;line-height:1.5;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.badge{display:inline-block;background:#818cf8;color:#0f172a;font-size:.65rem;padding:2px 6px;border-radius:4px;font-weight:600;margin-left:6px;vertical-align:middle}
.loading{text-align:center;padding:20px;color:#94a3b8}
footer{text-align:center;color:#475569;font-size:.75rem;margin-top:32px}
</style>
</head>
<body>
<div class="container">
  <h1>RSS 聚合工具</h1>
  <p class="sub">多条 RSS/Atom 订阅 → 一条聚合 feed，部署在 Cloudflare Workers / Vercel</p>

  <div class="card">
    <label>Feed 地址（每行一个）</label>
    <textarea id="feeds" placeholder="https://hnrss.org/frontpage&#10;https://feeds.feedburner.com/TechCrunch"></textarea>

    <div class="row" style="margin-top:14px">
      <div><label>最近 N 天</label><input id="days" type="number" value="3" min="1" max="365"></div>
      <div><label>条数上限</label><input id="limit" type="number" value="50" min="1" max="500"></div>
      <div><label>输出格式</label>
        <select id="format"><option value="json">JSON（预览）</option><option value="rss">RSS XML</option></select>
      </div>
    </div>

    <div class="actions">
      <button class="btn btn-primary" onclick="generate()">生成聚合链接</button>
      <button class="btn btn-secondary" onclick="preview()">预览结果</button>
      <button class="btn btn-copy" id="copy-btn" onclick="copyUrl()" style="display:none">复制链接</button>
    </div>
  </div>

  <div class="output" id="output-box" style="display:none">
    <label>聚合链接</label>
    <div class="output-url" id="output-url"></div>
  </div>

  <div id="result-area">
    <label style="margin-bottom:10px;display:block">聚合结果</label>
    <div id="results"></div>
  </div>

  <footer>聚合在你的服务端完成，无 CORS 问题 · 源码 <a href="https://github.com/yuwanyuan/rss-aggregator" style="color:#38bdf8">GitHub</a></footer>
</div>

<script>
function getFeeds(){
  return document.getElementById('feeds').value.split('\\n').map(s=>s.trim()).filter(Boolean)
}
function buildUrl(){
  const feeds=getFeeds()
  if(!feeds.length) return null
  const days=document.getElementById('days').value||'3'
  const limit=document.getElementById('limit').value||'50'
  const format=document.getElementById('format').value||'json'
  const base=location.origin+location.pathname.replace(/\\/$/,'')
  const params=new URLSearchParams()
  params.set('urls',feeds.join(','))
  params.set('days',days)
  params.set('limit',limit)
  params.set('format',format)
  return base+'?'+params.toString()
}
function generate(){
  const url=buildUrl()
  if(!url){alert('请输入至少一个 Feed 地址');return}
  document.getElementById('output-box').style.display='block'
  document.getElementById('output-url').textContent=url
  document.getElementById('copy-btn').style.display='inline-flex'
}
async function preview(){
  const url=buildUrl()
  if(!url){alert('请输入至少一个 Feed 地址');return}
  document.getElementById('output-box').style.display='block'
  document.getElementById('output-url').textContent=url
  document.getElementById('copy-btn').style.display='inline-flex'
  const area=document.getElementById('result-area')
  const box=document.getElementById('results')
  area.style.display='block'
  box.innerHTML='<div class="loading">加载中…</div>'
  try{
    const resp=await fetch(url)
    const data=await resp.json()
    if(!data.items||!data.items.length){box.innerHTML='<div class="loading">无匹配结果</div>';return}
    box.innerHTML=data.items.map(it=>\`
      <div class="result-card">
        <h3><a href="\${it.link||'#'}" target="_blank" rel="noopener">\${esc(it.title)}</a>
        <span class="badge">\${esc(it.source)}</span></h3>
        <div class="meta">\${it.pubDate||''}</div>
        <p>\${esc(it.description)}</p>
      </div>\`).join('')
  }catch(e){box.innerHTML='<div class="loading">请求失败: '+esc(e.message)+'</div>'}
}
function copyUrl(){
  const url=document.getElementById('output-url').textContent
  navigator.clipboard.writeText(url).then(()=>{const b=document.getElementById('copy-btn');b.textContent='已复制';setTimeout(()=>{b.innerHTML='复制链接'},1500)})
}
function esc(s){if(!s)return '';const d=document.createElement('div');d.textContent=s;return d.innerHTML}
</script>
</body>
</html>`;

export function getHtml() {
  return HTML;
}
