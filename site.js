import { config } from './config.js';

const en = document.documentElement.lang === 'en';
const local = (ru, english) => en ? english : ru;
export function trackGoal(name) {
  if (en && window.optionalAnalyticsConsent !== true) return;
  const { yandexId, ga4 } = config.analytics;
  if (yandexId && typeof window.ym === 'function') window.ym(yandexId, 'reachGoal', name);
  if (ga4 && typeof window.gtag === 'function') window.gtag('event', name);
}

const menu = document.querySelector('.menu');
const nav = document.querySelector('#nav');
const narrow = matchMedia('(max-width: 950px)');
function menuState(open) {
  menu.hidden = !narrow.matches;
  menu.setAttribute('aria-expanded', String(narrow.matches && open));
  nav.hidden = narrow.matches && !open;
}
menuState(true);
narrow.addEventListener('change', () => menuState(true));
menu.addEventListener('click', () => menuState(nav.hidden));

if (document.querySelector('.hero')) {
  const header = nav.closest('header');
  function updateHeaderHeight() {
    document.documentElement.style.setProperty('--header-height', header.offsetHeight + 'px');
  }
  updateHeaderHeight();
  new ResizeObserver(updateHeaderHeight).observe(header);
}
nav.addEventListener('click', event => {
  if (event.target.closest('a') && narrow.matches) {
    const link = event.target.closest('a');
    if (link.hash && link.pathname === location.pathname) {
      document.querySelector(link.hash)?.setAttribute('tabindex', '-1');
      document.querySelector(link.hash)?.focus({ preventScroll: true });
    }
    menuState(false);
  }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && narrow.matches && !nav.hidden) {
    menuState(false);
    menu.focus();
  }
});

for (const container of document.querySelectorAll('[data-contacts]')) {
  const labels = { whatsapp: 'WhatsApp', telegram: 'Telegram', max: 'MAX', email: 'Email' };
  for (const [service, value] of Object.entries(config.contacts)) {
    if (!value || (en && service === 'max')) continue;
    const href = service === 'email' ? 'mailto:' + value : value;
    if (service !== 'email' && !href.startsWith('https://')) continue;
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.textContent = labels[service];
    if (service !== 'email') anchor.dataset.goal = 'click_' + service;
    container.append(anchor);
  }
}

const form = document.querySelector('form');
const route = form?.elements.namedItem('route');
const goalSuffix = value => value.toLowerCase().replaceAll(' ', '_');
document.addEventListener('click', event => {
  const anchor = event.target.closest('a');
  if (anchor?.dataset.goal) trackGoal(anchor.dataset.goal);
  if (anchor?.dataset.route && route) {
    route.value = anchor.dataset.route;
    route.dispatchEvent(new Event('change'));
  }
});

if (form) {
  const fields = form.querySelector('fieldset');
  const status = form.querySelector('.form-status');
  const send = form.querySelector('[type=submit]');
  const messages = {
    unavailable: local('Онлайн-заявки пока недоступны.', 'Online enquiries are currently unavailable.'),
    sending: local('Отправляем заявку…', 'Sending your enquiry…'),
    success: local('Заявка получена. Организатор свяжется лично, чтобы уточнить даты, размещение и условия. После этого вы сможете принять решение.', 'Enquiry received. The organiser will contact you personally about dates, accommodation and arrangements so you can decide how to proceed.'),
    error: local('Не удалось отправить заявку. Ваши данные остались в форме. Попробуйте ещё раз.', 'We couldn’t send your enquiry. Your details are still in the form. Please try again.'),
    required: local('Заполните это поле.', 'Please complete this field.'),
  };
  fields.disabled = false;
  if (!config.form.accessKey) status.textContent = messages.unavailable;
  for (const key of ['name', 'contact']) {
    const input = form.elements.namedItem(key);
    input.addEventListener('input', () => input.setCustomValidity(''));
  }
  form.addEventListener('change', event => {
    const { name, value } = event.target;
    if (['EAST','WEST','FULL RESET','CAMP','COMFORT'].includes(value) && ['route','stay'].includes(name)) {
      trackGoal('select_' + goalSuffix(value));
    }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (send.disabled) return;
    for (const key of ['name','contact']) {
      const input = form.elements.namedItem(key);
      input.setCustomValidity(input.value.trim() ? '' : messages.required);
    }
    if (!form.reportValidity()) return;
    if (!config.form.accessKey) {
      status.textContent = messages.unavailable;
      return;
    }
    const data = new FormData(form);
    if (data.has('botcheck')) return;
    data.set('access_key', config.form.accessKey);
    data.set('language', en ? 'en' : 'ru');
    send.disabled = true;
    form.setAttribute('aria-busy', 'true');
    status.textContent = messages.sending;
    try {
      const response = await fetch(config.form.endpoint, { method:'POST', headers:{ Accept:'application/json' }, body:data, signal:AbortSignal.timeout(12000) });
      if (!response.ok || (await response.json()).success !== true) throw new Error();
      form.reset();
      status.textContent = messages.success;
      trackGoal('form_submit');
    } catch {
      status.textContent = messages.error;
    } finally {
      send.disabled = false;
      form.removeAttribute('aria-busy');
    }
  });
}

const viewer = document.querySelector('#lightbox');
if (viewer) {
  const triggers = [...document.querySelectorAll('[data-gallery]')];
  const photo = viewer.querySelector('img');
  const caption = viewer.querySelector('figcaption');
  let index = 0;
  let opener;
  function show(next) {
    index = (next + triggers.length) % triggers.length;
    const source = triggers[index].querySelector('img');
    photo.src = source.src;
    photo.alt = source.alt;
    caption.textContent = (index+1) + ' / ' + triggers.length + ' · ' + source.alt;
  }
  triggers.forEach((button, position) => button.addEventListener('click', () => {
    opener = button;
    show(position);
    viewer.showModal();
  }));
  viewer.querySelector('[data-prev]').addEventListener('click', () => show(index-1));
  viewer.querySelector('[data-next]').addEventListener('click', () => show(index+1));
  viewer.querySelector('[data-close]').addEventListener('click', () => viewer.close());
  viewer.addEventListener('close', () => opener?.focus());
  viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(index + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
}
