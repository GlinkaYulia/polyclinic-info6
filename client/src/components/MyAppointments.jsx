function formatDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('uk-UA');
}

export default function MyAppointments({ appointments, onDelete }) {
  return (
    <section className='panel'>
      <h2>Мої записи</h2>

      {appointments.length === 0 ? (
        <p className='muted'>У вас поки немає записів на прийом.</p>
      ) : (
        <ul className='appointments'>
          {appointments.map(a => (
            <li key={a.id}>
              <div>
                <strong>{formatDate(a.appointment_date)}, {a.appointment_time}</strong>
                <span>{a.doctor_name} — {a.specialty}, кабінет {a.room}</span>
                {a.comment && <em>{a.comment}</em>}
              </div>
              <button type='button' className='link-button' onClick={() => onDelete(a.id)}>
                Скасувати
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
