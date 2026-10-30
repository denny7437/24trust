// Не даёт выкатить сайт с заглушками. Запускается сам после `npm run build` (хук postbuild),
// вручную — `npm run check:placeholders` (проверяет последнюю сборку в .next).
//
// Что проверяется:
//   1. [заглушки в квадратных скобках] в тексте собранных страниц и в данных src/content;
//   2. пустые и нерабочие реквизиты (company в src/content/site.ts), файл логотипа ФСИ в public/;
//   3. адрес сайта в canonical, Open Graph, sitemap.xml и robots.txt: не localhost, не http, не example.
//
// Черновая сборка для локальных проверок: ALLOW_PLACEHOLDERS=1 npm run build
// (или строка ALLOW_PLACEHOLDERS=1 в .env.local). Тогда проверка только печатает список и не падает.
// Для боевого сайта, в том числе в Docker и на сервере, переменную не задавайте.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nextEnv from '@next/env';
import ts from 'typescript';

const root = fileURLToPath(new URL('..', import.meta.url));
nextEnv.loadEnvConfig(root); // .env и .env.local читаются так же, как при next build

const allowed = /^(1|true|yes|on)$/i.test(process.env.ALLOW_PLACEHOLDERS ?? '');
const appDir = path.join(root, '.next', 'server', 'app');
const siteFile = path.join(root, 'src', 'content', 'site.ts');
const dataFiles = [siteFile, path.join(root, 'src', 'content', 'legal.ts')];

const STUB = /\[[^[\]\n]+\]/g; // [заглушка] внутри текста: так их подсвечивает компонент Fill
const HAS_STUB = new RegExp(STUB.source);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/; // тот же шаблон, что в форме заявки

const rel = (file) => path.relative(root, file);

// --- Что нашли ----------------------------------------------------------------

const stubs = new Map(); // текст заглушки -> { pages, paths, contexts }
const problems = []; // { title, where? }
const siteOrigins = new Map(); // адрес сайта -> { reason, kinds }

function addStub(token, { page, dataPath, context }) {
  const item = stubs.get(token) ?? { pages: new Set(), paths: new Set(), contexts: [] };
  if (page) item.pages.add(page);
  if (dataPath) item.paths.add(dataPath);
  if (context && item.contexts.length < 3 && !item.contexts.includes(context)) item.contexts.push(context);
  stubs.set(token, item);
}

// --- Собранные страницы -------------------------------------------------------

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decode(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code) => {
    if (code[0] !== '#') return ENTITIES[code.toLowerCase()] ?? whole;
    const number = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
    return Number.isInteger(number) && number <= 0x10ffff ? String.fromCodePoint(number) : whole;
  });
}

/** HTML без скриптов, стилей и комментариев (React ставит <!-- --> между соседними текстами). */
const withoutCode = (html) =>
  html
    .replace(/<script\b[\s\S]*?<\/script>/gi, '\n')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '\n')
    .replace(/<!--[\s\S]*?-->/g, '');

/** Тексты, которые видит посетитель: содержимое тегов и подписи в alt, title, aria-label, placeholder, content. */
function visibleTexts(html) {
  const body = withoutCode(html);
  const texts = body.split(/<[^>]*>/);
  for (const [, value] of body.matchAll(/\s(?:alt|title|aria-label|placeholder|content)="([^"]*)"/gi)) texts.push(value);
  return texts.map(decode);
}

/** Текст страницы одной строкой, чтобы показать слова вокруг заглушки. */
const htmlToText = (html) => withoutCode(html).replace(/<[^>]*>/g, '');

/** Адреса, которые Next.js собирает из NEXT_PUBLIC_SITE_URL: canonical и картинки для соцсетей. */
function metaUrls(html) {
  const head = html.slice(0, Math.max(html.indexOf('</head>'), 0));
  const urls = [];
  for (const [tag] of head.matchAll(/<(?:link|meta)\b[^>]*>/gi)) {
    const attr = Object.fromEntries(
      [...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, value]) => [key.toLowerCase(), decode(value)]),
    );
    if (attr.rel === 'canonical') urls.push(['canonical', attr.href]);
    else if (attr.property === 'og:url' || attr.property === 'og:image') urls.push([attr.property, attr.content]);
    else if (attr.name === 'twitter:image') urls.push([attr.name, attr.content]);
  }
  return urls;
}

function snippet(text, index, length) {
  const from = Math.max(0, index - 45);
  const to = Math.min(text.length, index + length + 45);
  return `${from > 0 ? '…' : ''}${text.slice(from, to).replace(/\s+/g, ' ').trim()}${to < text.length ? '…' : ''}`;
}

/** Почему адрес сайта не годится для боевой сборки. Пустая строка — годится. */
function siteUrlProblem(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return 'не адрес';
  }
  const host = url.hostname;
  if (/^(localhost|0\.0\.0\.0|127(\.\d+){3}|\[?::1\]?)$/.test(host) || /\.(localhost|local|test|invalid)$/.test(host)) {
    return 'локальный адрес';
  }
  if (/(^|\.)example\.[a-z]+$/.test(host)) return 'адрес-образец';
  return url.protocol === 'https:' ? '' : 'не https';
}

let siteUrlsChecked = 0;

function addSiteUrl(kind, value) {
  siteUrlsChecked += 1;
  const reason = siteUrlProblem(value);
  if (!reason) return;
  let origin = value;
  try {
    origin = new URL(value).origin;
  } catch {
    // не адрес: показываем как есть
  }
  const item = siteOrigins.get(origin) ?? { reason, kinds: new Set() };
  item.kinds.add(kind);
  siteOrigins.set(origin, item);
}

function scanPages() {
  const files = readdirSync(appDir, { recursive: true })
    .filter((name) => name.endsWith('.html'))
    .sort((a, b) => (a === 'index.html' ? -1 : b === 'index.html' ? 1 : a.localeCompare(b)));
  if (!files.length) throw new Error(`в ${rel(appDir)} нет собранных страниц`);

  for (const name of files) {
    const route = name === 'index.html' ? '/' : `/${name.replace(/\.html$/, '')}`;
    const html = readFileSync(path.join(appDir, name), 'utf8');
    const found = new Set();
    for (const text of visibleTexts(html)) {
      for (const [token] of text.matchAll(STUB)) {
        addStub(token, { page: route });
        found.add(token);
      }
    }
    // Заглушка стоит в отдельном <mark>, поэтому слова вокруг неё берём из текста страницы целиком
    const flat = decode(htmlToText(html));
    for (const token of found) {
      for (let at = flat.indexOf(token); at !== -1; at = flat.indexOf(token, at + token.length)) {
        addStub(token, { context: snippet(flat, at, token.length) });
      }
    }
    for (const [kind, value] of metaUrls(html)) addSiteUrl(kind, value ?? '');
  }

  const sitemap = path.join(appDir, 'sitemap.xml.body');
  if (existsSync(sitemap)) {
    for (const [, value] of readFileSync(sitemap, 'utf8').matchAll(/<loc>([^<]*)<\/loc>/g)) addSiteUrl('sitemap.xml', value);
  }
  const robots = path.join(appDir, 'robots.txt.body');
  if (existsSync(robots)) {
    for (const [, value] of readFileSync(robots, 'utf8').matchAll(/^Sitemap:\s*(\S+)/gim)) addSiteUrl('robots.txt', value);
  }
  if (!siteUrlsChecked) {
    throw new Error(
      'в собранных страницах не нашлось ни одного адреса сайта (canonical, Open Graph, sitemap.xml): ' +
        'формат вывода Next.js изменился, поправьте скрипт',
    );
  }
  return files.length;
}

// --- Данные из src/content ----------------------------------------------------

/** Читает файл данных на TypeScript: компилирует в память и выполняет. Подходят только самодостаточные файлы. */
function loadModule(file, cache = new Map()) {
  if (cache.has(file)) return cache.get(file).exports;
  const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), {
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const mod = { exports: {} };
  cache.set(file, mod);
  const localRequire = (request) => {
    const target = request.startsWith('.') ? `${path.resolve(path.dirname(file), request)}.ts` : '';
    if (!existsSync(target)) {
      throw new Error(`подключает «${request}»: проверка читает только файлы данных без внешних импортов`);
    }
    return loadModule(target, cache);
  };
  try {
    new Function('exports', 'require', 'module', outputText)(mod.exports, localRequire, mod);
  } catch (error) {
    throw new Error(`${rel(file)}: ${error.message}`);
  }
  return mod.exports;
}

function* walkStrings(value, name) {
  if (typeof value === 'string') yield [name, value];
  else if (Array.isArray(value)) for (const [i, item] of value.entries()) yield* walkStrings(item, `${name}[${i}]`);
  else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) yield* walkStrings(item, `${name}.${key}`);
  }
}

function companyLine(key) {
  const lines = readFileSync(siteFile, 'utf8').split('\n');
  const start = lines.findIndex((line) => /export const company\b/.test(line));
  const index = lines.findIndex((line, n) => n > start && new RegExp(`^\\s+${key}:`).test(line));
  return index === -1 ? '' : `${rel(siteFile)}:${index + 1}`;
}

/** Нерабочий контакт: значение есть, но ссылку из него сайт построить не сможет. */
function contactProblem(site, key, value) {
  const bad = (helper) => typeof site[helper] === 'function' && !site[helper](value);
  if (key === 'phone' && bad('phoneHref')) return 'не похоже на номер телефона, ссылка tel: не построится';
  if (key === 'telegram' && bad('telegramHandle')) return 'не похоже на ник Telegram, ссылка t.me не построится';
  if (/email$/i.test(key) && !EMAIL.test(value.trim())) return 'не похоже на адрес e-mail';
  return '';
}

/** Файл логотипа должен лежать в public/ и быть картинкой: в прошлый раз вместо SVG подставили адрес HTML-страницы. */
function logoProblem(logo) {
  if (/^https?:\/\//i.test(logo)) {
    return 'внешний адрес не загрузится: CSP пускает картинки только со своего домена, положите файл в public/';
  }
  const file = path.join(root, 'public', logo);
  if (!existsSync(file)) return `файла нет в public/ (${logo})`;
  const bytes = readFileSync(file);
  if (/\.svg$/i.test(logo) && !/<svg[\s>]/i.test(bytes.toString('utf8'))) {
    return 'файл не похож на SVG (возможно, сохранена веб-страница вместо картинки)';
  }
  if (/\.png$/i.test(logo) && !bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'файл не похож на PNG (возможно, сохранена веб-страница вместо картинки)';
  }
  return '';
}

function scanData() {
  const site = loadModule(siteFile);
  if (!site.company || typeof site.company !== 'object') throw new Error(`в ${rel(siteFile)} нет объекта company`);
  for (const file of dataFiles) {
    for (const [exportName, value] of Object.entries(loadModule(file))) {
      for (const [name, text] of walkStrings(value, exportName)) {
        for (const token of text.match(STUB) ?? []) addStub(token, { dataPath: name });
      }
    }
  }

  for (const [key, value] of Object.entries(site.company)) {
    const where = companyLine(key);
    if (typeof value !== 'string' || !value.trim()) {
      problems.push({ title: `company.${key}: пусто`, where });
    } else if (!HAS_STUB.test(value)) {
      const reason = key === 'fsiLogo' ? logoProblem(value.trim()) : contactProblem(site, key, value);
      if (reason) problems.push({ title: `company.${key}: ${reason}`, where });
    }
  }
}

// --- Отчёт --------------------------------------------------------------------

const sourceFiles = () =>
  readdirSync(path.join(root, 'src'), { recursive: true })
    .filter((name) => /\.tsx?$/.test(name) && name !== path.join('components', 'ui.tsx')) // в ui.tsx — сам компонент Fill
    .map((name) => {
      const file = path.join(root, 'src', name);
      return { name: rel(file), lines: readFileSync(file, 'utf8').split('\n') };
    });

function report(pageCount) {
  const files = sourceFiles();
  const locate = (token) =>
    files.flatMap(({ name, lines }) => lines.flatMap((line, i) => (line.includes(token) ? [`${name}:${i + 1}`] : [])));
  const out = [];

  if (stubs.size) {
    out.push('', `Заглушки в тексте сайта (${stubs.size}):`);
    for (const [token, item] of stubs) {
      out.push(`  ${token}`);
      if (item.pages.size) out.push(`      страницы: ${[...item.pages].join(', ')}`);
      else out.push(`      в данных: ${[...item.paths].join(', ')}`);
      const places = locate(token);
      if (places.length) out.push(`      в коде: ${places.slice(0, 4).join(', ')}${places.length > 4 ? ', …' : ''}`);
      else for (const context of item.contexts) out.push(`      рядом с текстом: ${context}`);
    }
  }
  if (problems.length) {
    out.push('', `Пустые или нерабочие реквизиты (${problems.length}):`);
    for (const { title, where } of problems) out.push(`  ${title}${where ? `  (${where})` : ''}`);
  }
  if (siteOrigins.size) {
    out.push('', `Адрес сайта в собранных страницах (${siteOrigins.size}):`);
    for (const [origin, { reason, kinds }] of siteOrigins) out.push(`  ${origin} — ${reason} (${[...kinds].join(', ')})`);
    out.push('  Задайте NEXT_PUBLIC_SITE_URL=https://ваш-домен: в Docker это переменная в .env, она подставляется при сборке.');
  }

  const total = stubs.size + problems.length + siteOrigins.size;
  if (!total) {
    console.log(`Проверка заглушек пройдена (страниц: ${pageCount}): заглушек, пустых реквизитов и адресов localhost нет.`);
    return;
  }
  console.error(`Проверка заглушек: в собранном сайте остались недоделки, публиковать его нельзя.${out.join('\n')}`);
  if (allowed) {
    console.error('\nALLOW_PLACEHOLDERS включена: это черновая сборка, проверка только предупреждает.');
  } else {
    console.error(
      '\nСборка остановлена. Заполните перечисленное и пересоберите сайт.' +
        '\nЧерновая сборка для локальных проверок: ALLOW_PLACEHOLDERS=1 npm run build',
    );
    process.exitCode = 1;
  }
}

function main() {
  if (!existsSync(appDir)) throw new Error('нет собранных страниц (.next/server/app), сначала выполните npm run build');
  const pageCount = scanPages();
  scanData();
  report(pageCount);
}

try {
  main();
} catch (error) {
  console.error(`Проверка заглушек не смогла выполниться: ${error.message}`);
  if (allowed) console.error('ALLOW_PLACEHOLDERS включена: сборка продолжается без проверки.');
  else process.exitCode = 1;
}
