import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const PORT = Number(process.env.PORT || 3000);
const MAX_BODY_BYTES = 12 * 1024 * 1024;
const newsCache = { at: 0, items: [], translatedAt: 0 };
const marketCache = { at: 0, data: null };

const fallbackNews = [
  { id: 'fallback-1', title: 'Крипторынок ждёт новых сигналов: проверь контекст перед сделкой', source: 'CryptoGuide briefing', time: new Date().toISOString(), asset: 'BTC', url: 'https://www.coindesk.com/' },
  { id: 'fallback-2', title: 'Почему новости важны для волатильности и управления риском', source: 'CryptoGuide briefing', time: new Date(Date.now() - 3600000).toISOString(), asset: 'Market', url: 'https://cointelegraph.com/' },
  { id: 'fallback-3', title: 'Учебная заметка: плечо увеличивает и потенциальную прибыль, и убыток', source: 'CryptoGuide briefing', time: new Date(Date.now() - 7200000).toISOString(), asset: 'Futures', url: 'https://www.coindesk.com/' }
];
const fallbackNewsRu = [
  { id: 'fallback-ru-1', title: 'Крипторынок ждёт новых сигналов: проверь контекст перед сделкой', source: 'CryptoGuide briefing', time: new Date().toISOString(), asset: 'BTC', url: 'https://forklog.com/' },
  { id: 'fallback-ru-2', title: 'Почему новости важны для волатильности и управления риском', source: 'CryptoGuide briefing', time: new Date(Date.now() - 3600000).toISOString(), asset: 'Market', url: 'https://www.rbc.ru/crypto/' },
  { id: 'fallback-ru-3', title: 'Учебная заметка: плечо увеличивает и потенциальную прибыль, и убыток', source: 'CryptoGuide briefing', time: new Date(Date.now() - 7200000).toISOString(), asset: 'Futures', url: 'https://forklog.com/' }
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
  if (/bitcoin|биткоин|btc/.test(value)) return 'BTC';
  if (/ethereum|эфир|эфириум|eth/.test(value)) return 'ETH';
  if (/solana|солана|sol/.test(value)) return 'SOL';
  if (/xrp|ripple|рипл/.test(value)) return 'XRP';
  if (/defi|dex|stablecoin|стейбл/.test(value)) return 'DeFi';
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

async function translateNewsTitles(items) {
  if (!items.length) return items;
  if (!process.env.MANUS_API_URL || !process.env.MANUS_API_KEY) return items.map(item => ({ ...item, titleRu: item.titleOriginal }));
  const input = items.map(item => ({ id: item.id, title: item.titleOriginal }));
  const prompt = `Переведи заголовки криптовалютных новостей на естественный русский язык. Не добавляй фактов, не меняй смысл и не переводи названия компаний/тикеров без необходимости. Верни только JSON-массив объектов вида {"id":"...","titleRu":"..."}. Заголовки: ${JSON.stringify(input)}`;
  try {
    const response = await fetch(`${process.env.MANUS_API_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.MANUS_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.CG_VISION_MODEL || 'gpt-5-mini', max_completion_tokens: 1200, reasoning: { effort: 'minimal' }, messages: [{ role: 'user', content: prompt }] })
    });
    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content || '';
    const cleaned = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    const translated = JSON.parse(cleaned);
    const byId = new Map(translated.filter(item => item?.id && item?.titleRu).map(item => [item.id, item.titleRu]));
    return items.map(item => ({ ...item, titleRu: byId.get(item.id) || item.titleOriginal }));
  } catch {
    return items.map(item => ({ ...item, titleRu: item.titleOriginal }));
  }
}

async function getNews(lang = 'ru') {
  if (Date.now() - newsCache.at < 180000 && newsCache.items.length) {
    if (lang === 'ru' && newsCache.translatedAt === 0) { newsCache.items = await translateNewsTitles(newsCache.items); newsCache.translatedAt = Date.now(); }
    return newsCache.items.map(item => ({ ...item, title: lang === 'ru' ? item.titleRu : item.titleOriginal }));
  }
  const sources = [
    ['CoinDesk', 'https://www.coindesk.com/arc/outboundfeeds/rss/'],
    ['Cointelegraph', 'https://cointelegraph.com/rss']
  ];
  const batches = await Promise.allSettled(sources.map(async ([source, url]) => parseFeed(await fetchWithTimeout(url), source)));
  const items = batches.flatMap(result => result.status === 'fulfilled' ? result.value : []);
  const unique = [...new Map(items.map(item => [item.title, item])).values()].sort((a, b) => Date.parse(b.time) - Date.parse(a.time));
  const canonical = (unique.length ? unique.slice(0, 24) : fallbackNews).map(item => ({ ...item, titleOriginal: item.title, titleRu: item.title }));
  newsCache.items = lang === 'ru' ? await translateNewsTitles(canonical) : canonical;
  newsCache.translatedAt = lang === 'ru' ? Date.now() : 0;
  newsCache.at = Date.now();
  return newsCache.items.map(item => ({ ...item, title: lang === 'ru' ? item.titleRu : item.titleOriginal }));
}

async function getBinanceMarket() {
  const symbols = encodeURIComponent('["BTCUSDT","ETHUSDT","SOLUSDT"]');
  const raw = JSON.parse(await fetchWithTimeout(`https://api.binance.com/api/v3/ticker/24hr?symbols=${symbols}`, 5000));
  const rows = Object.fromEntries(raw.map(row => [row.symbol, row]));
  const convert = symbol => rows[`${symbol}USDT`] ? { usd: Number(rows[`${symbol}USDT`].lastPrice), usd_24h_change: Number(rows[`${symbol}USDT`].priceChangePercent) } : fallbackMarket[symbol];
  return { BTC: convert('BTC'), ETH: convert('ETH'), SOL: convert('SOL') };
}

async function getMarket() {
  if (Date.now() - marketCache.at < 120000 && marketCache.data) return marketCache.data;
  const [coingecko, binance] = await Promise.allSettled([
    fetchWithTimeout('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true', 5000).then(text => JSON.parse(text)),
    getBinanceMarket()
  ]);
  const cg = coingecko.status === 'fulfilled' ? coingecko.value : {};
  const bn = binance.status === 'fulfilled' ? binance.value : {};
  marketCache.data = {
    BTC: cg.bitcoin?.usd ? { usd: cg.bitcoin.usd, usd_24h_change: cg.bitcoin.usd_24h_change } : (bn.BTC || fallbackMarket.BTC),
    ETH: cg.ethereum?.usd ? { usd: cg.ethereum.usd, usd_24h_change: cg.ethereum.usd_24h_change } : (bn.ETH || fallbackMarket.ETH),
    SOL: cg.solana?.usd ? { usd: cg.solana.usd, usd_24h_change: cg.solana.usd_24h_change } : (bn.SOL || fallbackMarket.SOL)
  };
  marketCache.at = Date.now();
  return marketCache.data;
}

async function readJsonBody(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error('payload_too_large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

function parseModelJson(content = '') {
  const cleaned = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  try { return JSON.parse(cleaned); } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('invalid_model_json');
    return JSON.parse(match[0]);
  }
}

function visionFallback(input = {}) {
  const pair = String(input.pair || 'BTC/USDT').slice(0, 30);
  const price = Number(input.price) || 0;
  const direction = ['long', 'short'].includes(input.direction) ? input.direction : 'neutral';
  const buffer = price * 0.012;
  const stop = direction === 'short' ? price + buffer : price - buffer;
  return {
    summary: 'AI временно недоступен. Этот fallback использует только введённый контекст и не распознаёт изображение.',
    scenario: direction === 'long' ? 'Лонг только после подтверждения' : direction === 'short' ? 'Шорт только после подтверждения' : 'Наблюдение до появления сигнала',
    bias: direction,
    confidence: 'low',
    detected: ['Содержимое скриншота не распознано в fallback-режиме'],
    entryCondition: 'Проверь реакцию цены, объём и старший таймфрейм вручную',
    invalidation: price ? `${direction === 'short' ? 'закрепление выше' : 'закрепление ниже'} ${stop.toFixed(2)}` : 'Определи уровень отмены до входа',
    targets: ['Не рассчитываются без подтверждённого AI-разбора'],
    risks: ['Один скриншот не показывает новости, ликвидность, funding и комиссии'],
    learningNote: `Используй результат только как учебную заметку для ${pair}.`
  };
}

async function analyzeChartWithVision(input) {
  const { imageData, image_url: imageUrl, pair = 'BTC/USDT', timeframe = '1 час', price = 0, direction = 'neutral' } = input || {};
  const image = imageData || imageUrl;
  const validImage = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(image || '') || /^https:\/\//.test(image || '');
  if (!validImage) throw new Error('invalid_image');
  if ((image || '').length > 11 * 1024 * 1024) throw new Error('image_too_large');
  if (!process.env.MANUS_API_URL || !process.env.MANUS_API_KEY) throw new Error('ai_not_configured');
  const prompt = `Ты осторожный учебный аналитик криптовалютных графиков. Проанализируй изображение графика, не обещай результат и не давай безусловную команду покупать или продавать. Верни только JSON без markdown со следующими полями: summary (строка), scenario (строка), bias (одно из neutral,long,short), confidence (одно из low,medium), detected (массив строк: что реально видно на изображении), entryCondition (строка), invalidation (строка), targets (массив строк), risks (массив строк), learningNote (строка). Если данных на графике не хватает, прямо напиши это и выбери bias neutral. Контекст пользователя: пара ${String(pair).slice(0, 30)}, таймфрейм ${String(timeframe).slice(0, 20)}, введённая цена ${Number(price) || 0}, интерес ${direction}. Сначала опиши видимые элементы, затем учебный сценарий и условия его отмены.`;
  const response = await fetch(`${process.env.MANUS_API_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.MANUS_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.CG_VISION_MODEL || 'gpt-5-mini',
      max_completion_tokens: 900,
      reasoning: { effort: 'minimal' },
      messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: image, detail: 'auto' } }] }]
    })
  });
  const payload = await response.json();
  if (!response.ok || payload.error) throw new Error('ai_request_failed');
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error('ai_empty_response');
  return parseModelJson(content);
}

const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };

async function serveStatic(res, pathname) {
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
  const target = path.resolve(PUBLIC, relative);
  const relativeTarget = path.relative(PUBLIC, target);
  if (relativeTarget.startsWith(`..${path.sep}`) || path.isAbsolute(relativeTarget)) return send(res, 403, { error: 'Forbidden' });
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
      const lang = url.searchParams.get('lang') === 'en' ? 'en' : 'ru';
      let items = await getNews(lang);
      if (query) items = items.filter(item => `${item.title} ${item.source} ${item.asset}`.toLowerCase().includes(query));
      if (asset !== 'all') items = items.filter(item => item.asset === asset);
      return send(res, 200, { items, updatedAt: new Date().toISOString(), live: !items.every(item => item.id.startsWith('fallback-')) });
    }
    if (url.pathname === '/api/analyze' && req.method === 'POST') {
      const body = await readJsonBody(req);
      try {
        const result = await analyzeChartWithVision(body);
        return send(res, 200, { result, mode: 'vision', updatedAt: new Date().toISOString() });
      } catch (error) {
        console.error('AI analysis failed:', error.message);
        if (['invalid_image', 'image_too_large', 'payload_too_large'].includes(error.message)) return send(res, 400, { error: 'Проверь формат и размер изображения' });
        return send(res, 200, { result: visionFallback(body), mode: 'fallback', warning: 'AI-анализ временно недоступен', updatedAt: new Date().toISOString() });
      }
    }
    if (url.pathname === '/api/market') return send(res, 200, { data: await getMarket(), updatedAt: new Date().toISOString() });
    return serveStatic(res, url.pathname);
  } catch (error) {
    console.error(error);
    send(res, 500, { error: 'Не удалось получить данные' });
  }
});

server.listen(PORT, '0.0.0.0', () => console.log(`CryptoGuide listening on ${PORT}`));
