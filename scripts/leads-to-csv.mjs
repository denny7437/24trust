// Выгрузка заявок в CSV для Excel (UTF-8 с BOM, разделитель «;»).
// Запуск: npm run leads:csv  →  data/leads.csv
// Файл содержит персональные данные: не пересылайте его через зарубежные сервисы.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const dir = process.env.LEADS_DIR || path.join(process.cwd(), 'data');
const source = path.join(dir, 'leads.jsonl');
const target = path.join(dir, 'leads.csv');

const columns = [
  ['receivedAt', 'Получена'],
  ['topic', 'Тема'],
  ['name', 'Имя'],
  ['company', 'Компания'],
  ['email', 'E-mail'],
  ['contact', 'Телефон или Telegram'],
  ['aiPlace', 'Где работает ИИ'],
  ['comment', 'Комментарий'],
  ['consent.version', 'Версия согласия'],
  ['consent.acceptedAt', 'Согласие дано'],
  ['consent.ip', 'IP'],
  ['consent.pageUrl', 'Страница'],
  ['id', 'ID заявки'],
];

const pick = (row, key) => key.split('.').reduce((value, part) => (value == null ? value : value[part]), row);
const cell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const rows = (await readFile(source, 'utf8'))
  .split('\n')
  .filter(Boolean)
  .map((line) => JSON.parse(line));

const csv = [columns.map(([, title]) => cell(title)).join(';')]
  .concat(rows.map((row) => columns.map(([key]) => cell(pick(row, key))).join(';')))
  .join('\r\n');

await writeFile(target, `﻿${csv}\r\n`, { mode: 0o600 });
console.log(`Заявок: ${rows.length} → ${target}`);
