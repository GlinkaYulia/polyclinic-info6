import { useState } from 'react';
import { login, register, ApiError } from '../api.js';
import { validateAuth } from '../validators.js';
import Field from './Field.jsx';

const EMPTY = { full_name: '', email: '', password: '' };

export default function AuthPanel({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === 'register';

  function handleChange(e) {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
  }

  function switchMode() {
    setMode(isRegister ? 'login' : 'register');
    setErrors({});
    setFormError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const clientErrors = validateAuth(values, mode);
    setErrors(clientErrors);
    setFormError('');
    if (Object.keys(clientErrors).length > 0) return;

    setSubmitting(true);
    try {
      const user = isRegister
        ? await register(values)
        : await login({ email: values.email, password: values.password });
      setValues(EMPTY);
      onAuth(user);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors || {});
        if (!err.errors || Object.keys(err.errors).length === 0) setFormError(err.message);
      } else {
        setFormError('Не вдалося зʼєднатися із сервером');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className='panel' id='auth'>
      <h2>{isRegister ? 'Реєстрація' : 'Вхід'}</h2>
      <p className='muted'>Щоб записатися на прийом, увійдіть або створіть обліковий запис.</p>

      <form onSubmit={handleSubmit} noValidate className='form'>
        {isRegister && (
          <Field label='ПІБ' name='full_name' error={errors.full_name}>
            <input id='full_name' name='full_name' value={values.full_name} onChange={handleChange}
                   autoComplete='name' aria-invalid={!!errors.full_name} />
          </Field>
        )}

        <Field label='Email' name='email' error={errors.email}>
          <input id='email' name='email' type='email' value={values.email} onChange={handleChange}
                 autoComplete='email' aria-invalid={!!errors.email} />
        </Field>

        <Field label='Пароль' name='password' error={errors.password}>
          <input id='password' name='password' type='password' value={values.password}
                 onChange={handleChange} aria-invalid={!!errors.password}
                 autoComplete={isRegister ? 'new-password' : 'current-password'} />
        </Field>

        {formError && <p className='status error' role='alert'>{formError}</p>}

        <div className='actions'>
          <button type='submit' className='button' disabled={submitting}>
            {submitting ? 'Зачекайте…' : isRegister ? 'Зареєструватися' : 'Увійти'}
          </button>
          <button type='button' className='link-button' onClick={switchMode}>
            {isRegister ? 'Вже є акаунт? Увійти' : 'Немає акаунта? Зареєструватися'}
          </button>
        </div>
      </form>
    </section>
  );
}
