export const DEFAULT_DAYS = 3;
export const DEFAULT_LIMIT = 100;
export const MAX_FEEDS = 20;
export const MAX_ITEMS = 500;

function toNumber(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function clamp(value, min, max, fallback) {
  if (!Number.isFinite(value)) return fallback;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function decodeHtml(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'");
}

function stripCdata(input) {
  if (!input) return '';
  const text = input.trim();
  if (text.startsWith('<![CDATA[') && text.endsWith(']]>')) {
    return text.slice(9, -3);
  }
  return text;
}

function sanitizeText(input) {
  if (!input) return '';
  return decodeHtml(stripCdata(input))
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeXml(input) {
  return (input || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function pickTag(xml, names) {
  if (!xml) return null;
  const candidates = Array.isArray(names) ? names : [names];
  for (const name of candidates) {
    const escaped = name;
    const match = xml.match(new RegExp(`<${escaped}[^>]*>([\\s\\S]*?)<\\/${escaped}>`, 'i'));
    if (match) return sanitizeText(match[1]);

    const emptyMatch = xml.match(new RegExp(`<${escaped}[^>]*\\s*/>`, 'i'));
    if (emptyMatch) return '';
  }
  return null;
}

function pickLink(xml) {
  const linkTag = xml.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i);
  if (linkTag) return linkTag[1].trim();

  const simple = xml.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
  if (simple && sanitizeText(simple[1])) return sanitizeText(simple[1]);

  return '';
}

function parseDate(input) {
  if (!input) return null;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function parseItems(xmlText) {
  const itemBlocks = [
    ...xmlText.matchAll(/<item[\s\S]*?<\/item>/gi),
    ...xmlText.matchAll(/<entry[\s\S]*?<\/entry>/gi),
  ];

  const items = [];

  for (const match of itemBlocks) {
    const block = match[0];

    const title = pickTag(block, ['title']);
    const description = pickTag(block, ['description', 'summary', 'content:encoded', 'content']);
    const pubRaw = pickTag(block, ['pubDate', 'updated', 'published']);
    const pubDate = parseDate(pubRaw) || new Date(0);
    const link = pickLink(block);

    if (!title && !link) {
      continue;
    }

    items.push({
      title: title || '（无标题）',
      link,
      description: description || '',
      pubDate: pubDate.toISOString(),
      timestamp: +pubDate,
      guid: pickTag(block, ['guid']) || link || `${title}-${pubDate.toISOString()}`,
      source: ''
    });
  }

  return items;
}

async function fetchFeed(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'rss-aggregator/1.0',
      },
    });

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }

    const xml = await resp.text();
    const items = parseItems(xml);
    return { title: pickTag(xml, ['title']) || url, items, error: null };
  } finally {
    clearTimeout(timeout);
  }
}

function buildRss(items, mergedTitle = 'RSS 聚合', mergedLink = '', mergedDesc = '最近几天 RSS 聚合结果') {
  const channelTitle = escapeXml(mergedTitle);
  const itemsXml = items
    .map((item) => {
      return `    <item>\n      <title>${escapeXml(item.title)}</title>\n      <link>${escapeXml(item.link || '')}</link>\n      <guid isPermaLink="false">${escapeXml(item.guid || item.link || item.title)}</guid>\n      <pubDate>${item.pubDate}</pubDate>\n      <description><![CDATA[${item.description || ''}]]></description>\n      <source>${escapeXml(item.source || '')}</source>\n    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8" ?>\n<rss version="2.0">\n  <channel>\n    <title>${channelTitle}</title>\n    <link>${escapeXml(mergedLink)}</link>\n    <description>${escapeXml(mergedDesc)}</description>\n    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n${itemsXml}\n  </channel>\n</rss>`;
}

function buildHelp(hostLike) {
  return {
    message: '参数说明',
    usage: `${hostLike}/?urls=https://a.com/feed.xml,https://b.com/atom.xml&days=3&limit=50&format=json|rss`,
    params: {
      urls: '多条 RSS 链接，英文逗号分隔，必填',
      days: '抓取最近 N 天内更新，默认 3',
      limit: '返回条数上限，默认100',
      format: 'rss(默认) 或 json',
    },
    example: {
      rss: `${hostLike}/?urls=https://hnrss.org/frontpage&days=2&limit=20`,
      json: `${hostLike}/?urls=https://hnrss.org/frontpage&days=7&format=json`
    },
  };
}

export async function handleRequest(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const urlParams = url.searchParams;

    const allUrls = [];
    const urlParam = urlParams.get('urls');
    if (urlParam) {
      allUrls.push(...urlParam.split(',').map((v) => v.trim()).filter(Boolean));
    }
    allUrls.push(...urlParams.getAll('url').map((v) => v.trim()).filter(Boolean));

    const hostLike = `${url.origin}${url.pathname}`;
    if (!allUrls.length) {
      return {
        status: 200,
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify(buildHelp(hostLike), null, 2),
      };
    }

    if (allUrls.length > MAX_FEEDS) {
      return {
        status: 400,
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ error: `一次最多支持 ${MAX_FEEDS} 条 feed` }),
      };
    }

    const days = clamp(toNumber(urlParams.get('days'), DEFAULT_DAYS), 1, 365, DEFAULT_DAYS);
    const limit = clamp(toNumber(urlParams.get('limit'), DEFAULT_LIMIT), 1, MAX_ITEMS, DEFAULT_LIMIT);
    const format = (urlParams.get('format') || 'rss').toLowerCase();

    const now = Date.now();
    const minTs = now - days * 24 * 60 * 60 * 1000;

    const results = await Promise.allSettled(allUrls.map(fetchFeed));
    const allItems = [];

    results.forEach((result, idx) => {
      if (result.status !== 'fulfilled') {
        const fail = result.reason?.message || 'unknown';
        console.error(`[RSS AGG] fetch failed: ${allUrls[idx]} -> ${fail}`);
        return;
      }

      const feed = result.value;
      const source = feed.title || allUrls[idx];

      for (const item of feed.items) {
        const ts = Number(item.timestamp);
        if (!Number.isFinite(ts) || ts < minTs) continue;
        allItems.push({
          ...item,
          source,
        });
      }
    });

    const finalItems = allItems
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    if (format === 'json') {
      return {
        status: 200,
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=300' },
        body: JSON.stringify({
          count: finalItems.length,
          generatedAt: new Date().toISOString(),
          items: finalItems.map(({ title, link, description, pubDate, source }) => ({
            title,
            link,
            description,
            pubDate,
            source,
          })),
        }, null, 2),
      };
    }

    return {
      status: 200,
      headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=300' },
      body: buildRss(finalItems),
    };
  } catch (error) {
    return {
      status: 500,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: error.message || 'internal error' }),
    };
  }
}

export default handleRequest;
