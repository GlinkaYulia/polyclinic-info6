import { useState } from 'react';

export default function DoctorCard({ doctor, isFavorite, onToggleFavorite, onBook }) {
  const [open, setOpen] = useState(false);

  return (
    <article className='card'>
      <div className='card-head'>
        <h3>{doctor.full_name}</h3>
        <button
          type='button'
          className='star'
          onClick={() => onToggleFavorite(doctor.id)}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? 'Прибрати з обраних' : 'Додати до обраних'}
          title={isFavorite ? 'Прибрати з обраних' : 'Додати до обраних'}
        >
          {isFavorite ? '★' : '☆'}
        </button>
      </div>

      <p className='spec'>{doctor.specialty}</p>
      <p>Кабінет: {doctor.room}</p>
      <p>Прийом: {doctor.schedule}</p>

      <div className='actions'>
        <button type='button' className='button small' onClick={() => onBook(doctor)}>
          Записатися
        </button>
        <button type='button' className='link-button' onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? 'Сховати деталі' : 'Детальніше'}
        </button>
      </div>

      {open && (
        <dl className='details'>
          <dt>Відділення</dt><dd>{doctor.department}</dd>
          <dt>Стаж</dt><dd>{doctor.experience_years} р.</dd>
        </dl>
      )}
    </article>
  );
}
