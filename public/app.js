const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
function readArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}
const state = { currentView: 'overview', news: [], selectedImage: null, lessons: [], history: readArray('cg-history') };

const lessons = [
  { id: 'p2p', title: 'P2P: обмен без спешки', duration: '6 мин · база', description: 'Что происходит между покупателем и продавцом, как работает escrow и какие красные флаги нельзя игнорировать.', body: 'P2P — это сделка между пользователями через площадку. Проверяй имя получателя, не уходи в сторонние мессенджеры, не подтверждай оплату по скриншоту и не отпускай актив, пока деньги не видны в твоём банке.' },
  { id: 'spot', title: 'Спот: купить сам актив', duration: '8 мин · база', description: 'Разница между рыночным и лимитным ордером, комиссия и почему спот не равен «без риска».', body: 'На споте ты покупаешь или продаёшь сам актив без ликвидации от плеча. Но цена всё равно может двигаться против тебя. Лимитный ордер задаёт цену, рыночный — приоритет исполнения.' },
  { id: 'chart', title: 'График: читать, а не угадывать', duration: '10 мин · практика', description: 'Свечи, таймфрейм, тренд, поддержка и сопротивление как язык гипотез.', body: 'Сначала определи старший контекст, потом смотри структуру движения. Уровень — это зона интереса, а не магическая линия. Ищи реакцию цены и заранее решай, где сценарий отменяется.' },
  { id: 'futures', title: 'Фьючерсы: плечо под контролем', duration: '12 мин · осторожно', description: 'Лонг, шорт, маржа, funding и ликвидация — до первой реальной сделки.', body: 'Фьючерсы позволяют открыть позицию на движение цены, но плечо увеличивает скорость убытка. Ликвидация может наступить раньше, чем кажется. Сначала paper-trading, потом минимальный размер, а не наоборот.' },
  { id: 'risk', title: 'Риск: главный торговый навык', duration: '7 мин · фундамент', description: 'Как ограничить убыток, рассчитать позицию и почему «отыграться» — плохой план.', body: 'Определи допустимый убыток до входа. Размер позиции зависит от риска и расстояния до стопа, а не от желания заработать. Если сценарий нельзя описать цифрами, его нельзя нормально проверить.' }
];

const glossary = [
  ['Спот', 'Покупка или продажа самого актива без фьючерсного контракта и кредитного плеча.', 'рынок'],
  ['P2P', 'Сделка между пользователями через площадку. Безопасность зависит от правил escrow и проверки платежа.', 'рынок'],
  ['Лонг', 'Сценарий, в котором трейдер рассчитывает на рост цены. Это не гарантия роста.', 'фьючерсы'],
  ['Шорт', 'Сценарий, в котором трейдер рассчитывает на снижение цены. Убыток возможен при росте.', 'фьючерсы'],
  ['Плечо', 'Множитель размера позиции относительно залога. Увеличивает и потенциальную прибыль, и убыток.', 'риск'],
  ['Маржа', 'Залог, который поддерживает позицию. Изменяется вместе с правилами конкретного контракта.', 'фьючерсы'],
  ['Ликвидация', 'Принудительное закрытие позиции биржей, когда залога недостаточно для поддержания убытка.', 'риск'],
  ['Funding rate', 'Периодический платёж между сторонами бессрочного фьючерсного контракта.', 'фьючерсы'],
  ['Лимитный ордер', 'Заявка с заданной ценой. Она может не исполниться, если рынок не дойдёт до неё.', 'спот'],
  ['Рыночный ордер', 'Заявка на исполнение по доступной цене. Итоговая цена может отличаться из-за проскальзывания.', 'спот'],
  ['Стоп-лосс', 'Предварительно заданная точка выхода, если сценарий оказался неверным.', 'риск'],
  ['Таймфрейм', 'Масштаб одной свечи: 15 минут, час, 4 часа и так далее.', 'график']
];

function formatPrice(value) {
  if (!value) return 'нет данных';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: value > 100 ? 0 : 2 }).format(value);
}
function formatDate(value, short = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'время неизвестно';
  return new Intl.DateTimeFormat('ru-RU', short ? { day: '2-digit', month: 'short' } : { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
}
function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message; toast.classList.add('show');
  clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 2800);
}
function setView(view) {
  state.currentView = view;
  $$('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  $$('.view').forEach(section => section.classList.toggle('active', section.id === `view-${view}`));
  const label = $(`.nav-item[data-view="${view}"] span:nth-child(2)`)?.textContent || 'Обзор';
  $('#crumbLabel').textContent = label.toUpperCase();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (view === 'news' && !state.news.length) loadNews();
}
function renderMarket(data) {
  const labels = [['BTC', 'Bitcoin'], ['ETH', 'Ethereum'], ['SOL', 'Solana']];
  $('#marketGrid').innerHTML = labels.map(([symbol, name]) => {
    const item = data?.[symbol] || {};
    const change = Number(item.usd_24h_change || 0);
    const cls = change < 0 ? 'down' : '';
    const sign = change > 0 ? '+' : '';
    return `<article class="market-card"><div class="asset-label"><span>${symbol}</span> / ${name}</div><div class="asset-price">${item.usd ? '$' + formatPrice(item.usd) : 'нет данных'}</div><div class="asset-change ${cls}">${item.usd ? `${sign}${change.toFixed(2)}% за 24ч` : 'источник недоступен'}</div><span class="asset-time">PUBLIC DATA</span></article>`;
  }).join('');
}
async function loadMarket() {
  try { const response = await fetch('/api/market'); const payload = await response.json(); renderMarket(payload.data); }
  catch { renderMarket(null); }
}
function renderCompactNews(items = []) {
  $('#latestNewsList').innerHTML = items.slice(0, 3).map(item => `<div class="compact-news-item"><span class="news-bullet"></span><div><a href="${safeExternalUrl(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.title)}</a><small>${escapeHtml(item.source)} · ${formatDate(item.time)}</small></div></div>`).join('') || '<div class="loading-row">Пока нет новостей для показа.</div>';
}
function escapeHtml(text = '') { return text.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
function safeExternalUrl(value = '') {
  try {
    const url = new URL(value, window.location.origin);
    return ['http:', 'https:'].includes(url.protocol) ? escapeHtml(url.href) : '#';
  } catch {
    return '#';
  }
}
async function loadNews() {
  $('#newsStatus').textContent = 'Обновляю ленту...';
  const q = encodeURIComponent($('#newsSearch')?.value.trim() || '');
  const asset = encodeURIComponent($('#newsAsset')?.value || 'all');
  try {
    const response = await fetch(`/api/news?q=${q}&asset=${asset}`);
    const payload = await response.json(); state.news = payload.items || [];
    renderNews(state.news); renderCompactNews(state.news);
    $('#newsStatus').textContent = `${state.news.length} публикаций · обновлено ${formatDate(payload.updatedAt)}` + (payload.live ? '' : ' · fallback-режим');
  } catch {
    $('#newsStatus').textContent = 'Не удалось обновить ленту. Попробуй ещё раз.';
    $('#newsList').innerHTML = '<div class="empty-state"><strong>Источник временно недоступен</strong><p>Проверь соединение и повтори обновление.</p></div>';
  }
}
function renderNews(items) {
  $('#newsList').innerHTML = items.map(item => `<article class="news-row"><div class="news-source">${escapeHtml(item.source)}</div><div><h3><a href="${safeExternalUrl(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.title)}</a></h3><p>${formatDate(item.time)} · открывается на сайте источника</p></div><div class="news-tag">${escapeHtml(item.asset)}</div></article>`).join('') || '<div class="empty-state"><strong>Ничего не найдено</strong><p>Измени запрос или выбери другую тему.</p></div>';
}
function renderLessons() {
  const completed = readArray('cg-lessons'); state.lessons = completed;
  $('#lessonList').innerHTML = lessons.map((lesson, index) => { const done = completed.includes(lesson.id); return `<article class="lesson-card ${done ? 'done' : ''}"><div class="lesson-no">${String(index + 1).padStart(2, '0')}</div><div><h3>${lesson.title}</h3><p>${lesson.description}</p><small class="asset-label">${lesson.duration}</small></div><button data-lesson="${lesson.id}">${done ? 'Пройдено ✓' : 'Открыть урок'}</button><div class="lesson-body hidden" id="lesson-${lesson.id}"><p>${lesson.body}</p></div></article>`; }).join('');
  $$('#lessonList [data-lesson]').forEach(button => button.addEventListener('click', () => toggleLesson(button.dataset.lesson)));
  renderProgress();
}
function toggleLesson(id) {
  const lesson = lessons.find(item => item.id === id); if (!lesson) return;
  const completed = readArray('cg-lessons');
  const body = $(`#lesson-${id}`); const card = body.closest('.lesson-card');
  if (!body.classList.contains('hidden')) { body.classList.add('hidden'); return; }
  body.classList.remove('hidden');
  if (!completed.includes(id)) { completed.push(id); localStorage.setItem('cg-lessons', JSON.stringify(completed)); card.classList.add('done'); card.querySelector('button').textContent = 'Пройдено ✓'; renderProgress(); showToast('Урок отмечен как пройденный'); }
}
function renderProgress() {
  const completed = readArray('cg-lessons'); const count = completed.length;
  $('#progressCount').textContent = `${count} / ${lessons.length}`; $('#progressBar').style.width = `${(count / lessons.length) * 100}%`;
  const next = lessons.find(lesson => !completed.includes(lesson.id)) || lessons[lessons.length - 1];
  $('#nextLesson').innerHTML = `<div class="next-lesson"><div class="lesson-index">${String(lessons.indexOf(next) + 1).padStart(2, '0')}</div><div><strong>${count === lessons.length ? 'Маршрут завершён — повтори любой урок' : next.title}</strong><small>${next.duration} · ${count === lessons.length ? 'поддерживай практику' : 'следующий шаг'}</small></div></div>`;
}
function renderGlossary(query = '') {
  const normalized = query.trim().toLowerCase();
  const terms = glossary.filter(([term, definition, category]) => `${term} ${definition} ${category}`.toLowerCase().includes(normalized));
  $('#glossaryList').innerHTML = terms.map(([term, definition, category]) => `<article class="term-card"><h3>${term}</h3><p>${definition}</p><small>${category}</small></article>`).join('') || '<div class="empty-state"><strong>Термин не найден</strong><p>Попробуй более короткий запрос.</p></div>';
}
function calculateRisk() {
  const deposit = Math.max(0, Number($('#depositInput').value) || 0); const risk = Math.max(0, Number($('#riskPercentInput').value) || 0); const stop = Math.max(0.01, Number($('#stopPercentInput').value) || 0.01);
  const loss = deposit * risk / 100; const position = loss / (stop / 100); const stopRatio = deposit ? (loss / deposit * 100) : 0;
  $('#riskAmount').innerHTML = `${loss.toFixed(2)} <small>USDT</small>`; $('#positionAmount').textContent = `${position.toFixed(2)} USDT`; $('#stopRatio').textContent = `${stopRatio.toFixed(2)}%`;
}
function handleFile(file) {
  const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);
  if (!file || !allowedTypes.has(file.type)) { showToast('Выбери изображение PNG, JPG или WEBP'); return; }
  if (file.size > 8 * 1024 * 1024) { showToast('Файл слишком большой: максимум 8 MB'); return; }
  state.selectedImage = file; const reader = new FileReader();
  reader.onload = event => { state.imageData = event.target.result; $('#chartPreview').src = event.target.result; $('#fileName').textContent = file.name; $('#fileMeta').textContent = `${(file.size / 1024).toFixed(0)} KB · ${file.type.split('/')[1].toUpperCase()}`; $('#dropzone').classList.add('hidden'); $('#previewWrap').classList.remove('hidden'); };
  reader.readAsDataURL(file);
}
function removeImage() { state.selectedImage = null; state.imageData = null; $('#chartFile').value = ''; $('#dropzone').classList.remove('hidden'); $('#previewWrap').classList.add('hidden'); }
function selectedPair() { return $('#pairSelect').value === 'custom' ? ($('#pairCustom').value.trim() || 'CUSTOM/USDT') : $('#pairSelect').value; }
function renderVisionResult(result, mode = 'vision') {
  const detected = Array.isArray(result.detected) ? result.detected : [];
  const targets = Array.isArray(result.targets) ? result.targets : [];
  const risks = Array.isArray(result.risks) ? result.risks : [];
  const biasLabel = result.bias === 'long' ? 'ЛОНГ-СЦЕНАРИЙ' : result.bias === 'short' ? 'ШОРТ-СЦЕНАРИЙ' : 'НАБЛЮДЕНИЕ';
  const list = values => values.length ? values.map(item => `<li>${escapeHtml(String(item))}</li>`).join('') : '<li>Данных недостаточно — проверь график вручную.</li>';
  const html = `<div class="analysis-result"><div class="signal-card"><span class="signal-label">${mode === 'vision' ? 'AI VISION' : 'FALLBACK'} · ${escapeHtml(selectedPair())}</span><h3>${escapeHtml(result.scenario || 'Сценарий не подтверждён')}</h3><p>${escapeHtml(result.summary || 'Сначала собери больше контекста и не торопись с решением.')}</p></div><div class="analysis-grid"><div class="analysis-cell"><span>Смещение</span><strong>${biasLabel}</strong></div><div class="analysis-cell"><span>Уверенность</span><strong>${escapeHtml(result.confidence || 'low')}</strong></div><div class="analysis-cell"><span>Условие</span><strong>${escapeHtml(result.entryCondition || 'Нужно дополнительное подтверждение')}</strong></div><div class="analysis-cell"><span>Точка отмены</span><strong>${escapeHtml(result.invalidation || 'Определи до входа')}</strong></div></div><ul class="analysis-list"><li><strong>Что AI увидел:</strong><ul>${list(detected)}</ul></li><li><strong>Учебные цели:</strong><ul>${list(targets)}</ul></li><li><strong>Риски:</strong><ul>${list(risks)}</ul></li><li><strong>Вывод для обучения:</strong> ${escapeHtml(result.learningNote || 'Сравни гипотезу с графиком и новостями.')}</li></ul></div>`;
  $('#analysisEmpty').classList.add('hidden'); $('#analysisResult').innerHTML = html; $('#analysisResult').classList.remove('hidden'); $('#analysisStatus').textContent = mode === 'vision' ? 'AI ГОТОВ' : 'FALLBACK'; $('#analysisStatus').className = `status-badge ${mode === 'vision' ? 'ready' : 'wait'}`;
}
function fallbackAnalysis() {
  const price = Math.max(0, Number($('#priceInput').value) || 0); const direction = $('#directionInput').value; const buffer = price * .012; const stop = direction === 'short' ? price + buffer : price - buffer; const target = direction === 'short' ? price - buffer * 1.8 : price + buffer * 1.8;
  return { scenario: direction === 'long' ? 'Лонг только после подтверждения' : direction === 'short' ? 'Шорт только после подтверждения' : 'Наблюдение до появления сигнала', bias: direction, confidence: 'low', summary: 'AI временно недоступен. Этот fallback использует только введённые поля и не распознаёт изображение.', entryCondition: 'Проверь реакцию цены и объём на выбранном таймфрейме', invalidation: direction === 'short' ? `закрепление выше ${formatPrice(stop)}` : `закрепление ниже ${formatPrice(stop)}`, targets: [`учебный ориентир ${formatPrice(target)}`], detected: ['Содержимое скриншота не распознано в fallback-режиме'], risks: ['Один скриншот не показывает новости, ликвидность и funding'], learningNote: 'Не воспринимай fallback как сигнал.' };
}
async function analyzeChart() {
  if (!state.selectedImage || !state.imageData) { showToast('Сначала добавь скриншот графика'); return; }
  const pair = selectedPair(); const timeframe = $('#timeframeInput').value; const price = Math.max(0, Number($('#priceInput').value) || 0); const direction = $('#directionInput').value;
  $('#analyzeButton').disabled = true; $('#analyzeButton').innerHTML = 'AI читает график <span>…</span>'; $('#analysisStatus').textContent = 'АНАЛИЗ'; $('#analysisStatus').className = 'status-badge wait';
  try {
    const response = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageData: state.imageData, pair, timeframe, price, direction }) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'ai_unavailable');
    renderVisionResult(payload.result, payload.mode); showToast('AI Vision разобрал изображение');
  } catch { renderVisionResult(fallbackAnalysis(), 'fallback'); showToast('AI временно недоступен — показан учебный fallback'); }
  finally { $('#analyzeButton').disabled = false; $('#analyzeButton').innerHTML = 'Разобрать через AI Vision <span>→</span>'; }
  state.history.unshift({ pair, timeframe, direction, at: new Date().toISOString() }); state.history = state.history.slice(0, 6); localStorage.setItem('cg-history', JSON.stringify(state.history));
}
function readObjectArray(key) {
  try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; }
}
function paperPnl(trade) {
  const move = trade.side === 'long' ? trade.exit - trade.entry : trade.entry - trade.exit;
  const gross = trade.size * (move / trade.entry); const fee = trade.size * (trade.fee / 100) * 2;
  return gross - fee;
}
function renderPaper() {
  const trades = readObjectArray('cg-paper-trades'); const notes = readObjectArray('cg-journal'); const total = trades.reduce((sum, trade) => sum + paperPnl(trade), 0); const wins = trades.filter(trade => paperPnl(trade) > 0).length;
  $('#paperPnl').innerHTML = `${total.toFixed(2)} <small>USDT</small>`; $('#paperPnl').style.color = total >= 0 ? 'var(--teal)' : 'var(--red)'; $('#paperCount').textContent = trades.length; $('#paperWinRate').textContent = trades.length ? `${Math.round(wins / trades.length * 100)}%` : '0%';
  $('#paperHistory').innerHTML = trades.length ? trades.slice().reverse().slice(0, 10).map((trade, index) => { const pnl = paperPnl(trade); return `<div class="paper-row"><div><span>${escapeHtml(trade.pair)}</span><strong>${trade.side === 'long' ? 'Лонг' : 'Шорт'}</strong></div><div><span>Вход → выход</span><strong>${formatPrice(trade.entry)} → ${formatPrice(trade.exit)}</strong></div><div><span>Размер</span><strong>${trade.size.toFixed(2)} USDT</strong></div><div><span>PNL</span><strong class="${pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}">${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} USDT</strong></div><button class="text-button delete-paper" data-index="${trades.length - 1 - index}">Удалить</button></div>`; }).join('') : '<div class="paper-empty">Пока нет симуляций. Добавь первую сделку, чтобы увидеть PNL.</div>';
  $('#journalList').innerHTML = notes.length ? notes.slice().reverse().slice(0, 6).map(note => `<div class="journal-entry"><time>${formatDate(note.at)}</time>${escapeHtml(note.text)}</div>`).join('') : '<div class="paper-empty">Журнал пуст. Запиши, что ты увидел и чему научился.</div>';
  $$('.delete-paper').forEach(button => button.addEventListener('click', () => { const current = readObjectArray('cg-paper-trades'); current.splice(Number(button.dataset.index), 1); localStorage.setItem('cg-paper-trades', JSON.stringify(current)); renderPaper(); }));
}
function addPaperTrade() {
  const trade = { pair: $('#paperPair').value, side: $('#paperSide').value, entry: Math.max(0, Number($('#paperEntry').value) || 0), exit: Math.max(0, Number($('#paperExit').value) || 0), size: Math.max(0, Number($('#paperSize').value) || 0), fee: Math.max(0, Number($('#paperFee').value) || 0), at: new Date().toISOString() };
  if (!trade.entry || !trade.exit || !trade.size) { showToast('Заполни вход, выход и размер позиции'); return; }
  const trades = readObjectArray('cg-paper-trades'); trades.push(trade); localStorage.setItem('cg-paper-trades', JSON.stringify(trades)); renderPaper(); showToast('Paper-сделка добавлена в журнал');
}
function saveJournal() {
  const input = $('#journalInput'); const text = input.value.trim(); if (!text) { showToast('Сначала напиши заметку'); return; }
  const notes = readObjectArray('cg-journal'); notes.push({ text: text.slice(0, 1000), at: new Date().toISOString() }); localStorage.setItem('cg-journal', JSON.stringify(notes.slice(-30))); input.value = ''; renderPaper(); showToast('Заметка сохранена');
}
function initEvents() {
  $$('.nav-item').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
  $$('[data-go]').forEach(button => button.addEventListener('click', () => setView(button.dataset.go)));
  $('#refreshAll').addEventListener('click', () => { loadMarket(); loadNews(); showToast('Обновляю данные'); });
  $('#refreshNews').addEventListener('click', loadNews); $('#newsSearch').addEventListener('input', debounce(loadNews, 350)); $('#newsAsset').addEventListener('change', loadNews); setInterval(loadNews, 5 * 60 * 1000);
  $('#chartFile').addEventListener('change', event => handleFile(event.target.files[0])); $('#removeImage').addEventListener('click', removeImage); $('#analyzeButton').addEventListener('click', analyzeChart); $('#pairSelect').addEventListener('change', event => $('#pairCustom').classList.toggle('hidden', event.target.value !== 'custom'));
  const dropzone = $('#dropzone'); ['dragenter', 'dragover'].forEach(type => dropzone.addEventListener(type, event => { event.preventDefault(); dropzone.classList.add('drag'); })); ['dragleave', 'drop'].forEach(type => dropzone.addEventListener(type, event => { event.preventDefault(); dropzone.classList.remove('drag'); })); dropzone.addEventListener('drop', event => handleFile(event.dataTransfer.files[0]));
  $('#termSearch').addEventListener('input', event => renderGlossary(event.target.value)); ['depositInput', 'riskPercentInput', 'stopPercentInput'].forEach(id => $(`#${id}`).addEventListener('input', calculateRisk)); $('.close-notice').addEventListener('click', event => event.currentTarget.closest('.notice-card').remove());
  $('#addPaperTrade').addEventListener('click', addPaperTrade); $('#saveJournal').addEventListener('click', saveJournal); $('#clearPaper').addEventListener('click', () => { localStorage.removeItem('cg-paper-trades'); renderPaper(); showToast('Paper-история очищена'); });
}
function debounce(fn, delay) { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); }; }
function boot() {
  $('#heroDate').textContent = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date());
  initEvents(); renderLessons(); renderGlossary(); calculateRisk(); renderPaper(); loadMarket(); loadNews();
}
window.addEventListener('DOMContentLoaded', boot);
