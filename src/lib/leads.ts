/**
 * Куда уходят заявки. Работает только на сервере (route handler /api/lead).
 *
 * 1. Файл JSONL на своём сервере — включён по умолчанию (LEADS_DIR, по умолчанию ./data).
 * 2. Вебхук в CRM или n8n на российских серверах — если задан LEAD_WEBHOOK_URL.
 * 3. Письмо на корпоративную почту через SMTP российского сервиса — если заданы SMTP_HOST и LEAD_NOTIFY_TO.
 *
 * Заявка считается принятой, если сработал хотя бы один канал.
 * Не отправляйте заявки на зарубежные сервисы (Gmail, Google Forms, Telegram-боты и т. п.):
 * запись ПДн граждан РФ — только в базы на территории РФ (ч. 5 ст. 18 152-ФЗ).
 */

import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { LeadValues } from './validation';

export type StoredLead = Omit<LeadValues, 'consent'> & {
  id: string;
  receivedAt: string;
  consent: {
    given: true;
    version: string;
    text: string;
    documentUrl: string;
    acceptedAt: string;
    ip: string;
    userAgent: string;
    pageUrl: string;
  };
};

const LEADS_DIR = process.env.LEADS_DIR || path.join(process.cwd(), 'data');
const FILE_ENABLED = process.env.LEADS_FILE !== 'off';

async function writeToFile(lead: StoredLead) {
  await mkdir(LEADS_DIR, { recursive: true, mode: 0o700 });
  const file = path.join(LEADS_DIR, 'leads.jsonl');
  await appendFile(file, `${JSON.stringify(lead)}\n`, { encoding: 'utf8', mode: 0o600 });
}

async function postToWebhook(lead: StoredLead) {
  const url = process.env.LEAD_WEBHOOK_URL;
  if (!url) return;
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (process.env.LEAD_WEBHOOK_SECRET) headers.authorization = `Bearer ${process.env.LEAD_WEBHOOK_SECRET}`;
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(lead),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`webhook responded ${response.status}`);
}

function formatLead(lead: StoredLead) {
  return [
    `Тема: ${lead.topic}`,
    `Имя: ${lead.name}`,
    `Компания: ${lead.company}`,
    `E-mail: ${lead.email}`,
    `Телефон или Telegram: ${lead.contact || '—'}`,
    `Где работает ИИ: ${lead.aiPlace || '—'}`,
    `Комментарий: ${lead.comment || '—'}`,
    '',
    `Заявка ${lead.id} от ${lead.receivedAt}`,
    `Согласие: версия ${lead.consent.version}, ${lead.consent.acceptedAt}, IP ${lead.consent.ip}`,
    `Страница: ${lead.consent.pageUrl}`,
  ].join('\n');
}

async function sendEmail(lead: StoredLead) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, LEAD_NOTIFY_TO } = process.env;
  if (!SMTP_HOST || !LEAD_NOTIFY_TO) return;
  type Mailer = typeof import('nodemailer');
  const mod: Mailer & { default?: Mailer } = await import('nodemailer');
  const mailer = mod.default ?? mod;
  const port = Number(SMTP_PORT || 465);
  const transporter = mailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
  await transporter.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to: LEAD_NOTIFY_TO,
    replyTo: lead.email,
    subject: `Заявка с сайта TrustGuard AI: ${lead.topic} — ${lead.company}`,
    text: formatLead(lead),
  });
}

export function deliveryChannels() {
  return {
    file: FILE_ENABLED,
    webhook: Boolean(process.env.LEAD_WEBHOOK_URL),
    email: Boolean(process.env.SMTP_HOST && process.env.LEAD_NOTIFY_TO),
  };
}

export async function saveLead(lead: StoredLead): Promise<void> {
  const channels = deliveryChannels();
  const tasks: { name: string; run: Promise<void> }[] = [];
  if (channels.file) tasks.push({ name: 'file', run: writeToFile(lead) });
  if (channels.webhook) tasks.push({ name: 'webhook', run: postToWebhook(lead) });
  if (channels.email) tasks.push({ name: 'email', run: sendEmail(lead) });

  if (tasks.length === 0) throw new Error('No lead delivery channel is configured');

  const results = await Promise.allSettled(tasks.map((task) => task.run));
  let delivered = 0;
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') delivered += 1;
    else console.error(`[lead ${lead.id}] ${tasks[index].name} failed:`, result.reason);
  });
  if (delivered === 0) throw new Error('All lead delivery channels failed');
}
