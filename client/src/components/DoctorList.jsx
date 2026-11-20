import DoctorCard from './DoctorCard.jsx';

export default function DoctorList({ doctors, favorites, onToggleFavorite, onBook }) {
  if (doctors.length === 0) {
    return <p className='empty'>Нічого не знайдено. Змініть запит або оберіть інше відділення.</p>;
  }

  return (
    <div className='cards'>
      {doctors.map(d => (
        <DoctorCard
          key={d.id}
          doctor={d}
          isFavorite={favorites.includes(d.id)}
          onToggleFavorite={onToggleFavorite}
          onBook={onBook}
        />
      ))}
    </div>
  );
}
