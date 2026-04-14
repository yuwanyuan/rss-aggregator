const HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>RSS 聚合工具 🔀</title>
<style>
:root{--bg:#fef9f0;--card:#fff;--border:#2d2d2d;--accent:#ff6b6b;--accent2:#feca57;--accent3:#48dbfb;--text:#2d2d2d;--muted:#888;--input-bg:#fff;--radius:16px;--shadow:0 4px 0 rgba(0,0,0,.08)}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Comic Neue','Nunito',-apple-system,BlinkMacSystemFont,sans-serif;background:var(--bg);color:var(--text);min-height:100vh;line-height:1.6;background-image:radial-gradient(circle at 20% 80%,rgba(255,107,107,.06) 0%,transparent 50%),radial-gradient(circle at 80% 20%,rgba(72,219,251,.06) 0%,transparent 50%)}
.container{max-width:780px;margin:0 auto;padding:32px 20px}
.header{text-align:center;margin-bottom:32px}
.header h1{font-size:2.2rem;font-weight:800;letter-spacing:-.01em}
.header h1 .e1{color:var(--accent)}
.header h1 .e2{color:var(--accent2)}
.header h1 .e3{color:var(--accent3)}
.header p{color:var(--muted);font-size:.92rem;margin-top:2px}
.card{background:var(--card);border-radius:var(--radius);padding:24px 26px;margin-bottom:20px;border:3px solid var(--border);box-shadow:var(--shadow)}
label{display:block;font-size:.82rem;color:var(--text);margin-bottom:6px;font-weight:700}
textarea{width:100%;background:var(--input-bg);border:3px solid var(--border);border-radius:12px;padding:12px 14px;color:var(--text);font-size:.88rem;outline:none;transition:border .2s;resize:vertical;min-height:90px;font-family:'SF Mono',Menlo,monospace}
textarea:focus{border-color:var(--accent)}
textarea::placeholder{color:#bbb}
.row{display:flex;gap:12px;margin-top:14px}
.row>div{flex:1}
input[type=number],select{width:100%;background:var(--input-bg);border:3px solid var(--border);border-radius:12px;padding:10px 14px;color:var(--text);font-size:.88rem;outline:none;transition:border .2s;font-family:inherit}
input:focus,select:focus{border-color:var(--accent3)}
select option{background:#fff;color:var(--text)}
.actions{display:flex;gap:10px;margin-top:18px;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;gap:6px;padding:10px 24px;border-radius:12px;border:3px solid var(--border);cursor:pointer;font-size:.9rem;font-weight:700;transition:all .1s;font-family:inherit;box-shadow:0 3px 0 rgba(0,0,0,.1)}
.btn:active{transform:translateY(2px);box-shadow:none}
.btn-primary{background:var(--accent);color:#fff}
.btn-ghost{background:#fff;color:var(--text)}
.btn-copy{background:#1dd1a1;color:#fff;display:none}
.output{margin-top:20px;display:none}
.output-box{background:#fff8ee;border:3px solid var(--border);border-radius:12px;padding:14px;font-family:'SF Mono',Menlo,monospace;font-size:.78rem;word-break:break-all;color:#6c5ce7;line-height:1.5}
#result-area{display:none;margin-top:20px}
.result-card{background:var(--card);border-radius:14px;padding:16px 18px;margin-bottom:12px;border:3px solid var(--border);box-shadow:0 3px 0 rgba(0,0,0,.06);transition:transform .1s}
.result-card:hover{transform:translateY(-2px)}
.result-card h3{font-size:.95rem;margin-bottom:4px;font-weight:700}
.result-card h3 a{color:#6c5ce7;text-decoration:none}
.result-card h3 a:hover{text-decoration:underline}
.result-card .meta{font-size:.74rem;color:var(--muted);margin-bottom:6px}
.result-card p{font-size:.84rem;color:#666;line-height:1.55;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.badge{display:inline-block;background:var(--accent2);color:#2d2d2d;font-size:.68rem;padding:2px 9px;border-radius:8px;font-weight:700;margin-left:6px;vertical-align:middle;border:2px solid var(--border)}
.loading{text-align:center;padding:24px;color:var(--muted);font-size:.92rem}
.result-count{font-size:.84rem;color:var(--muted);margin-bottom:12px;font-weight:700}
footer{text-align:center;color:#bbb;margin-top:40px;font-size:.76rem}
footer a{color:#aaa;text-decoration:none}
footer a:hover{color:var(--accent)}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1><span class="e1">RSS</span> <span class="e2">🔀</span> <span class="e3">聚合工具</span></h1>
    <p>多条订阅源 → 一条聚合 feed，简单粗暴</p>
  </div>

  <div class="card">
    <label>📋 Feed 地址（每行一个）</label>
    <textarea id="feeds" placeholder="https://hnrss.org/frontpage&#10;https://feeds.feedburner.com/TechCrunch"></textarea>

    <div class="row">
      <div><label>📅 最近 N 天</label><input id="days" type="number" value="3" min="1" max="365"></div>
      <div><label>🔢 条数上限</label><input id="limit" type="number" value="50" min="1" max="500"></div>
      <div><label>📦 输出格式</label>
        <select id="format"><option value="json">JSON</option><option value="rss">RSS XML</option></select>
      </div>
    </div>

    <div class="actions">
      <button class="btn btn-primary" onclick="generate()">🔗 生成链接</button>
      <button class="btn btn-ghost" onclick="preview()">👀 预览结果</button>
      <button class="btn btn-copy" id="copy-btn" onclick="copyUrl()">📋 复制链接</button>
    </div>
  </div>

  <div class="output" id="output-box">
    <label>🎯 聚合链接</label>
    <div class="output-box" id="output-url"></div>
  </div>

  <div id="result-area">
    <div class="result-count" id="result-count"></div>
    <div id="results"></div>
  </div>

  <footer>聚合在服务端完成 · 无 CORS 问题 · <a href="https://github.com/yuwanyuan/rss-aggregator">GitHub</a></footer>
</div>

<script>
const STORAGE_KEY='rss_agg_config';
function loadConfig(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY)
    if(!raw) return
    const cfg=JSON.parse(raw)
    if(cfg.feeds) document.getElementById('feeds').value=cfg.feeds
    if(cfg.days) document.getElementById('days').value=cfg.days
    if(cfg.limit) document.getElementById('limit').value=cfg.limit
    if(cfg.format) document.getElementById('format').value=cfg.format
  }catch(e){}
}
function saveConfig(){
  const cfg={
    feeds:document.getElementById('feeds').value,
    days:document.getElementById('days').value,
    limit:document.getElementById('limit').value,
    format:document.getElementById('format').value
  }
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(cfg))}catch(e){}
}
loadConfig()
document.getElementById('feeds').addEventListener('input',saveConfig)
document.getElementById('days').addEventListener('input',saveConfig)
document.getElementById('limit').addEventListener('input',saveConfig)
document.getElementById('format').addEventListener('change',saveConfig)

function getFeeds(){
  return document.getElementById('feeds').value.split('\\n').map(s=>s.trim()).filter(Boolean)
}
function buildApiUrl(){
  const feeds=getFeeds()
  if(!feeds.length) return null
  const days=document.getElementById('days').value||'3'
  const limit=document.getElementById('limit').value||'50'
  const format=document.getElementById('format').value||'json'
  const base=location.origin
  const params=new URLSearchParams()
  params.set('urls',feeds.join(','))
  params.set('days',days)
  params.set('limit',limit)
  params.set('format',format)
  return base+'/api?'+params.toString()
}
function generate(){
  const url=buildApiUrl()
  if(!url){alert('请输入至少一个 Feed 地址 🥺');return}
  document.getElementById('output-box').style.display='block'
  document.getElementById('output-url').textContent=url
  document.getElementById('copy-btn').style.display='inline-flex'
}
async function preview(){
  const url=buildApiUrl()
  if(!url){alert('请输入至少一个 Feed 地址 🥺');return}
  document.getElementById('output-box').style.display='block'
  document.getElementById('output-url').textContent=url
  document.getElementById('copy-btn').style.display='inline-flex'
  const area=document.getElementById('result-area')
  const box=document.getElementById('results')
  const countEl=document.getElementById('result-count')
  area.style.display='block'
  box.innerHTML='<div class="loading">⏳ 加载中…</div>'
  countEl.textContent=''
  try{
    const resp=await fetch(url)
    const contentType=resp.headers.get('content-type')||''
    if(contentType.includes('json')){
      const data=await resp.json()
      if(!data.items||!data.items.length){box.innerHTML='<div class="loading">😶 无匹配结果</div>';return}
      countEl.textContent='🎉 共 '+data.items.length+' 条'
      box.innerHTML=data.items.map(it=>\`
        <div class="result-card">
          <h3><a href="\${it.link||'#'}" target="_blank" rel="noopener">\${esc(it.title)}</a>
          <span class="badge">\${esc(it.source)}</span></h3>
          <div class="meta">\${it.pubDate||''}</div>
          <p>\${esc(it.description)}</p>
        </div>\`).join('')
    }else{
      box.innerHTML='<div class="loading">📄 <a href="'+url+'" target="_blank" style="color:#6c5ce7">RSS XML 已生成，点击查看</a></div>'
    }
  }catch(e){box.innerHTML='<div class="loading">😱 请求失败: '+esc(e.message)+'</div>'}
}
function copyUrl(){
  const url=document.getElementById('output-url').textContent
  navigator.clipboard.writeText(url).then(()=>{const b=document.getElementById('copy-btn');b.textContent='✅ 已复制';setTimeout(()=>{b.textContent='📋 复制链接'},1500)})
}
function esc(s){if(!s)return '';const d=document.createElement('div');d.textContent=s;return d.innerHTML}
</script>
</body>
</html>`;

export function getHtml() {
  return HTML;
}
