import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync } from 'node:fs';
import { dirname } from 'node:path';
import { routes, homePhotos } from './content.mjs';

const manifest = readFileSync('photo-data/manifest.csv', 'utf8');
const sizes = Object.fromEntries(manifest.split(/\r?\n/).flatMap(line => {
  const path = line.match(/(?:^|,)([\w/-]+\.webp),/)?.[1];
  const dims = [...line.matchAll(/(\d+)×(\d+)/g)].at(-1);
  return path && dims ? [[path, dims.slice(1)]] : [];
}));
const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const domain = (process.env.SITE_DOMAIN || (productionHost ? 'https://' + productionHost : '[DOMAIN]')).replace(/\/$/, '');
const pages = { home: '', east: 'east/', west: 'west/', privacy: 'privacy.html', credits: 'photo-credits.html' };
const url = (page, en) => (en ? 'en/' : '') + pages[page];
const heroDesktop = 'hero/hero-lycian-coast-desktop.webp';
const heroMobile = 'hero/hero-lycian-coast-mobile.webp';
const brand = 'LYCIAN WAY';
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mark = '<svg viewBox="0 0 42 32" width="35" height="28" aria-hidden="true"><path d="M1 25 15 5l9 13 5-7 12 14M4 30h34" fill="none" stroke="currentColor" stroke-width="2"/></svg>';

function render(page, en) {
  const i = +en;
  const t = (ru, english) => en ? english : ru;
  const route = routes[page];
  const path = url(page, en);
  const base = '../'.repeat(path.split('/').length - 1) || './';
  const link = (p, language = en) => base + (url(p, language) || './');
  const imageUrl = name => base + 'images/' + name;
  const img = (file, alt = '', hero = false) => {
    const [w, h] = sizes[file] || (file === heroDesktop ? [2560,1440] : []);
    if (!w || !h) throw new Error('Missing dimensions: ' + file);
    return '<img src="'+imageUrl(file)+'" width="'+w+'" height="'+h+'" alt="'+esc(alt)+'" '+(hero ? 'fetchpriority="high"' : 'loading="lazy"')+' decoding="async">';
  };
  const label = {home:t('Главная','Home'),privacy:t('Конфиденциальность','Privacy'),credits:t('Фотокредиты','Photo Credits')};
  const apply = (value = '', caption = t('Оставить заявку','Enquire')) => '<a class="button" data-goal="click_cta" '+(value ? 'data-route="'+value+'" ' : '')+'href="#application">'+caption+' <span aria-hidden="true">↗</span></a>';
  const heading = (eyebrow, title) => '<p class="eyebrow">'+eyebrow+'</p><h2>'+title+'</h2>';
  const section = (id, title, kicker, body, cls = '') => '<section class="section '+cls+'" id="'+id+'"><div class="wrap">'+heading(kicker,title)+body+'</div></section>';
  const homeAnchor = id => (page === 'home' || route ? '' : link('home')) + '#' + id;

  function hero() {
    const photo = route ? img(route.cover, '', true) : '<picture><source media="(max-width: 600px)" srcset="'+imageUrl(heroMobile)+'" width="1200" height="1500">'+img(heroDesktop,'',true)+'</picture>';
    return '<section class="hero">'+photo+'<div class="wrap hero-copy"><p class="eyebrow">'+(route ? page.toUpperCase()+' / ' : '')+t('Ликийская тропа · Турция','Lycian Way · Türkiye')+'</p><h1>'+ (route ? route.name[i] : t('7 дней<br>без офиса','7 days away<br>from the desk'))+'</h1><p class="hero-lead">'+(route ? route.intro[i] : t('Море вместо монитора. Тропа вместо созвонов.','Trade your screen for the sea and your meetings for the trail.'))+'</p><div class="actions">'+(route ? apply(page.toUpperCase(),t('Узнать ближайшие даты','Ask about dates')) : '<a class="button" data-goal="click_cta" href="#routes">'+t('Выбрать маршрут','Choose a route')+' ↘</a><a class="button outline" href="#format">'+t('Как это работает','How it works')+'</a>')+'</div></div>'+facts()+'</section>';
  }

  function facts() {
    return '<div class="facts"><div class="wrap"><span><b>7</b> '+t('дней на маршрут','days per route')+'</span><span><b>8–10</b> '+t('человек в группе*','people per group*')+'</span><span><b>'+t('Налегке','Travel light')+'</b> '+t('с дневным рюкзаком','with a daypack')+'</span></div></div>';
  }

  function format() {
    return section('format',t('Увидеть лучшее на тропе','The Lycian Way, one highlight at a time'),t('Формат путешествия','How it works'),
      '<div class="split"><div><p class="lead">'+t('Утром — тропа среди сосен, днём — античные руины или вид на море, вечером — время выдохнуть. Мы собираем в одну неделю выбранные участки побережья.','Start among the pines, spend the afternoon by ancient ruins or above the sea, and leave the evening open. Each week brings together selected stretches of coast.')+'</p><p>'+t('Активность умеренная. Ориентир — около 8–10 км в активный день. Основной багаж перевозится, на тропе нужен небольшой рюкзак. Возможность остаться на базе вместо отдельного участка зависит от программы.','Expect moderate walking, with roughly 8–10 km as a guide for an active day. Your main luggage is transported, so you walk with a daypack. Ask which walks you can sit out at base.')+'</p><p>'+t('Можно приехать одному. Ориентир по размеру группы — 8–10 человек*.','Solo travellers are welcome. The planned group size is around 8–10 people*.')+'</p><small>'+t('* Ориентир, состав зависит от заезда.','* Target group size varies by departure.')+'</small></div>'+img('east/east-mountain-beach.webp',t('Пляж у гор Ликийского побережья','A beach beneath the mountains on the Lycian coast'))+'</div>');
  }

  function accommodation() {
    return section('stay',t('Как мы размещаемся','Where you could stay'),t('На базе','At base'),
      '<div class="split lodging"><div><h3>CAMP</h3><p>'+t('Заранее установленная палатка. Вариант для тех, кто хочет проводить больше времени на свежем воздухе.','A tent set up before you arrive, for travellers who enjoy more time outdoors.')+'</p></div><div><h3>COMFORT</h3><p>'+t('Простое размещение с полноценной кроватью, например комната или бунгало.','Simple accommodation with a proper bed, such as a room or bungalow.')+'</p></div></div><p>'+t('Доступные варианты зависят от заезда. Подтвердим объект и условия лично.','Options vary by departure. We’ll confirm the property and arrangements with you directly.')+'</p>','sand');
  }

  function routeCards() {
    return section('routes',t('Выберите свою сторону побережья','Choose your side of the coast'),t('Два маршрута · по 7 дней','Two routes · seven days each'),
      '<div class="route-grid">'+Object.entries(routes).map(([key,r])=>'<article>'+img(r.cover,r.alt[i])+'<div><p class="eyebrow">'+key.toUpperCase()+'</p><h3>'+r.name[i]+'</h3><p>'+r.intro[i]+'</p><a class="text-link" data-goal="select_'+key+'" href="'+link(key)+'">'+t('Смотреть маршрут','Explore the route')+' ↗</a></div></article>').join('')+'</div><aside class="reset"><div><p class="eyebrow">EAST + WEST</p><h3>FULL RESET</h3><p>'+t('14 дней. Оба маршрута за одну поездку.','Fourteen days. Both routes in one trip.')+'</p></div>'+apply('FULL RESET',t('Спросить о FULL RESET','Ask about FULL RESET'))+'</aside>');
  }

  function gallery(photos) {
    return section('gallery',t('На тропе','Out on the trail'),t('Фотогалерея','Gallery'),
      '<div class="gallery">'+photos.map(([file,...alts])=>'<figure><button type="button" data-gallery aria-label="'+esc(t('Открыть фото: ','Open photo: ')+alts[i])+'">'+img(file,alts[i])+'</button><figcaption>'+alts[i]+(file.startsWith('external/') ? ' · <a href="'+link('credits')+'">'+label.credits+'</a>' : '')+'</figcaption></figure>').join('')+'</div><dialog id="lightbox" aria-label="'+t('Просмотр фотографий','Photo viewer')+'"><div class="lightbox-bar"><button data-prev aria-label="'+t('Предыдущее фото','Previous photo')+'">←</button><button data-next aria-label="'+t('Следующее фото','Next photo')+'">→</button><button data-close autofocus>'+t('Закрыть','Close')+' ×</button></div><figure><img alt=""><figcaption aria-live="polite"></figcaption></figure></dialog>');
  }

  function practical() {
    const entries = [
      [t('Можно приехать одному?','Can I come on my own?'),t('Да. Вы присоединитесь к небольшой группе и сможете разделить прогулки и впечатления с другими участниками.','Yes. Join a small group and share the walks and discoveries with fellow travellers.')],
      [t('Нужно ли готовиться к тропе?','How fit should I be?'),t('Пригодится привычка ходить несколько часов по неровной поверхности. Обсудите нагрузку и возможность пропустить отдельный участок с организатором.','You should be comfortable walking for several hours on uneven ground. Ask the organiser about the pace and which walks you could sit out.')],
      [t('Кто сопровождает группу?','Who leads the trip?'),t('Сопровождающий зависит от заезда. Это может быть основатель или другой специалист.','Your trip may be led by the founder or another specialist. We’ll confirm who leads your departure.')],
      [t('Когда известны даты и стоимость?','When can I find out dates and prices?'),t('Оставьте заявку, чтобы лично уточнить ближайшие даты, стоимость, состав услуг и условия записи.','Enquire to discuss upcoming dates, price, what’s included and how to book.')],
      [t('Что при плохой погоде?','What if the weather changes?'),t('Порядок прогулок может меняться. Обсудим условия конкретной поездки перед записью.','The order of walks may change. We’ll discuss the arrangements for your trip before you book.')],
    ];
    return section('practical',t('Перед поездкой','Before you go'),t('Практическая информация','Trip planning'),'<p class="lead">'+t('Заезды планируются раздельно по языкам. Точку встречи, время, размещение и список вещей уточним для конкретной поездки.','Russian and English departures are planned separately. We’ll confirm where to meet, when to arrive, where you’ll stay and what to pack for your trip.')+'</p>')+
      section('faq',t('Что ещё важно знать','Good to know'),t('Вопросы','FAQ'),entries.map(([q,a])=>'<details><summary>'+q+'</summary><p>'+a+'</p></details>').join(''));
  }

  function form() {
    return section('application',t('Обсудим вашу поездку','Let’s talk about your trip'),t('Первый шаг','Your next step'),
      '<div class="split enquiry"><div><p class="lead">'+t('Выберите маршрут и оставьте контакт. Организатор свяжется лично и расскажет о датах, размещении и условиях.','Tell us which route interests you and how to reach you. The organiser will get in touch about dates, accommodation and trip arrangements.')+'</p><div data-contacts></div></div><form method="post"><fieldset disabled><legend class="sr-only">'+t('Заявка на поездку','Trip enquiry')+'</legend>'+
      '<label>'+t('Имя','Name')+'<input name="name" autocomplete="name" required maxlength="100"></label>'+
      '<label>'+t('Контакт: email, телефон или мессенджер','Contact: email, phone or messaging handle')+'<input name="contact" required maxlength="160"></label>'+
      '<label>'+t('Маршрут','Route')+'<select name="route" required><option value="">'+t('Выберите маршрут','Choose a route')+'</option>'+
      ['EAST','WEST','FULL RESET','Not sure'].map(v=>'<option value="'+v+'">'+(v==='Not sure'?t('Пока не знаю','Not sure'):v)+'</option>').join('')+'</select></label>'+
      '<label>'+t('Размещение (необязательно)','Accommodation (optional)')+'<select name="stay"><option value="">'+t('Пока не знаю','Not sure')+'</option><option>CAMP</option><option>COMFORT</option></select></label>'+
      '<label>'+t('Комментарий (необязательно)','Comment (optional)')+'<textarea name="message" maxlength="1000" rows="3"></textarea></label>'+
      '<div hidden><label>Bot check<input type="checkbox" name="botcheck" tabindex="-1"></label></div>'+
      '<label class="check"><input type="checkbox" name="consent" required><span>'+t('Согласен на обработку данных для ответа на заявку.','I agree to the use of my information to respond to this enquiry.')+' <a href="'+link('privacy')+'">'+label.privacy+'</a></span></label>'+
      '<button class="button" type="submit">'+t('Отправить заявку','Send enquiry')+' ↗</button></fieldset><p class="form-status" role="status" aria-live="polite"></p><noscript>'+t('Для отправки заявки включите JavaScript.','Enable JavaScript to send your enquiry.')+'</noscript></form></div>','dark');
  }

  function itinerary() {
    return section('thread',t('Нитка маршрута','Along the route'),t('Предварительные точки','Proposed stops'),
      '<ol class="thread">'+route.stops.map(stop=>'<li>'+stop+'</li>').join('')+'</ol>'+
      '<p>'+t('Порядок, логистика и ночёвки уточняются перед заездом.','The order, logistics and overnight stays will be confirmed before departure.')+'</p>')+
      section('highlights',t('Места, ради которых стоит идти','Places worth walking for'),page.toUpperCase(),
        '<div class="highlights">'+route.photos.slice(0,3).map(([file,...alts])=>'<figure>'+img(file,alts[i])+'<figcaption>'+alts[i]+(file.startsWith('external/') ? ' · <a href="'+link('credits')+'">'+label.credits+'</a>' : '')+'</figcaption></figure>').join('')+'</div>')+
      section('itinerary',t('Семь дней на побережье','Seven days on the coast'),t('Предварительный план','Proposed itinerary'),
      '<p>'+t('Ориентир для знакомства с маршрутом. Разбивка по дням требует подтверждения.','An outline to help you picture the trip. The day-by-day schedule is still to be confirmed.')+'</p><ol class="days">'+route.days.map((stop,n)=>'<li><span>'+t('День','Day')+' '+(n+1)+'</span><strong>'+stop+'</strong></li>').join('')+'</ol>','sand');
  }

  function privacy() {
    return '<!-- Текст политики необходимо проверить с юристом перед публикацией. --><article class="wrap prose"><h1>'+label.privacy+'</h1><p>'+t('Проект политики до запуска формы.','Draft policy for review before the enquiry form goes live.')+'</p>'+
      '<h2>'+t('Оператор и контакт','Controller and contact')+'</h2><p>'+t('[ВАШИ ДАННЫЕ]. Обращения по данным: [КОНТАКТ].','[CONTROLLER DETAILS]. Data enquiries: [DATA CONTACT].')+'</p>'+
      '<h2>'+t('Данные и цель обработки','What we collect and why')+'</h2><p>'+t('Имя, контакт, выбранный маршрут, согласие, а также размещение и комментарий, если вы их указали. Данные нужны для ответа на заявку и обсуждения поездки. Основание обработки: согласие.','We use your name, contact details, route selection and consent, plus any accommodation preference or message you provide, to answer your enquiry. The legal basis is consent.')+'</p>'+
      '<h2>'+t('Хранение и получатели','Retention and recipients')+'</h2><p>'+t('Срок хранения: [СРОК]. Доступ имеет организатор и после подключения — провайдер формы Web3Forms. Перечень обработчиков и условия передачи необходимо подтвердить перед запуском.','Retention period: [PERIOD]. The organiser and, once configured, Web3Forms process the enquiry. The list of processors and any transfer terms are to be confirmed before launch.')+'</p>'+
      '<h2>'+t('Ваши права','Your rights')+'</h2><p>'+t('Через контакт оператора можно запросить доступ, исправление или удаление данных и отозвать согласие.','Use the data contact to request access, correction or deletion, or to withdraw consent. Withdrawal does not affect earlier lawful processing.')+'</p>'+
      '<h2>'+t('Аналитика','Analytics')+'</h2><p>'+t('Аналитика отключена. В английской версии необязательные измерения допускаются после согласия.','Analytics is disabled. Optional measurement in the English experience requires consent.')+'</p></article>';
  }

  function credits() {
    const data = readFileSync('photo-licenses/ATTRIBUTION.md','utf8');
    const mdLinks = str => esc(str).replace(/\[([^\]]+)\]\((https:\/\/[^ )]+)\)/g,'<a href="$2">$1</a>');
    const blocks = data.split(/^## /m).slice(1).map(block => {
      const [file,...lines] = block.trim().split(/\r?\n/);
      return '<section class="credit">'+img(file,file.split('/').at(-1).replace('.webp','').replaceAll('-',' '))+'<div><h2>'+esc(file)+'</h2><ul>'+lines.filter(l=>l.startsWith('- ')).map(l=>'<li>'+mdLinks(l.slice(2))+'</li>').join('')+'</ul></div></section>';
    }).join('');
    return '<article class="wrap prose credits"><h1>'+label.credits+'</h1><p>'+t('Источники, авторы, лицензии и изменения внешних фотографий.','Sources, authors, licences and modification notes for externally sourced photographs. Original attribution notes are retained below.')+'</p>'+blocks+'</article>';
  }

  const title = (route ? page.toUpperCase()+' — '+route.name[i] : page==='home' ? t('7 дней без офиса','7 days away from the desk') : label[page])+' | Lycian Way';
  const desc = route?.intro[i] || (page==='home' ? t('Ликийская тропа в Турции: море, горы и античные места в небольшой группе. Выберите EAST или WEST.','Explore the Lycian Way in Türkiye in a small group. Choose EAST for canyon trails or WEST for wide-open coastal views.') : label[page]+' · Lycian Way');
  const canonical = domain+'/'+path;
  const social = domain+'/social-card.png';
  const body = page==='privacy' ? privacy() : page==='credits' ? credits() : hero()+(route ?
    itinerary()+format()+accommodation()+gallery(route.photos)+section('extension',t('Ещё день или два в Анталье','Another day or two in Antalya'),t('По желанию','Optional extension'),'<p>'+t('Спросите о возможности остаться в Анталье ещё на 1–2 дня. Программа и условия обсуждаются отдельно.','Ask about staying in Antalya for an extra day or two. Plans and arrangements are discussed separately.')+'</p>') :
    format()+routeCards()+accommodation()+gallery(homePhotos)+section('founder',t('Я сначала прошёл это сам','I walked it first'),t('История маршрута','From the founder'),'<p class="lead">'+t('Основатель прошёл около 300 км Ликийской тропы. Из этого опыта выросла идея собрать неделю из самых интересных участков — с временем на море, древние города и виды, у которых хочется задержаться.','After walking around 300 km of the Lycian Way, the founder built a week around the stretches worth lingering on, with time for the sea, ancient cities and views you’ll want to stop for.')+'</p>','sand'))+practical()+form();
  const openAtFirstScreen = page === 'home' || route
    ? '<script>history.scrollRestoration="manual";addEventListener("pageshow",()=>{if(!location.hash)scrollTo({top:0,behavior:"instant"});});</script>'
    : '';
  return '<!doctype html><html lang="'+t('ru','en')+'"><head><meta charset="utf-8">'+openAtFirstScreen+'<meta name="viewport" content="width=device-width, initial-scale=1"><title>'+esc(title)+'</title><meta name="description" content="'+esc(desc)+'"><link rel="canonical" href="'+esc(canonical)+'">'+
    [['ru',false],['en',true],['x-default',false]].map(([lang,flag])=>'<link rel="alternate" hreflang="'+lang+'" href="'+esc(domain+'/'+url(page,flag))+'">').join('')+
    '<meta property="og:type" content="website"><meta property="og:title" content="'+esc(title)+'"><meta property="og:description" content="'+esc(desc)+'"><meta property="og:url" content="'+esc(canonical)+'"><meta property="og:image" content="'+esc(social)+'"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="'+esc(title)+'"><meta name="twitter:description" content="'+esc(desc)+'"><meta name="twitter:image" content="'+esc(social)+'"><link rel="icon" href="'+base+'favicon.svg"><link rel="stylesheet" href="'+base+'site.css"><!-- Analytics integration: load optional providers only after applicable consent. --><script type="module" src="'+base+'site.js"></script></head><body>'+
    '<a class="skip" href="#main">'+t('К содержанию','Skip to content')+'</a><header><div class="wrap header"><a class="brand" href="'+link('home')+'">'+mark+brand+'</a><button class="menu" type="button" aria-controls="nav" aria-expanded="false" hidden>'+t('Меню','Menu')+'</button><nav id="nav" aria-label="'+t('Основная навигация','Main navigation')+'"><a href="'+homeAnchor('format')+'">'+t('Как это работает','How it works')+'</a>'+['east','west'].map(key=>'<a href="'+link(key)+'"'+(key===page?' aria-current="page"':'')+'>'+key.toUpperCase()+'</a>').join('')+'<a href="'+homeAnchor('stay')+'">'+t('Размещение','Stay')+'</a><a href="'+homeAnchor('faq')+'">FAQ</a><a class="lang" hreflang="'+t('en','ru')+'" lang="'+t('en','ru')+'" href="'+link(page,!en)+'">'+t('English','Русский')+'</a><a class="nav-cta" data-goal="click_cta" href="'+homeAnchor('application')+'">'+t('Заявка','Enquire')+' ↗</a></nav></div></header><main id="main" tabindex="-1">'+body+'</main>'+
    '<footer><div class="wrap footer"><a class="brand" href="'+link('home')+'">'+mark+brand+'</a><a href="'+link('privacy')+'">'+label.privacy+'</a><a href="'+link('credits')+'">'+label.credits+'</a><div data-contacts></div></div></footer></body></html>';
}

rmSync('dist', { recursive: true, force: true });
function output(path, body) {
  mkdirSync(dirname('dist/'+path), {recursive:true});
  writeFileSync('dist/'+path, body);
}
for (const en of [false,true]) for (const page of Object.keys(pages)) {
  const path = url(page,en);
  output(path.endsWith('.html') ? path : path+'index.html',render(page,en));
}
for (const asset of ['images','site.css','site.js','config.js','favicon.svg','social-card.png']) cpSync(asset,'dist/'+asset,{recursive:true});
output('robots.txt', !process.env.SITE_DOMAIN ? 'User-agent: *\nDisallow: /\n' : 'User-agent: *\nAllow: /\nSitemap: '+domain+'/sitemap.xml\n');
output('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+[false,true].flatMap(en=>Object.keys(pages).map(page=>'<url><loc>'+esc(domain+'/'+url(page,en))+'</loc></url>')).join('')+'</urlset>');
