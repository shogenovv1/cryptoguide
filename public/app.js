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
  reader.onload = event => { $('#chartPreview').src = event.target.result; $('#fileName').textContent = file.name; $('#fileMeta').textContent = `${(file.size / 1024).toFixed(0)} KB · ${file.type.split('/')[1].toUpperCase()}`; $('#dropzone').classList.add('hidden'); $('#previewWrap').classList.remove('hidden'); };
  reader.readAsDataURL(file);
}
function removeImage() { state.selectedImage = null; $('#chartFile').value = ''; $('#dropzone').classList.remove('hidden'); $('#previewWrap').classList.add('hidden'); }
function analyzeChart() {
  if (!state.selectedImage) { showToast('Сначала добавь скриншот графика'); return; }
  const pair = ($('#pairInput').value.trim() || 'BTC/USDT').toUpperCase(); const safePair = escapeHtml(pair); const timeframe = $('#timeframeInput').value; const price = Math.max(0, Number($('#priceInput').value) || 0); const direction = $('#directionInput').value;
  const buffer = price * .012; const stop = direction === 'short' ? price + buffer : price - buffer; const target = direction === 'short' ? price - buffer * 1.8 : price + buffer * 1.8;
  const scenario = direction === 'long' ? 'Лонг только после подтверждения' : direction === 'short' ? 'Шорт только после подтверждения' : 'Наблюдение до появления сигнала';
  const condition = direction === 'long' ? `цена удерживается выше ${formatPrice(price)} и формирует подтверждение на ${timeframe}` : direction === 'short' ? `цена не возвращается выше ${formatPrice(price)} и показывает слабость на ${timeframe}` : `появляется понятная реакция на уровень ${formatPrice(price)} с объёмом или структурой движения`;
  const invalidation = direction === 'short' ? `закрепление выше ${formatPrice(stop)}` : `закрепление ниже ${formatPrice(stop)}`;
  const action = direction === 'neutral' ? 'Сейчас полезнее наблюдать и собрать подтверждения.' : 'Не входить по одному скриншоту; сначала проверить условие сценария.';
  const result = `<div class="analysis-result"><div class="signal-card"><span class="signal-label">УЧЕБНЫЙ СЦЕНАРИЙ · ${safePair}</span><h3>${scenario}</h3><p>${action} Сценарий построен по введённой цене и контексту, а не является предсказанием рынка.</p></div><div class="analysis-grid"><div class="analysis-cell"><span>Условие</span><strong>${condition}</strong></div><div class="analysis-cell"><span>Точка отмены</span><strong>${invalidation}</strong></div><div class="analysis-cell"><span>Учебная цель</span><strong>${formatPrice(target)}</strong></div><div class="analysis-cell"><span>Уровень риска</span><strong>умеренный / проверь сам</strong></div></div><ul class="analysis-list"><li><strong>Что проверить:</strong> старший таймфрейм, ближайшие уровни, объём и новости по ${escapeHtml(pair.split('/')[0])}.</li><li><strong>Почему не спешить:</strong> скриншот не показывает ликвидность, funding, комиссию и внезапные события.</li><li><strong>Дисциплина:</strong> если условие не выполнено, сценарий пропускается — это нормальный результат.</li></ul></div>`;
  $('#analysisEmpty').classList.add('hidden'); $('#analysisResult').innerHTML = result; $('#analysisResult').classList.remove('hidden'); $('#analysisStatus').textContent = 'ГОТОВО'; $('#analysisStatus').className = 'status-badge ready';
  state.history.unshift({ pair, timeframe, direction, at: new Date().toISOString() }); state.history = state.history.slice(0, 6); localStorage.setItem('cg-history', JSON.stringify(state.history)); showToast('Учебный сценарий готов');
}
function initEvents() {
  $$('.nav-item').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
  $$('[data-go]').forEach(button => button.addEventListener('click', () => setView(button.dataset.go)));
  $('#refreshAll').addEventListener('click', () => { loadMarket(); loadNews(); showToast('Обновляю данные'); });
  $('#refreshNews').addEventListener('click', loadNews); $('#newsSearch').addEventListener('input', debounce(loadNews, 350)); $('#newsAsset').addEventListener('change', loadNews);
  $('#chartFile').addEventListener('change', event => handleFile(event.target.files[0])); $('#removeImage').addEventListener('click', removeImage); $('#analyzeButton').addEventListener('click', analyzeChart);
  const dropzone = $('#dropzone'); ['dragenter', 'dragover'].forEach(type => dropzone.addEventListener(type, event => { event.preventDefault(); dropzone.classList.add('drag'); })); ['dragleave', 'drop'].forEach(type => dropzone.addEventListener(type, event => { event.preventDefault(); dropzone.classList.remove('drag'); })); dropzone.addEventListener('drop', event => handleFile(event.dataTransfer.files[0]));
  $('#termSearch').addEventListener('input', event => renderGlossary(event.target.value)); ['depositInput', 'riskPercentInput', 'stopPercentInput'].forEach(id => $(`#${id}`).addEventListener('input', calculateRisk)); $('.close-notice').addEventListener('click', event => event.currentTarget.closest('.notice-card').remove());
}
function debounce(fn, delay) { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); }; }
function boot() {
  $('#heroDate').textContent = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date());
  initEvents(); renderLessons(); renderGlossary(); calculateRisk(); loadMarket(); loadNews();
}
window.addEventListener('DOMContentLoaded', boot);
