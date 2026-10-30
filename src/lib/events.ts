/** Лёгкие события между независимыми клиентскими компонентами. */

import type { Topic } from './validation';

export const FORM_REQUEST_EVENT = 'tg:form-request';
export const COOKIE_SETTINGS_EVENT = 'tg:cookie-settings';

export type FormRequestDetail = { topic: Topic };

/** Кнопки «Обсудить пилот», «Подать заявку», «Задать вопрос» выбирают тему в форме. */
export function requestForm(topic: Topic) {
  window.dispatchEvent(new CustomEvent<FormRequestDetail>(FORM_REQUEST_EVENT, { detail: { topic } }));
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT));
}
