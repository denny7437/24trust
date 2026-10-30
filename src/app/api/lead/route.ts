import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { CONSENT_CHECKBOX_TEXT, consentDoc } from '@/content/legal';
import { siteUrl } from '@/content/site';
import { saveLead, type StoredLead } from '@/lib/leads';
import { allowRequest } from '@/lib/rate-limit';
import { normalizeLead, validateLead } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY = 20_000;

/**
 * IP посетителя берём из заголовков обратного прокси (nginx: X-Real-IP / X-Forwarded-For).
 * Без прокси перед приложением эти заголовки может подставить кто угодно — не публикуйте
 * Node-сервер в интернет напрямую.
 */
function clientIp(headers: Headers) {
  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  const ip = clientIp(request.headers);
  if (!allowRequest(ip)) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY) {
    return NextResponse.json({ ok: false, error: 'too_large' }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
  }

  const { values, honeypot, page } = normalizeLead(body);

  // Поле-ловушка заполнено — это бот. Отвечаем как обычно, но заявку не сохраняем.
  if (honeypot) return NextResponse.json({ ok: true });

  const errors = validateLead(values);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 400 });
  }

  const now = new Date().toISOString();
  const lead: StoredLead = {
    id: randomUUID(),
    receivedAt: now,
    name: values.name,
    company: values.company,
    email: values.email,
    topic: values.topic,
    contact: values.contact,
    aiPlace: values.aiPlace,
    comment: values.comment,
    consent: {
      given: true,
      version: consentDoc.version,
      text: CONSENT_CHECKBOX_TEXT,
      documentUrl: `${siteUrl}/consent`,
      acceptedAt: now,
      ip,
      userAgent: (request.headers.get('user-agent') ?? '').slice(0, 300),
      pageUrl: page || request.headers.get('referer') || siteUrl,
    },
  };

  try {
    await saveLead(lead);
  } catch (error) {
    console.error(`[lead ${lead.id}] not saved:`, error);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
