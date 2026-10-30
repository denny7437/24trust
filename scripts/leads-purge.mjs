// Удаляет из data/leads.jsonl заявки старше срока хранения (по умолчанию 3 года — см. Политику, п. 2.1).
// Запуск: npm run leads:purge            — срок по умолчанию (1095 дней)
//         npm run leads:purge -- 730     — свой срок в днях
// Поставьте в cron раз в сутки на сервере, где лежат заявки.
import { readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

const days = Number(process.argv[2] || process.env.LEADS_RETENTION_DAYS || 1095);
const dir = process.env.LEADS_DIR || path.join(process.cwd(), 'data');
const file = path.join(dir, 'leads.jsonl');
const border = Date.now() - days * 24 * 60 * 60 * 1000;

let raw;
try {
  raw = await readFile(file, 'utf8');
} catch {
  console.log(`Файла ${file} нет — удалять нечего`);
  process.exit(0);
}

const lines = raw.split('\n').filter(Boolean);
const kept = lines.filter((line) => {
  try {
    return new Date(JSON.parse(line).receivedAt).getTime() >= border;
  } catch {
    return true; // повреждённую строку не трогаем — пусть посмотрит человек
  }
});

const tmp = `${file}.tmp`;
await writeFile(tmp, kept.length ? `${kept.join('\n')}\n` : '', { mode: 0o600 });
await rename(tmp, file);
console.log(`Удалено заявок: ${lines.length - kept.length}, осталось: ${kept.length} (срок ${days} дн.)`);
