// Єдине місце, де виконуються запити до сервера

export class ApiError extends Error {
  constructor(message, status, errors = {}) {
    super(message);
    this.status = status;
    this.errors = errors; // помилки валідації по полях
  }
}

async function request(url, { method = 'GET', body } = {}) {
  const options = { method, headers: {}, credentials: 'same-origin' };
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  if (res.status === 204) return null;

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* порожня або не JSON-відповідь */
  }

  if (!res.ok) {
    throw new ApiError(
      (data && data.error) || 'Помилка сервера: ' + res.status,
      res.status,
      (data && data.errors) || {}
    );
  }
  return data;
}

export const getDoctors = () => request('/api/doctors');
export const getDepartments = () => request('/api/departments');

export const register = values => request('/api/auth/register', { method: 'POST', body: values });
export const login = values => request('/api/auth/login', { method: 'POST', body: values });
export const logout = () => request('/api/auth/logout', { method: 'POST' });

// Повертає null, якщо користувач не авторизований
export async function getMe() {
  try {
    return await request('/api/auth/me');
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

export const getMyAppointments = () => request('/api/appointments');
export const createAppointment = values => request('/api/appointments', { method: 'POST', body: values });
export const deleteAppointment = id => request('/api/appointments/' + id, { method: 'DELETE' });
export const getBusyTimes = (doctorId, date) =>
  request('/api/appointments/busy?doctor_id=' + doctorId + '&date=' + date);

// ---------- AI (лабораторна №6) ----------
export const getAiStatus = () => request('/api/ai/status');
export const sendChat = messages => request('/api/ai/chat', { method: 'POST', body: { messages } });
export const analyzeReview = text => request('/api/ai/analyze', { method: 'POST', body: { text } });
