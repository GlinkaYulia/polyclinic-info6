import { useEffect, useMemo, useState } from 'react';
import {
  getDoctors, getDepartments, getMe, logout,
  getMyAppointments, deleteAppointment
} from './api.js';
import useLocalStorage from './hooks/useLocalStorage.js';
import AuthPanel from './components/AuthPanel.jsx';
import AppointmentForm from './components/AppointmentForm.jsx';
import MyAppointments from './components/MyAppointments.jsx';
import Filters from './components/Filters.jsx';
import DoctorList from './components/DoctorList.jsx';
import AiPanel from './components/AiPanel.jsx';

const DEFAULT_FILTERS = { search: '', departmentId: '', onlyFavorites: false };

function sortByDate(list) {
  return [...list].sort((a, b) =>
    (a.appointment_date + a.appointment_time).localeCompare(b.appointment_date + b.appointment_time)
  );
}

export default function App() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [notice, setNotice] = useState('');

  // Дані, що зберігаються в localStorage
  const [storedFilters, setStoredFilters] = useLocalStorage('filters', DEFAULT_FILTERS);
  const [favorites, setFavorites] = useLocalStorage('favorites', []);
  const filters = { ...DEFAULT_FILTERS, ...storedFilters };

  // Довідники
  useEffect(() => {
    Promise.all([getDoctors(), getDepartments()])
      .then(([doctorsData, departmentsData]) => {
        setDoctors(doctorsData);
        setDepartments(departmentsData);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Відновлення сесії після оновлення сторінки
  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setAuthChecked(true));
  }, []);

  // Записи поточного користувача
  useEffect(() => {
    if (!user) {
      setAppointments([]);
      return;
    }
    getMyAppointments()
      .then(setAppointments)
      .catch(() => setAppointments([]));
  }, [user]);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return doctors.filter(d =>
      (!filters.departmentId || String(d.department_id) === String(filters.departmentId)) &&
      (!filters.onlyFavorites || favorites.includes(d.id)) &&
      (d.full_name.toLowerCase().includes(q) || d.specialty.toLowerCase().includes(q))
    );
  }, [doctors, filters.search, filters.departmentId, filters.onlyFavorites, favorites]);

  function handleFiltersChange(patch) {
    setStoredFilters({ ...filters, ...patch });
  }

  function toggleFavorite(id) {
    setFavorites(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  }

  function handleBook(doctor) {
    if (!user) {
      setNotice('Щоб записатися на прийом, увійдіть або зареєструйтесь.');
      document.getElementById('auth')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    setNotice('');
    setSelectedDoctor(doctor);
    setTimeout(() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' }), 0);
  }

  function handleAuth(nextUser) {
    setUser(nextUser);
    setNotice('');
  }

  async function handleLogout() {
    try {
      await logout();
    } catch {
      /* навіть якщо запит не вдався, очищаємо стан клієнта */
    }
    try {
      localStorage.removeItem('appointmentDraft'); // персональні дані не залишаємо
    } catch {
      /* сховище недоступне */
    }
    setSelectedDoctor(null);
    setUser(null);
    setNotice('Ви вийшли з облікового запису.');
  }

  function handleCreated(appointment) {
    setAppointments(prev => sortByDate([...prev, appointment]));
    setSelectedDoctor(null);
    setNotice('Запис на прийом створено.');
  }

  async function handleDeleteAppointment(id) {
    try {
      await deleteAppointment(id);
      setAppointments(prev => prev.filter(a => a.id !== id));
      setNotice('Запис скасовано.');
    } catch (err) {
      setNotice(err.message);
    }
  }

  return (
    <>
      <header className='site-header'>
        <span className='brand'>Міська поліклініка №1</span>
        {user && (
          <div className='user-box'>
            <span>{user.full_name}</span>
            <button type='button' className='link-button' onClick={handleLogout}>Вийти</button>
          </div>
        )}
      </header>

      <main className='container'>
        <h1>Знайдіть свого лікаря</h1>
        <p className='lead'>Довідкова система: спеціалісти, кабінети та запис на прийом.</p>

        {notice && <p className='status' role='status'>{notice}</p>}

        {authChecked && !user && <AuthPanel onAuth={handleAuth} />}

        {user && (
          <MyAppointments appointments={appointments} onDelete={handleDeleteAppointment} />
        )}

        {user && selectedDoctor && (
          <AppointmentForm
            key={selectedDoctor.id}
            doctor={selectedDoctor}
            user={user}
            onCreated={handleCreated}
            onCancel={() => setSelectedDoctor(null)}
          />
        )}

        {user && <AiPanel />}
        {authChecked && !user && (
          <p className='muted'>Після входу стане доступний розумний помічник: чат і аналіз відгуків.</p>
        )}

        <h2 className='section-title'>Лікарі</h2>

        {loading && <p className='status'>Завантаження даних…</p>}

        {error && (
          <p className='status error' role='alert'>
            Не вдалося завантажити дані. {error}. Перевірте, чи запущено сервер і базу даних.
          </p>
        )}

        {!loading && !error && (
          <>
            <Filters filters={filters} departments={departments} onChange={handleFiltersChange} />
            <p className='count' aria-live='polite'>Знайдено лікарів: {filtered.length}</p>
            <DoctorList
              doctors={filtered}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onBook={handleBook}
            />
          </>
        )}
      </main>

      <footer className='site-footer'>
        <p>© {new Date().getFullYear()} Навчальний проєкт, лабораторна робота №6.</p>
      </footer>
    </>
  );
}
