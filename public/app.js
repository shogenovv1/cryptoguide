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
const state = { currentView: 'overview', news: [], selectedImage: null, imageData: null, lessons: [], history: readArray('cg-history'), lang: localStorage.getItem('cg-lang') || 'ru', theme: localStorage.getItem('cg-theme') || 'dark' };

const lessons = [
  { id: 'p2p', title: 'P2P: обмен без спешки', duration: '6 мин · база', description: 'Что происходит между покупателем и продавцом, как работает escrow и какие красные флаги нельзя игнорировать.', body: 'P2P — это сделка между пользователями через площадку. Проверяй имя получателя, не уходи в сторонние мессенджеры, не подтверждай оплату по скриншоту и не отпускай актив, пока деньги не видны в твоём банке.' },
  { id: 'spot', title: 'Спот: купить сам актив', duration: '8 мин · база', description: 'Разница между рыночным и лимитным ордером, комиссия и почему спот не равен «без риска».', body: 'На споте ты покупаешь или продаёшь сам актив без ликвидации от плеча. Но цена всё равно может двигаться против тебя. Лимитный ордер задаёт цену, рыночный — приоритет исполнения.' },
  { id: 'chart', title: 'График: читать, а не угадывать', duration: '10 мин · практика', description: 'Свечи, таймфрейм, тренд, поддержка и сопротивление как язык гипотез.', body: 'Сначала определи старший контекст, потом смотри структуру движения. Уровень — это зона интереса, а не магическая линия. Ищи реакцию цены и заранее решай, где сценарий отменяется.' },
  { id: 'futures', title: 'Фьючерсы: плечо под контролем', duration: '12 мин · осторожно', description: 'Лонг, шорт, маржа, funding и ликвидация — до первой реальной сделки.', body: 'Фьючерсы позволяют открыть позицию на движение цены, но плечо увеличивает скорость убытка. Ликвидация может наступить раньше, чем кажется. Сначала paper-trading, потом минимальный размер, а не наоборот.' },
  { id: 'risk', title: 'Риск: главный торговый навык', duration: '7 мин · фундамент', description: 'Как ограничить убыток, рассчитать позицию и почему «отыграться» — плохой план.', body: 'Определи допустимый убыток до входа. Размер позиции зависит от риска и расстояния до стопа, а не от желания заработать. Если сценарий нельзя описать цифрами, его нельзя нормально проверить.' },
  { id: 'orders', title: 'Ордера: как биржа исполняет заявку', duration: '9 мин · практика', description: 'Market, limit, stop и stop-limit: чем они отличаются на простом примере.', body: 'Market старается исполнить заявку сразу по доступной цене. Limit ждёт твою цену. Stop активирует заявку после заданного уровня. Перед отправкой проверь направление, размер, цену и комиссию.' },
  { id: 'security', title: 'Безопасность: не потерять аккаунт', duration: '8 мин · обязательно', description: '2FA, антифишинг, проверка адреса и правила, которые важнее любой стратегии.', body: 'Никому не отправляй пароль, коды 2FA и seed-фразу. Открывай Bybit только через официальный адрес, включи 2FA и антифишинговый код. Сначала сделай тестовый перевод на маленькую сумму.' },
  { id: 'plan', title: 'Торговый план: что делать до графика', duration: '10 мин · система', description: 'Как превратить эмоции в чек-лист: идея, вход, отмена, размер и разбор результата.', body: 'До графика запиши: какой рынок, какой сценарий, где подтверждение, где отмена и сколько ты рискуешь. После — отметь, следовал ли правилам. Хороший процесс важнее одной удачной сделки.' }
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
  ['Таймфрейм', 'Масштаб одной свечи: 15 минут, час, 4 часа и так далее.', 'график'],
  ['Поддержка', 'Зона, где раньше появлялся спрос. Цена не обязана от неё отскочить.', 'график'],
  ['Сопротивление', 'Зона, где раньше появлялось предложение. Это область, а не точная линия.', 'график'],
  ['Спред', 'Разница между лучшей ценой покупки и продажи. Это одна из скрытых издержек.', 'спот'],
  ['Проскальзывание', 'Разница между ожидаемой и фактической ценой исполнения заявки.', 'спот'],
  ['Изолированная маржа', 'Режим, где риск позиции ограничен выделенной для неё маржой.', 'фьючерсы'],
  ['Кросс-маржа', 'Режим, где для поддержания позиции может использоваться доступный баланс аккаунта.', 'фьючерсы'],
  ['Волатильность', 'Сила и скорость изменения цены. Чем она выше, тем шире возможный результат.', 'риск'],
  ['DCA', 'Постепенная покупка частями по плану. Это метод распределения входа, а не гарантия прибыли.', 'стратегия']
];
const lessonsEn = [
  { id: 'p2p', title: 'P2P: exchange without rushing', duration: '6 min · basics', description: 'What happens between buyer and seller, how escrow works and which red flags matter.', body: 'P2P is a deal between users through a platform. Check the recipient name, stay inside the platform, never trust a payment screenshot and release assets only after the money is visible in your bank.' },
  { id: 'spot', title: 'Spot: buying the asset', duration: '8 min · basics', description: 'Market versus limit orders, fees and why spot is not risk-free.', body: 'On spot you buy or sell the asset itself without futures leverage. Price can still move against you. A limit order sets a price; a market order prioritizes execution.' },
  { id: 'chart', title: 'Charts: read, do not guess', duration: '10 min · practice', description: 'Candles, timeframe, trend, support and resistance as a language of hypotheses.', body: 'Start with the higher-timeframe context, then study structure. A level is a zone of interest, not magic. Look for a reaction and decide where the scenario is invalid before entering.' },
  { id: 'futures', title: 'Futures: keep leverage under control', duration: '12 min · caution', description: 'Long, short, margin, funding and liquidation before your first real trade.', body: 'Futures let you trade a price move, but leverage speeds up losses. Liquidation may happen sooner than expected. Start with paper trading, then use a small size.' },
  { id: 'risk', title: 'Risk: the core trading skill', duration: '7 min · foundation', description: 'How to cap a loss, size a position and avoid revenge trading.', body: 'Define the acceptable loss before entry. Position size depends on risk and stop distance, not on the profit you want. If a scenario cannot be described with numbers, it cannot be checked well.' },
  { id: 'orders', title: 'Orders: how execution works', duration: '9 min · practice', description: 'Market, limit, stop and stop-limit explained with a simple example.', body: 'Market tries to execute now at available prices. Limit waits for your price. Stop activates after a chosen level. Before sending an order, check side, size, price and fees.' },
  { id: 'security', title: 'Security: protect the account', duration: '8 min · essential', description: '2FA, anti-phishing and address checks matter more than any strategy.', body: 'Never share your password, 2FA codes or seed phrase. Open Bybit through the official address, enable 2FA and an anti-phishing code. Make a small test transfer first.' },
  { id: 'plan', title: 'Trading plan: before the chart', duration: '10 min · system', description: 'Turn emotions into a checklist: idea, entry, invalidation, size and review.', body: 'Before the chart write: market, scenario, confirmation, invalidation and risk. Afterwards note whether you followed the rules. Process matters more than one lucky trade.' }
];
const glossaryEn = [
  ['Spot', 'Buying or selling the asset itself without a futures contract or leverage.', 'market'], ['P2P', 'A user-to-user trade through a platform. Safety depends on escrow rules and payment verification.', 'market'], ['Long', 'A scenario where a trader expects price to rise. It is not a guarantee.', 'futures'], ['Short', 'A scenario where a trader expects price to fall. Loss is possible if price rises.', 'futures'], ['Leverage', 'A multiplier of position size versus collateral. It increases potential profit and loss.', 'risk'], ['Margin', 'Collateral supporting a position. Rules depend on the specific contract.', 'futures'], ['Liquidation', 'Forced closing of a position when collateral is no longer enough to cover losses.', 'risk'], ['Funding rate', 'A periodic payment between sides of a perpetual futures contract.', 'futures'], ['Limit order', 'An order with a chosen price. It may not execute if the market never reaches it.', 'spot'], ['Market order', 'An order executed at available prices. Slippage can change the final price.', 'spot'], ['Stop-loss', 'A planned exit point if the scenario proves wrong.', 'risk'], ['Timeframe', 'The duration represented by one candle: 15 minutes, one hour, four hours and so on.', 'chart']
];
glossaryEn.push(['Support', 'A zone where demand appeared before. Price does not have to bounce from it.', 'chart'], ['Resistance', 'A zone where supply appeared before. It is an area, not an exact line.', 'chart'], ['Spread', 'The difference between the best buy and sell prices. It is a trading cost.', 'spot'], ['Slippage', 'The difference between expected and actual execution price.', 'spot'], ['Isolated margin', 'A mode where position risk is limited to its allocated margin.', 'futures'], ['Cross margin', 'A mode where available account balance may support the position.', 'futures'], ['Volatility', 'How strongly and quickly price changes. Higher volatility means a wider range of outcomes.', 'risk'], ['DCA', 'Buying in planned portions over time. It distributes entry; it does not guarantee profit.', 'strategy']);

const lessonDetails = {
  p2p: { easy: 'P2P — это не «перевод денег незнакомцу». Это обмен, где площадка временно удерживает криптовалюту, пока продавец и покупатель выполняют свои части сделки.', steps: ['Выбери объявление и проверь цену, лимиты и способ оплаты.', 'Сверь имя получателя с данными в объявлении. Не принимай оплату от третьего лица.', 'Плати только через указанный способ и нажми «Оплачено» только после реального перевода.', 'Проверь деньги в своём банковском приложении, а не по скриншоту, и только потом отпускай актив.'], example: 'Покупатель прислал картинку «перевод выполнен». В банке денег нет. Правильное действие — не отпускать криптовалюту и открыть спор внутри площадки.', mistakes: 'Уход в Telegram, доверие скриншоту, сделка вне escrow, спешка и отмена сделки после оплаты.', remember: 'Нет денег на счёте — нет подтверждённой оплаты.', quiz: 'Что делать, если контрагент просит перейти в мессенджер? Ответ: остаться в чате площадки или отменить сделку.' },
  spot: { easy: 'На споте ты покупаешь сам Bitcoin, Ethereum или другой актив. Если цена упала, биржа обычно не ликвидирует тебя автоматически, но стоимость твоих монет может уменьшиться.', steps: ['Выбери пару, например BTC/USDT. Первая часть — актив, вторая — чем платишь.', 'Реши, нужна ли тебе немедленная покупка. Для неё используют market, для цены — limit.', 'Укажи небольшой размер и заранее реши, где выйдешь при ошибке.', 'Проверь комиссию, итоговую сумму и только потом подтверждай ордер.'], example: 'BTC стоит 75 000 USDT. Лимитная покупка по 74 500 исполнится только если рынок дойдёт до этой цены. Она может остаться неисполненной.', mistakes: 'Путать спот с гарантией прибыли, покупать всем депозитом, забывать комиссию и усреднять падение без плана.', remember: 'Спот проще фьючерсов, но риск движения цены всё равно остаётся.', quiz: 'Какой ордер может не исполниться? Ответ: лимитный, если цена не дошла до него.' },
  chart: { easy: 'График — это не кристальный шар. Он показывает, что уже произошло. Мы используем его, чтобы придумать сценарий и заранее понять, где ошиблись.', steps: ['Начни со старшего таймфрейма: так виден общий фон.', 'Посмотри, растут ли вершины и впадины, падают или стоят в диапазоне.', 'Отметь зоны поддержки и сопротивления, а не одну идеальную линию.', 'Жди реакцию цены и объём, не входи только потому, что свеча красиво выглядит.', 'Запиши уровень отмены сценария до сделки.'], example: 'Цена подошла к прошлому максимуму. Это не автоматический шорт: дождись реакции, например отказа от роста или закрепления выше.', mistakes: 'Рисовать десятки линий, менять таймфрейм после входа, видеть паттерн только задним числом и игнорировать новости.', remember: 'Сначала контекст, потом уровень, потом подтверждение и только затем решение.', quiz: 'Уровень поддержки — это точная цена? Ответ: нет, это зона, где раньше появлялся спрос.' },
  futures: { easy: 'Фьючерсы позволяют заработать на росте или падении цены, но биржа использует залог. Плечо делает позицию крупнее твоих денег и поэтому ускоряет убыток.', steps: ['Пойми направление: long рассчитывает на рост, short — на падение.', 'Выбери isolated margin для учебной практики, чтобы ограничить залог одной позиции.', 'Поставь маленькое плечо или не используй его.', 'До входа запиши стоп, размер риска и уровень ликвидации.', 'Сначала потренируйся в paper-trading и не увеличивай позицию после убытка.'], example: 'У тебя 100 USDT и плечо 10x. Это не значит, что ты получил бесплатные 1 000 USDT: небольшое движение против позиции может быстро съесть залог.', mistakes: 'Использовать максимальное плечо, переносить стоп, усреднять убыточную позицию и путать ликвидацию со стоп-лоссом.', remember: 'Плечо не делает прогноз точнее — оно только увеличивает размер результата.', quiz: 'Что происходит с риском при росте плеча? Ответ: он растёт, а запас до ликвидации обычно уменьшается.' },
  risk: { easy: 'Риск — это заранее выбранная сумма, которую ты согласен потерять, если идея окажется неверной. Это не наказание, а ремень безопасности.', steps: ['Определи депозит и допустимый риск, например 1% = 10 USDT при депозите 1 000 USDT.', 'Поставь стоп там, где идея действительно ломается.', 'Посчитай размер позиции: допустимый убыток раздели на расстояние до стопа.', 'Проверь комиссию и возможное проскальзывание.', 'После сделки запиши результат и не увеличивай риск из-за эмоций.'], example: 'Депозит 1 000 USDT, риск 1% = 10 USDT. Если до стопа 2 USDT на монету, размер позиции — около 5 монет до учёта комиссии.', mistakes: 'Ставить стоп случайно, рисковать всем депозитом, переносить стоп дальше и пытаться отыграть убыток.', remember: 'Сначала реши, сколько можешь потерять. Потом считай размер сделки.', quiz: 'От чего зависит размер позиции? Ответ: от допустимого убытка и расстояния до стопа.' },
  orders: { easy: 'Ордер — это инструкция бирже. Ты должен понимать, когда она сработает и какую цену можешь получить.', steps: ['Market исполняется быстро, но итоговая цена может отличаться.', 'Limit ждёт указанную цену и может не исполниться.', 'Stop срабатывает после триггерного уровня.', 'Перед отправкой проверь Buy/Sell, количество, цену и тип маржи.', 'После отправки проверь статус ордера и не создавай дубликат.'], example: 'Ты хочешь купить только по 74 500. Limit сохранит это ограничение, а market может купить по 74 500, 74 520 и выше при резком движении.', mistakes: 'Нажать Buy вместо Sell, перепутать количество и сумму, не проверить нули и использовать market на тонком рынке.', remember: 'Быстрое исполнение и точная цена — разные цели.', quiz: 'Какой ордер приоритетно ищет исполнение сейчас? Ответ: market.' },
  security: { easy: 'Самая прибыльная стратегия бесполезна, если кто-то украл доступ к аккаунту. Безопасность начинается не с настроек биржи, а с твоей внимательности.', steps: ['Включи 2FA в приложении-аутентификаторе и сохрани резервный способ безопасно.', 'Используй уникальный пароль и менеджер паролей.', 'Проверяй адрес сайта и не открывай ссылки из случайных сообщений.', 'Создай антифишинговый код и никому не сообщай коды входа.', 'Для вывода сначала сделай тестовую транзакцию на маленькую сумму.'], example: 'Сообщение «служба поддержки» просит код 2FA. Это мошенничество: настоящая поддержка не должна просить одноразовый код.', mistakes: 'Хранить seed-фразу в облаке, отправлять коды, ставить неизвестные расширения и доверять обещанию гарантированной прибыли.', remember: 'Пароль, код 2FA и seed-фраза — это ключи. Никому их не отправляй.', quiz: 'Можно ли сообщить код 2FA сотруднику поддержки? Ответ: нет.' },
  plan: { easy: 'Торговый план — это короткая инструкция самому себе до того, как эмоции начнут кричать «входи сейчас».', steps: ['Опиши рынок и направление: что именно ты наблюдаешь?', 'Назови условие входа простыми словами.', 'Запиши уровень отмены и допустимый убыток.', 'Определи размер позиции и цель только после расчёта риска.', 'После сделки ответь: следовал ли ты плану и что улучшить?'], example: 'План: «Если BTC удержит поддержку на 74 500 и объём подтвердит реакцию, рассматриваю небольшой long. Ниже 73 900 идея отменяется. Риск 10 USDT».', mistakes: 'Входить без условия, менять план после входа, считать только прибыль и вести журнал только удачных сделок.', remember: 'Хорошая сделка — та, где ты выполнил процесс, даже если результат оказался отрицательным.', quiz: 'Когда нужно определить стоп и риск? Ответ: до входа, а не после движения против тебя.' }
};

const lessonDetailsEn = {
  p2p: { easy: 'P2P is not “send money to a stranger”. The platform holds the crypto while both sides complete their part.', steps: ['Check the ad, limits and payment method.', 'Match the recipient name and never accept third-party payment.', 'Pay only through the listed method.', 'Verify money in your bank, not by screenshot, before releasing crypto.'], example: 'A buyer sends a payment screenshot, but no money arrived. Do not release the crypto; use the platform dispute flow.', mistakes: 'Moving to Telegram, trusting screenshots, trading outside escrow and rushing.', remember: 'No money in your account means no confirmed payment.', quiz: 'What if the counterparty asks to move to a messenger? Stay on-platform or cancel.' },
  spot: { easy: 'On spot you buy the actual asset. There is usually no futures liquidation, but the asset price can still fall.', steps: ['Choose a pair such as BTC/USDT.', 'Use market for speed or limit to set a price.', 'Use a small size and define an exit plan.', 'Check fees and the final amount before confirming.'], example: 'A limit buy at 74,500 executes only if the market reaches that price.', mistakes: 'Treating spot as risk-free, using the whole account and forgetting fees.', remember: 'Spot is simpler than futures, not risk-free.', quiz: 'Which order may not execute? A limit order.' },
  chart: { easy: 'A chart is not a crystal ball. It shows what happened and helps us build a scenario with an invalidation point.', steps: ['Start with the higher timeframe.', 'Read whether highs and lows rise, fall or range.', 'Mark zones, not magic lines.', 'Wait for price reaction and volume.', 'Write invalidation before entry.'], example: 'A previous high is not an automatic short. Wait for rejection or a clean break and retest.', mistakes: 'Drawing too many lines, changing timeframe after entry and ignoring news.', remember: 'Context, level, confirmation, then a decision.', quiz: 'Is support an exact price? No, it is a zone.' },
  futures: { easy: 'Futures let you trade up or down, using collateral. Leverage makes losses faster.', steps: ['Understand long and short.', 'Use isolated margin for practice.', 'Keep leverage small.', 'Write stop, risk and liquidation level first.', 'Practice on paper before real money.'], example: 'With 100 USDT and 10x leverage, you did not receive free money; a small move can consume the collateral.', mistakes: 'Maximum leverage, moving stops and averaging a losing position.', remember: 'Leverage changes size, not prediction quality.', quiz: 'What happens when leverage rises? Risk rises and the liquidation buffer usually shrinks.' },
  risk: { easy: 'Risk is the amount you accept losing if the idea is wrong. It is a seat belt, not a punishment.', steps: ['Choose a fixed percentage.', 'Put the stop where the idea breaks.', 'Size the position from risk and stop distance.', 'Include fees and slippage.', 'Review without revenge trading.'], example: 'A 1,000 USDT account with 1% risk allows about 10 USDT loss before fees.', mistakes: 'Random stops, all-in positions and moving the stop farther.', remember: 'Choose loss first; calculate size second.', quiz: 'What sets position size? Allowed loss and stop distance.' },
  orders: { easy: 'An order is an instruction to the exchange. Know when it triggers and what price you may receive.', steps: ['Market prioritizes execution.', 'Limit waits for your price.', 'Stop activates after a trigger level.', 'Check side, size, price and margin.', 'Review status after sending.'], example: 'A limit buy at 74,500 protects price; market may fill at several available prices.', mistakes: 'Wrong side, wrong size, extra zeros and market orders in a thin market.', remember: 'Fast execution and exact price are different goals.', quiz: 'Which order prioritizes immediate execution? Market.' },
  security: { easy: 'A profitable strategy is useless if someone steals your account. Security starts with attention.', steps: ['Enable authenticator 2FA.', 'Use a unique password.', 'Check the official domain.', 'Never share codes or seed phrases.', 'Test withdrawals with a small amount.'], example: 'A fake support agent asking for a 2FA code is a scam.', mistakes: 'Cloud seed phrases, shared codes and unknown extensions.', remember: 'Passwords, 2FA codes and seed phrases are keys.', quiz: 'Should support receive your 2FA code? Never.' },
  plan: { easy: 'A trading plan is an instruction to yourself before emotions take over.', steps: ['Name the market and direction.', 'Write the entry condition.', 'Write invalidation and risk.', 'Calculate size before a target.', 'Review whether you followed the rules.'], example: 'If BTC holds 74,500 with confirmation, consider a small long; below 73,900 the idea is invalid.', mistakes: 'Entering without conditions and changing the plan after entry.', remember: 'Process matters more than one lucky result.', quiz: 'When define risk? Before entry.' }
};

function formatPrice(value) {
  if (!value) return 'нет данных';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: value > 100 ? 0 : 2 }).format(value);
}
function formatDate(value, short = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'время неизвестно';
  return new Intl.DateTimeFormat(state.lang === 'en' ? 'en-US' : 'ru-RU', short ? { day: '2-digit', month: 'short' } : { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
}
function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message; toast.classList.add('show');
  clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 2800);
}
function applyLanguage() {
  const en = state.lang === 'en';
  document.documentElement.lang = state.lang;
  document.documentElement.dataset.theme = state.theme;
  $('#langToggle').textContent = en ? 'RU' : 'EN';
  $('#themeToggle').textContent = state.theme === 'dark' ? '☼' : '●';
  const nav = { overview: en ? 'Overview' : 'Обзор', analyzer: en ? 'Chart analysis' : 'Разбор графика', news: en ? 'News' : 'Новости', learning: en ? 'Learning' : 'Учёба', glossary: en ? 'Glossary' : 'Термины', paper: 'Paper PNL', risk: en ? 'Risk' : 'Риск' };
  $$('.nav-item').forEach(button => { const label = button.querySelector('span:nth-child(2)'); if (label) label.textContent = nav[button.dataset.view] || label.textContent; });
  const copy = en ? {
    '.mode-pill span': 'Bybit learning mode', '#view-overview .hero-block .eyebrow': 'MARKET VIEW <span class="teal-line"></span>', '#view-overview h1': 'Understand<br /><em>the context.</em>', '#view-overview .hero-copy': 'Learn to see the market as a whole: chart, news and risk in one calm workspace.', '#view-overview .text-button': 'Start analysis <span>↗</span>', '#view-overview .notice-card strong': 'This is a learning assistant, not a trading bot', '#view-overview .notice-card p': 'A screenshot shows only part of the picture. CryptoGuide shows scenarios and risk, but never guarantees results or places orders.', '#view-overview .section-heading h2': 'Key assets', '#view-overview .section-heading .ghost-button': 'View news <span>→</span>', '#view-overview .learning-progress h2': 'Step-by-step learning', '#view-overview .latest-news h2': 'Latest signals', '#view-overview .learning-progress .primary-button': 'Continue learning <span>→</span>', '#view-overview .latest-news .ghost-button': 'All news <span>→</span>', '#view-analyzer h1': 'Let’s look<br /><em>together.</em>', '#view-analyzer .page-intro-note': 'Upload a Bybit screenshot.<br />The MVP uses it as context, not as a price prediction.', '#analyzeButton': 'Analyze with AI Vision <span>→</span>', '#view-news h1': 'News without<br /><em>noise.</em>', '#view-news .page-intro-note': 'Fresh posts<br />from open RSS sources.', '#refreshNews': '↻ Refresh', '#view-glossary h1': 'Words<br /><em>that matter.</em>', '#view-paper h1': 'Practice<br /><em>without money.</em>', '#view-risk h1': 'Risk is<br /><em>the return.</em>'
  } : {
    '.mode-pill span': 'Bybit учебный режим', '#view-overview .hero-block .eyebrow': 'ПАНЕЛЬ НАБЛЮДЕНИЯ <span class="teal-line"></span>', '#view-overview h1': 'Сначала поймём<br /><em>контекст.</em>', '#view-overview .hero-copy': 'Учись видеть рынок целиком: график, новости и риск в одном спокойном пространстве.', '#view-overview .text-button': 'Начать разбор <span>↗</span>', '#view-overview .notice-card strong': 'Это учебный помощник, не торговый робот', '#view-overview .notice-card p': 'Скриншот даёт только часть картины. CryptoGuide показывает сценарии, вопросы для проверки и риск — но не гарантирует результат и не размещает ордера.', '#view-overview .section-heading h2': 'Ключевые активы', '#view-overview .section-heading .ghost-button': 'Смотреть новости <span>→</span>', '#view-overview .learning-progress h2': 'Обучение по шагам', '#view-overview .latest-news h2': 'Последние сигналы', '#view-overview .learning-progress .primary-button': 'Продолжить обучение <span>→</span>', '#view-overview .latest-news .ghost-button': 'Все новости <span>→</span>', '#view-analyzer h1': 'Посмотрим<br /><em>вместе.</em>', '#view-analyzer .page-intro-note': 'Загрузи скриншот с Bybit.<br />MVP использует его как контекст, а не как vision-прогноз.', '#analyzeButton': 'Разобрать через AI Vision <span>→</span>', '#view-news h1': 'Новости без<br /><em>шума.</em>', '#view-news .page-intro-note': 'Актуальные публикации<br />из открытых RSS-источников.', '#refreshNews': '↻ Обновить', '#view-glossary h1': 'Слова,<br /><em>которые важны.</em>', '#view-paper h1': 'Практика<br /><em>без денег.</em>', '#view-risk h1': 'Риск — это<br /><em>доходность.</em>'
  };
  Object.entries(copy).forEach(([selector, value]) => { const element = $(selector); if (element) element.innerHTML = value; });
  const staticCopy = en ? {
    '.sidebar-note .eyebrow': 'PRINCIPLE #01', '.sidebar-note p': 'Context first. Then a scenario. A trade only after risk is calculated.', '.sidebar-footer': '<span class="status-dot"></span> Data refreshes on request', '#view-overview .hero-action .mini-label': 'TODAY', '#view-overview .learning-progress .eyebrow': 'YOUR ROUTE', '#view-overview .latest-news .eyebrow': 'FROM THE FEED', '#view-news .news-meta span:last-child': 'Auto-refresh: every 5 minutes', '#view-news .source-directory .eyebrow': 'SOURCE DIRECTORY', '#view-news .source-directory h2': 'Where to verify news', '#view-news .source-directory .step-tag': 'open sources', '#view-learning .page-intro-note': 'Full mini-lessons<br />with examples and checks.', '#view-glossary .page-intro-note': 'Search a term — get<br />meaning and practical risk.', '#view-paper .page-intro-note': 'Record simulated trades,<br />review PNL and learn from notes.', '#view-risk .page-intro-note': 'First define the risk.<br />Then calculate position size.', '.app-footer span:first-child': 'CRYPTOGUIDE / learning tool', '.app-footer span:last-child': 'Not financial advice · 2026'
  } : {
    '.sidebar-note .eyebrow': 'ПРИНЦИП №01', '.sidebar-note p': 'Сначала контекст. Потом сценарий. Сделка — только после расчёта риска.', '.sidebar-footer': '<span class="status-dot"></span> Данные обновляются при запросе', '#view-overview .hero-action .mini-label': 'СЕГОДНЯ', '#view-overview .learning-progress .eyebrow': 'ТВОЙ МАРШРУТ', '#view-overview .latest-news .eyebrow': 'ИЗ ЛЕНТЫ', '#view-news .news-meta span:last-child': 'Автообновление: каждые 5 минут', '#view-news .source-directory .eyebrow': 'SOURCE DIRECTORY', '#view-news .source-directory h2': 'Где проверять новости', '#view-news .source-directory .step-tag': 'открытые источники', '#view-learning .page-intro-note': 'Полные мини-уроки<br />с примерами и проверкой.', '#view-glossary .page-intro-note': 'Ищи термин — получай<br />смысл и практический риск.', '#view-paper .page-intro-note': 'Записывай симулированные сделки,<br />смотри PNL и учись на журнале.', '#view-risk .page-intro-note': 'Сначала размер риска.<br />Потом размер позиции.', '.app-footer span:first-child': 'CRYPTOGUIDE / учебный инструмент', '.app-footer span:last-child': 'Не финансовая рекомендация · 2026'
  };
  Object.entries(staticCopy).forEach(([selector, value]) => { const element = $(selector); if (element) element.innerHTML = value; });
  if ($('#view-learning h1')) $('#view-learning h1').innerHTML = en ? 'Eight steps<br /><em>to clarity.</em>' : 'Восемь шагов<br /><em>к ясности.</em>';
  if ($('#view-learning .eyebrow')) $('#view-learning .eyebrow').textContent = en ? 'PROGRAM / 04' : 'ПРОГРАММА / 04';
  document.title = en ? 'CryptoGuide — learning curator' : 'CryptoGuide — учебный куратор';
  if ($('#newsSearch')) $('#newsSearch').placeholder = en ? 'Search by title or asset...' : 'Искать по заголовку или активу...';
  if ($('#termSearch')) $('#termSearch').placeholder = en ? 'For example: margin, funding, limit order...' : 'Например: маржа, funding, лимитный ордер...';
  renderLessons(); renderGlossary($('#termSearch')?.value || '');
  const label = $(`.nav-item[data-view="${state.currentView}"] span:nth-child(2)`)?.textContent || (en ? 'Overview' : 'Обзор'); $('#crumbLabel').textContent = label.toUpperCase();
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
    return `<article class="market-card"><div class="asset-label"><span>${symbol}</span> / ${name}</div><div class="asset-price">${item.usd ? '$' + formatPrice(item.usd) : (state.lang === 'en' ? 'no data' : 'нет данных')}</div><div class="asset-change ${cls}">${item.usd ? `${sign}${change.toFixed(2)}% ${state.lang === 'en' ? '24h' : 'за 24ч'}` : (state.lang === 'en' ? 'source unavailable' : 'источник недоступен')}</div><span class="asset-time">PUBLIC DATA</span></article>`;
  }).join('');
}
async function loadMarket() {
  try { const response = await fetch('/api/market'); const payload = await response.json(); renderMarket(payload.data); }
  catch { renderMarket(null); }
}
function renderCompactNews(items = []) {
  $('#latestNewsList').innerHTML = items.slice(0, 3).map(item => `<div class="compact-news-item"><span class="news-bullet"></span><div><a href="${safeExternalUrl(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.title)}</a><small>${escapeHtml(item.source)} · ${formatDate(item.time)}</small></div></div>`).join('') || `<div class="loading-row">${state.lang === 'en' ? 'No news to show yet.' : 'Пока нет новостей для показа.'}</div>`;
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
  $('#newsStatus').textContent = state.lang === 'en' ? 'Refreshing feed...' : 'Обновляю ленту...';
  const q = encodeURIComponent($('#newsSearch')?.value.trim() || '');
  const asset = encodeURIComponent($('#newsAsset')?.value || 'all');
  try {
    const response = await fetch(`/api/news?q=${q}&asset=${asset}&lang=${state.lang}`);
    const payload = await response.json(); state.news = payload.items || [];
    renderNews(state.news); renderCompactNews(state.news);
    $('#newsStatus').textContent = state.lang === 'en' ? `${state.news.length} posts · updated ${formatDate(payload.updatedAt)}` + (payload.live ? '' : ' · fallback mode') : `${state.news.length} публикаций · обновлено ${formatDate(payload.updatedAt)}` + (payload.live ? '' : ' · fallback-режим');
  } catch {
    $('#newsStatus').textContent = state.lang === 'en' ? 'Could not refresh the feed. Try again.' : 'Не удалось обновить ленту. Попробуй ещё раз.';
    $('#newsList').innerHTML = `<div class="empty-state"><strong>${state.lang === 'en' ? 'Source temporarily unavailable' : 'Источник временно недоступен'}</strong><p>${state.lang === 'en' ? 'Check the connection and refresh.' : 'Проверь соединение и повтори обновление.'}</p></div>`;
  }
}
function renderNews(items) {
  $('#newsList').innerHTML = items.map(item => { const translation = state.lang === 'ru' ? `Оригинал: ${item.titleOriginal || item.title}` : `Русский перевод: ${item.titleRu || item.title}`; return `<article class="news-row"><div class="news-source">${escapeHtml(item.source)}</div><div><h3><a href="${safeExternalUrl(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.title)}</a></h3><p class="news-translation">${escapeHtml(translation)}</p><p>${formatDate(item.time)} · ${state.lang === 'en' ? 'open source website' : 'открывается на сайте источника'}</p></div><div class="news-tag">${escapeHtml(item.asset)}</div></article>`; }).join('') || `<div class="empty-state"><strong>${state.lang === 'en' ? 'Nothing found' : 'Ничего не найдено'}</strong><p>${state.lang === 'en' ? 'Change the query or topic.' : 'Измени запрос или выбери другую тему.'}</p></div>`;
}
function renderLessons() {
  const completed = readArray('cg-lessons'); state.lessons = completed;
  const catalog = state.lang === 'en' ? lessonsEn : lessons;
  const detailsCatalog = state.lang === 'en' ? lessonDetailsEn : lessonDetails;
  const labels = state.lang === 'en' ? { easy: 'In simple words', steps: 'Step by step', example: 'Simple example', mistakes: 'Beginner mistakes', remember: 'Remember', quiz: 'Check yourself', open: 'Open lesson', done: 'Completed ✓' } : { easy: 'Простыми словами', steps: 'По шагам', example: 'Простой пример', mistakes: 'Ошибки новичка', remember: 'Запомни', quiz: 'Проверь себя', open: 'Открыть урок', done: 'Пройдено ✓' };
  $('#lessonList').innerHTML = catalog.map((lesson, index) => {
    const done = completed.includes(lesson.id); const detail = detailsCatalog[lesson.id] || { easy: lesson.body, steps: [], example: '', mistakes: '', remember: '', quiz: '' };
    return `<article class="lesson-card ${done ? 'done' : ''}"><div class="lesson-no">${String(index + 1).padStart(2, '0')}</div><div><h3>${lesson.title}</h3><p>${lesson.description}</p><small class="asset-label">${lesson.duration}</small></div><button data-lesson="${lesson.id}">${done ? labels.done : labels.open}</button><div class="lesson-body hidden" id="lesson-${lesson.id}"><div class="lesson-lead"><strong>${labels.easy}:</strong> ${detail.easy}</div><div class="lesson-grid"><div><h4>${labels.steps}</h4><ol>${detail.steps.map(step => `<li>${step}</li>`).join('')}</ol></div><div><h4>${labels.example}</h4><p>${detail.example}</p></div><div><h4>${labels.mistakes}</h4><p>${detail.mistakes}</p></div></div><div class="lesson-takeaway"><strong>${labels.remember}:</strong> ${detail.remember}</div><details class="lesson-quiz"><summary>${labels.quiz}</summary><p>${detail.quiz}</p></details></div></article>`;
  }).join('');
  $$('#lessonList [data-lesson]').forEach(button => button.addEventListener('click', () => toggleLesson(button.dataset.lesson)));
  renderProgress();
}
function toggleLesson(id) {
  const lesson = lessons.find(item => item.id === id); if (!lesson) return;
  const completed = readArray('cg-lessons');
  const body = $(`#lesson-${id}`); const card = body.closest('.lesson-card');
  if (!body.classList.contains('hidden')) { body.classList.add('hidden'); return; }
  body.classList.remove('hidden');
  if (!completed.includes(id)) { completed.push(id); localStorage.setItem('cg-lessons', JSON.stringify(completed)); card.classList.add('done'); card.querySelector('button').textContent = state.lang === 'en' ? 'Completed ✓' : 'Пройдено ✓'; renderProgress(); showToast(state.lang === 'en' ? 'Lesson marked complete' : 'Урок отмечен как пройденный'); }
}
function renderProgress() {
  const completed = readArray('cg-lessons'); const count = completed.length;
  const catalog = state.lang === 'en' ? lessonsEn : lessons;
  $('#progressCount').textContent = `${count} / ${catalog.length}`; $('#progressBar').style.width = `${(count / catalog.length) * 100}%`;
  const next = catalog.find(lesson => !completed.includes(lesson.id)) || catalog[catalog.length - 1];
  $('#nextLesson').innerHTML = `<div class="next-lesson"><div class="lesson-index">${String(catalog.indexOf(next) + 1).padStart(2, '0')}</div><div><strong>${count === catalog.length ? (state.lang === 'en' ? 'Route complete — revisit any lesson' : 'Маршрут завершён — повтори любой урок') : next.title}</strong><small>${next.duration} · ${count === catalog.length ? (state.lang === 'en' ? 'keep practising' : 'поддерживай практику') : (state.lang === 'en' ? 'next step' : 'следующий шаг')}</small></div></div>`;
}
function renderGlossary(query = '') {
  const normalized = query.trim().toLowerCase();
  const catalog = state.lang === 'en' ? glossaryEn : glossary;
  const terms = catalog.filter(([term, definition, category]) => `${term} ${definition} ${category}`.toLowerCase().includes(normalized));
  $('#glossaryList').innerHTML = terms.map(([term, definition, category]) => `<article class="term-card"><h3>${term}</h3><p>${definition}</p><small>${category}</small></article>`).join('') || `<div class="empty-state"><strong>${state.lang === 'en' ? 'Term not found' : 'Термин не найден'}</strong><p>${state.lang === 'en' ? 'Try a shorter query.' : 'Попробуй более короткий запрос.'}</p></div>`;
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
  $('#langToggle').addEventListener('click', () => { state.lang = state.lang === 'ru' ? 'en' : 'ru'; localStorage.setItem('cg-lang', state.lang); applyLanguage(); loadNews(); showToast(state.lang === 'en' ? 'English interface enabled' : 'Русский интерфейс включён'); });
  $('#themeToggle').addEventListener('click', () => { state.theme = state.theme === 'dark' ? 'light' : 'dark'; localStorage.setItem('cg-theme', state.theme); applyLanguage(); showToast(state.theme === 'light' ? 'Светлая тема включена' : 'Тёмная тема включена'); });
}
function debounce(fn, delay) { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); }; }
function boot() {
  $('#heroDate').textContent = new Intl.DateTimeFormat(state.lang === 'en' ? 'en-US' : 'ru-RU', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date());
  initEvents(); applyLanguage(); calculateRisk(); renderPaper(); loadMarket(); loadNews();
}
window.addEventListener('DOMContentLoaded', boot);
