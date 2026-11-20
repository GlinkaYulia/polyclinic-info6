import { useEffect, useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage.js';
import { createAppointment, getBusyTimes, ApiError } from '../api.js';
import { validateAppointment, TIME_SLOTS, todayISO, addDaysISO } from '../validators.js';
import Field from './Field.jsx';

const EMPTY_DRAFT = { patient_name: '', phone: '', comment: '' };

export default function AppointmentForm({ doctor, user, onCreated, onCancel }) {
  // Чернетка зберігається в localStorage і видаляється після успішного запису
  const [draft, setDraft] = useLocalStorage('appointmentDraft', {
    ...EMPTY_DRAFT,
    patient_name: user.full_name
  });
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [busy, setBusy] = useState([]);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Завантажуємо зайняті години при зміні лікаря або дати
  useEffect(() => {
    if (!date) {
      setBusy([]);
      return undefined;
    }
    let cancelled = false;
    getBusyTimes(doctor.id, date)
      .then(times => {
        if (cancelled) return;
        setBusy(times);
        setTime(t => (times.includes(t) ? '' : t));
      })
      .catch(() => {
        if (!cancelled) setBusy([]);
      });
    return () => {
      cancelled = true;
    };
  }, [doctor.id, date]);

  function handleDraftChange(e) {
    const { name, value } = e.target;
    setDraft(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const values = { ...draft, appointment_date: date, appointment_time: time };
    const clientErrors = validateAppointment(values);
    setErrors(clientErrors);
    setFormError('');
    if (Object.keys(clientErrors).length > 0) return;

    setSubmitting(true);
    try {
      const appointment = await createAppointment({
        doctor_id: doctor.id,
        patient_name: draft.patient_name,
        phone: draft.phone,
        appointment_date: date,
        appointment_time: time,
        comment: draft.comment || null
      });
      setDraft({ ...EMPTY_DRAFT, patient_name: user.full_name });
      onCreated(appointment);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors || {});
        if (!err.errors || Object.keys(err.errors).length === 0) setFormError(err.message);
        if (err.status === 409) {
          setTime('');
          getBusyTimes(doctor.id, date).then(setBusy).catch(() => {});
        }
      } else {
        setFormError('Не вдалося зʼєднатися із сервером');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className='panel' id='booking'>
      <h2>Запис на прийом</h2>
      <p className='muted'>
        {doctor.full_name} — {doctor.specialty}, кабінет {doctor.room}
      </p>

      <form onSubmit={handleSubmit} noValidate className='form'>
        <Field label='ПІБ пацієнта' name='patient_name' error={errors.patient_name}>
          <input id='patient_name' name='patient_name' value={draft.patient_name}
                 onChange={handleDraftChange} autoComplete='name' aria-invalid={!!errors.patient_name} />
        </Field>

        <Field label='Телефон' name='phone' error={errors.phone}>
          <input id='phone' name='phone' type='tel' placeholder='+380501234567' value={draft.phone}
                 onChange={handleDraftChange} autoComplete='tel' aria-invalid={!!errors.phone} />
        </Field>

        <Field label='Дата' name='appointment_date' error={errors.appointment_date}>
          <input id='appointment_date' type='date' value={date} min={todayISO()} max={addDaysISO(90)}
                 onChange={e => setDate(e.target.value)} aria-invalid={!!errors.appointment_date} />
        </Field>

        <Field label='Час' name='appointment_time' error={errors.appointment_time}>
          <select id='appointment_time' value={time} onChange={e => setTime(e.target.value)}
                  disabled={!date} aria-invalid={!!errors.appointment_time}>
            <option value=''>{date ? 'Оберіть час' : 'Спочатку оберіть дату'}</option>
            {TIME_SLOTS.map(slot => (
              <option key={slot} value={slot} disabled={busy.includes(slot)}>
                {slot}{busy.includes(slot) ? ' — зайнято' : ''}
              </option>
            ))}
          </select>
        </Field>

        <Field label={'Коментар (' + draft.comment.length + '/500)'} name='comment' error={errors.comment}>
          <textarea id='comment' name='comment' rows={3} maxLength={500} value={draft.comment}
                    onChange={handleDraftChange} />
        </Field>

        {errors.doctor_id && <p className='status error' role='alert'>{errors.doctor_id}</p>}
        {formError && <p className='status error' role='alert'>{formError}</p>}

        <div className='actions'>
          <button type='submit' className='button' disabled={submitting}>
            {submitting ? 'Збереження…' : 'Записатися'}
          </button>
          <button type='button' className='link-button' onClick={onCancel}>Скасувати</button>
        </div>
      </form>
    </section>
  );
}
