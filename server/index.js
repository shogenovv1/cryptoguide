import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const PORT = Number(process.env.PORT || 3000);
const newsCache = { at: 0, items: [] };
const marketCache = { at: 0, data: null };

const fallbackNews = [
  { id: 'fallback-1', title: 'Крипторынок ждёт новых сигналов: проверь контекст перед сделкой', source: 'CryptoGuide briefing', time: new Date().toISOString(), asset: 'BTC', url: 'https://www.coindesk.com/' },
  { id: 'fallback-2', title: 'Почему новости важны для волатильности и управления риском', source: 'CryptoGuide briefing', time: new Date(Date.now() - 3600000).toISOString(), asset: 'Market', url: 'https://cointelegraph.com/' },
  { id: 'fallback-3', title: 'Учебная заметка: плечо увеличивает и потенциальную прибыль, и убыток', source: 'CryptoGuide briefing', time: new Date(Date.now() - 7200000).toISOString(), asset: 'Futures', url: 'https://www.coindesk.com/' }
];

const fallbackMarket = {
  BTC: { usd: 0, usd_24h_change: 0 },
  ETH: { usd: 0, usd_24h_change: 0 },
  SOL: { usd: 0, usd_24h_change: 0 }
};

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(type.startsWith('application/json') ? JSON.stringify(body) : body);
}

function stripHtml(input = '') {
  return input.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
}

function extractTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'));
  return match ? stripHtml(match[1]) : '';
}

function classifyAsset(title) {
  const value = title.toLowerCase();
  if (/bitcoin|btc/.test(value)) return 'BTC';
  if (/ethereum|eth/.test(value)) return 'ETH';
  if (/solana|sol/.test(value)) return 'SOL';
  if (/xrp|ripple/.test(value)) return 'XRP';
  if (/defi|dex|stablecoin/.test(value)) return 'DeFi';
  return 'Market';
}

function parseFeed(xml, source) {
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) || xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
  return blocks.slice(0, 12).map((block, index) => {
    const title = extractTag(block, 'title') || 'Без заголовка';
    const url = extractTag(block, 'link') || (block.match(/<link[^>]*href=["']([^"']+)["']/i)?.[1]) || '#';
    const time = extractTag(block, 'pubDate') || extractTag(block, 'published') || extractTag(block, 'updated') || new Date().toISOString();
    return { id: `${source}-${index}-${Buffer.from(title).toString('base64').slice(0, 10)}`, title, source, time, asset: classifyAsset(title), url };
  }).filter(item => item.title.length > 8 && /^https?:\/\//.test(item.url));
}

async function fetchWithTimeout(url, ms = 6500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'CryptoGuide/1.0 news reader' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

async function getNews() {
  if (Date.now() - newsCache.at < 180000 && newsCache.items.length) return newsCache.items;
  const sources = [
    ['CoinDesk', 'https://www.coindesk.com/arc/outboundfeeds/rss/'],
    ['Cointelegraph', 'https://cointelegraph.com/rss']
  ];
  const batches = await Promise.allSettled(sources.map(async ([source, url]) => parseFeed(await fetchWithTimeout(url), source)));
  const items = batches.flatMap(result => result.status === 'fulfilled' ? result.value : []);
  const unique = [...new Map(items.map(item => [item.title, item])).values()].sort((a, b) => Date.parse(b.time) - Date.parse(a.time));
  newsCache.items = unique.length ? unique.slice(0, 24) : fallbackNews;
  newsCache.at = Date.now();
  return newsCache.items;
}

async function getMarket() {
  if (Date.now() - marketCache.at < 120000 && marketCache.data) return marketCache.data;
  try {
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true';
    const raw = JSON.parse(await fetchWithTimeout(url, 5000));
    marketCache.data = { BTC: raw.bitcoin || fallbackMarket.BTC, ETH: raw.ethereum || fallbackMarket.ETH, SOL: raw.solana || fallbackMarket.SOL };
  } catch {
    marketCache.data = fallbackMarket;
  }
  marketCache.at = Date.now();
  return marketCache.data;
}

const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };

async function serveStatic(res, pathname) {
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
  const target = path.resolve(PUBLIC, relative);
  if (!target.startsWith(PUBLIC)) return send(res, 403, { error: 'Forbidden' });
  try {
    const info = await stat(target);
    if (!info.isFile()) throw new Error('not file');
    const body = await readFile(target);
    res.writeHead(200, { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    res.end(body);
  } catch {
    if (pathname !== '/') return serveStatic(res, '/index.html');
    send(res, 404, { error: 'Not found' });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (url.pathname === '/health') return send(res, 200, { ok: true, service: 'cryptoguide' });
    if (url.pathname === '/api/news') {
      const query = (url.searchParams.get('q') || '').trim().toLowerCase();
      const asset = url.searchParams.get('asset') || 'all';
      let items = await getNews();
      if (query) items = items.filter(item => `${item.title} ${item.source} ${item.asset}`.toLowerCase().includes(query));
      if (asset !== 'all') items = items.filter(item => item.asset === asset);
      return send(res, 200, { items, updatedAt: new Date().toISOString(), live: !items.every(item => item.id.startsWith('fallback-')) });
    }
    if (url.pathname === '/api/market') return send(res, 200, { data: await getMarket(), updatedAt: new Date().toISOString() });
    return serveStatic(res, url.pathname);
  } catch (error) {
    console.error(error);
    send(res, 500, { error: 'Не удалось получить данные', detail: error.message });
  }
});

server.listen(PORT, '0.0.0.0', () => console.log(`CryptoGuide listening on ${PORT}`));
