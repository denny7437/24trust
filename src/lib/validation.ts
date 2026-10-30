/** Правила формы заявки — общие для браузера и сервера. */

export const TOPICS = ['Пилот', 'Демо для команды', 'Партнёрство', 'Другое'] as const;
export type Topic = (typeof TOPICS)[number];

export const AI_PLACES = [
  'Чат на сайте или в приложении',
  'Контакт-центр',
  'Внутренний ассистент',
  'Агентная система',
  'Пока планируем',
] as const;

export const LIMITS = {
  name: 100,
  company: 200,
  email: 254,
  contact: 100,
  comment: 1000,
} as const;

export type LeadValues = {
  name: string;
  company: string;
  email: string;
  topic: string;
  contact: string;
  aiPlace: string;
  comment: string;
  consent: boolean;
};

export type LeadField = keyof LeadValues;
export type LeadErrors = Partial<Record<LeadField, string>>;

/** Порядок полей — для фокуса на первой ошибке. */
export const FIELD_ORDER: LeadField[] = ['name', 'company', 'email', 'topic', 'contact', 'aiPlace', 'comment', 'consent'];

export const MESSAGES = {
  name: 'Укажите имя',
  company: 'Укажите компанию',
  email: 'Проверьте адрес',
  topic: 'Выберите тему',
  consent: 'Чтобы отправить заявку, подтвердите согласие',
  comment: 'Сократите комментарий до 1 000 символов',
  tooLong: 'Слишком длинное значение',
  aiPlace: 'Выберите вариант из списка',
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const emptyLead = (topic: Topic = 'Пилот'): LeadValues => ({
  name: '',
  company: '',
  email: '',
  topic,
  contact: '',
  aiPlace: '',
  comment: '',
  consent: false,
});

export function validateField(field: LeadField, values: LeadValues): string | undefined {
  switch (field) {
    case 'name':
      if (!values.name.trim()) return MESSAGES.name;
      if (values.name.length > LIMITS.name) return MESSAGES.tooLong;
      return undefined;
    case 'company':
      if (!values.company.trim()) return MESSAGES.company;
      if (values.company.length > LIMITS.company) return MESSAGES.tooLong;
      return undefined;
    case 'email':
      if (!EMAIL_RE.test(values.email.trim()) || values.email.length > LIMITS.email) return MESSAGES.email;
      return undefined;
    case 'topic':
      return (TOPICS as readonly string[]).includes(values.topic) ? undefined : MESSAGES.topic;
    case 'contact':
      return values.contact.length > LIMITS.contact ? MESSAGES.tooLong : undefined;
    case 'aiPlace':
      return values.aiPlace === '' || (AI_PLACES as readonly string[]).includes(values.aiPlace)
        ? undefined
        : MESSAGES.aiPlace;
    case 'comment':
      return values.comment.length > LIMITS.comment ? MESSAGES.comment : undefined;
    case 'consent':
      return values.consent === true ? undefined : MESSAGES.consent;
    default:
      return undefined;
  }
}

export function validateLead(values: LeadValues): LeadErrors {
  const errors: LeadErrors = {};
  for (const field of FIELD_ORDER) {
    const message = validateField(field, values);
    if (message) errors[field] = message;
  }
  return errors;
}

const str = (value: unknown) => (typeof value === 'string' ? value : '');

/** Приводит тело запроса к форме заявки. Длинные строки не обрезаем — их отклонит проверка. */
export function normalizeLead(input: unknown): { values: LeadValues; honeypot: string; page: string } {
  const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  return {
    values: {
      name: str(raw.name).trim(),
      company: str(raw.company).trim(),
      email: str(raw.email).trim(),
      topic: str(raw.topic).trim(),
      contact: str(raw.contact).trim(),
      aiPlace: str(raw.aiPlace).trim(),
      comment: str(raw.comment).trim(),
      consent: raw.consent === true,
    },
    honeypot: str(raw.website),
    page: str(raw.page).slice(0, 500),
  };
}
