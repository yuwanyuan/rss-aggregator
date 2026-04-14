const HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>RSS 聚合工具</title>
<style>
:root{--bg:#0a0a0f;--card:#12121a;--border:#1e1e2e;--accent:#7c3aed;--accent2:#2563eb;--text:#e4e4e7;--muted:#71717a;--input-bg:#0f0f17}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:var(--bg);color:var(--text);min-height:100vh;line-height:1.6}
.container{max-width:780px;margin:0 auto;padding:32px 20px}
.header{text-align:center;margin-bottom:36px}
.header h1{font-size:2rem;font-weight:800;background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:-.02em}
.header p{color:var(--muted);font-size:.9rem;margin-top:4px}
.card{background:var(--card);border-radius:16px;padding:24px;margin-bottom:20px;border:1px solid var(--border)}
label{display:block;font-size:.78rem;color:var(--muted);margin-bottom:6px;font-weight:600;text-transform:uppercase;letter-spacing:.04em}
textarea{width:100%;background:var(--input-bg);border:1px solid var(--border);border-radius:10px;padding:12px 14px;color:var(--text);font-size:.88rem;outline:none;transition:border .2s;resize:vertical;min-height:90px;font-family:'SF Mono',Menlo,monospace}
textarea:focus{border-color:var(--accent)}
textarea::placeholder{color:#3f3f50}
.row{display:flex;gap:12px;margin-top:14px}
.row>div{flex:1}
input[type=number],select{width:100%;background:var(--input-bg);border:1px solid var(--border);border-radius:10px;padding:10px 14px;color:var(--text);font-size:.88rem;outline:none;transition:border .2s}
input:focus,select:focus{border-color:var(--accent)}
select option{background:var(--card);color:var(--text)}
.actions{display:flex;gap:10px;margin-top:20px;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;gap:6px;padding:10px 22px;border-radius:10px;border:none;cursor:pointer;font-size:.88rem;font-weight:600;transition:all .15s}
.btn:active{transform:scale(.97)}
.btn-primary{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff}
.btn-primary:hover{opacity:.92}
.btn-ghost{background:transparent;color:var(--muted);border:1px solid var(--border)}
.btn-ghost:hover{border-color:var(--muted);color:var(--text)}
.btn-copy{background:#059669;color:#fff;display:none}
.btn-copy:hover{background:#047857}
.output{margin-top:20px;display:none}
.output-box{background:var(--input-bg);border-radius:10px;padding:14px;font-family:'SF Mono',Menlo,monospace;font-size:.78rem;word-break:break-all;color:#a5b4fc;border:1px solid var(--border);line-height:1.5}
#result-area{display:none;margin-top:20px}
.result-card{background:var(--card);border-radius:12px;padding:16px 18px;margin-bottom:10px;border:1px solid var(--border);transition:border .2s}
.result-card:hover{border-color:#2e2e42}
.result-card h3{font-size:.95rem;margin-bottom:4px;font-weight:600}
.result-card h3 a{color:#a5b4fc;text-decoration:none}
.result-card h3 a:hover{text-decoration:underline}
.result-card .meta{font-size:.72rem;color:var(--muted);margin-bottom:6px}
.result-card p{font-size:.84rem;color:#a1a1aa;line-height:1.55;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.badge{display:inline-block;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;font-size:.65rem;padding:2px 8px;border-radius:6px;font-weight:600;margin-left:6px;vertical-align:middle}
.loading{text-align:center;padding:24px;color:var(--muted);font-size:.88rem}
.result-count{font-size:.78rem;color:var(--muted);margin-bottom:12px}
footer{text-align:center;color:#333;margin-top:40px;font-size:.72rem}
footer a{color:#52526a;text-decoration:none}
footer a:hover{color:var(--accent)}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>RSS 聚合工具</h1>
    <p>多条 RSS / Atom 订阅源 → 一条聚合 feed</p>
  </div>

  <div class="card">
    <label>Feed 地址（每行一个）</label>
    <textarea id="feeds" placeholder="https://hnrss.org/frontpage&#10;https://feeds.feedburner.com/TechCrunch"></textarea>

    <div class="row">
      <div><label>最近 N 天</label><input id="days" type="number" value="3" min="1" max="365"></div>
      <div><label>条数上限</label><input id="limit" type="number" value="50" min="1" max="500"></div>
      <div><label>输出格式</label>
        <select id="format"><option value="json">JSON</option><option value="rss">RSS XML</option></select>
      </div>
    </div>

    <div class="actions">
      <button class="btn btn-primary" onclick="generate()">生成链接</button>
      <button class="btn btn-ghost" onclick="preview()">预览结果</button>
      <button class="btn btn-copy" id="copy-btn" onclick="copyUrl()">复制链接</button>
    </div>
  </div>

  <div class="output" id="output-box">
    <label>聚合链接</label>
    <div class="output-box" id="output-url"></div>
  </div>

  <div id="result-area">
    <div class="result-count" id="result-count"></div>
    <div id="results"></div>
  </div>

  <footer>聚合在服务端完成，无 CORS 问题 · <a href="https://github.com/yuwanyuan/rss-aggregator">GitHub</a></footer>
</div>

<script>
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
  if(!url){alert('请输入至少一个 Feed 地址');return}
  document.getElementById('output-box').style.display='block'
  document.getElementById('output-url').textContent=url
  document.getElementById('copy-btn').style.display='inline-flex'
}
async function preview(){
  const url=buildApiUrl()
  if(!url){alert('请输入至少一个 Feed 地址');return}
  document.getElementById('output-box').style.display='block'
  document.getElementById('output-url').textContent=url
  document.getElementById('copy-btn').style.display='inline-flex'
  const area=document.getElementById('result-area')
  const box=document.getElementById('results')
  const countEl=document.getElementById('result-count')
  area.style.display='block'
  box.innerHTML='<div class="loading">加载中…</div>'
  countEl.textContent=''
  try{
    const resp=await fetch(url)
    const contentType=resp.headers.get('content-type')||''
    if(contentType.includes('json')){
      const data=await resp.json()
      if(!data.items||!data.items.length){box.innerHTML='<div class="loading">无匹配结果</div>';return}
      countEl.textContent='共 '+data.items.length+' 条'
      box.innerHTML=data.items.map(it=>\`
        <div class="result-card">
          <h3><a href="\${it.link||'#'}" target="_blank" rel="noopener">\${esc(it.title)}</a>
          <span class="badge">\${esc(it.source)}</span></h3>
          <div class="meta">\${it.pubDate||''}</div>
          <p>\${esc(it.description)}</p>
        </div>\`).join('')
    }else{
      const text=await resp.text()
      box.innerHTML='<div class="loading"><a href="'+url+'" target="_blank" style="color:#a5b4fc">RSS XML 已生成，点击查看</a></div>'
    }
  }catch(e){box.innerHTML='<div class="loading">请求失败: '+esc(e.message)+'</div>'}
}
function copyUrl(){
  const url=document.getElementById('output-url').textContent
  navigator.clipboard.writeText(url).then(()=>{const b=document.getElementById('copy-btn');b.textContent='✓ 已复制';setTimeout(()=>{b.textContent='复制链接'},1500)})
}
function esc(s){if(!s)return '';const d=document.createElement('div');d.textContent=s;return d.innerHTML}
</script>
</body>
</html>`;

export function getHtml() {
  return HTML;
}
