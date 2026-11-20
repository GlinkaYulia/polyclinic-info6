// Клієнтська валідація (для зручності користувача).
// Остаточну перевірку завжди виконує сервер.

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const NAME_RE = /^\p{L}[\p{L}\s'’.-]*$/u;
const PHONE_RE = /^\+?\d{10,13}$/;

export const TIME_SLOTS = [];
for (let h = 8; h <= 18; h++) {
  for (const m of ['00', '30']) {
    TIME_SLOTS.push(String(h).padStart(2, '0') + ':' + m);
  }
}

function toISO(date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export const todayISO = () => toISO(new Date());

export function addDaysISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toISO(d);
}

function nameError(value, label) {
  const v = value.trim();
  if (v.length < 2 || v.length > 150) return label + ': від 2 до 150 символів';
  if (!NAME_RE.test(v)) return label + ': лише літери, пробіли, апостроф і дефіс';
  return null;
}

export function validateAuth(values, mode) {
  const errors = {};

  if (mode === 'register') {
    const err = nameError(values.full_name, 'ПІБ');
    if (err) errors.full_name = err;
  }

  if (!EMAIL_RE.test(values.email.trim())) errors.email = 'Некоректний email';

  if (mode === 'register') {
    const p = values.password;
    if (p.length < 8 || !/\p{L}/u.test(p) || !/\d/.test(p)) {
      errors.password = 'Пароль: щонайменше 8 символів, літера та цифра';
    }
  } else if (!values.password) {
    errors.password = 'Введіть пароль';
  }

  return errors;
}

export function validateAppointment(values) {
  const errors = {};

  const err = nameError(values.patient_name, 'ПІБ');
  if (err) errors.patient_name = err;

  const phone = values.phone.replace(/[\s\-()]/g, '');
  if (!PHONE_RE.test(phone)) errors.phone = 'Телефон: від 10 до 13 цифр, можливий префікс +';

  if (!values.appointment_date) errors.appointment_date = 'Оберіть дату';
  else if (values.appointment_date < todayISO() || values.appointment_date > addDaysISO(90)) {
    errors.appointment_date = 'Дата: від сьогодні до 90 днів уперед';
  }

  if (!values.appointment_time) errors.appointment_time = 'Оберіть час';
  if (values.comment.length > 500) errors.comment = 'Коментар: до 500 символів';

  return errors;
}
