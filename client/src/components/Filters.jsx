export default function Filters({ filters, departments, onChange }) {
  return (
    <div className='filters'>
      <label className='field'>
        <span>Пошук за ПІБ або спеціальністю</span>
        <input
          type='search'
          value={filters.search}
          onChange={e => onChange({ search: e.target.value })}
          placeholder='Наприклад: кардіолог'
        />
      </label>

      <label className='field'>
        <span>Відділення</span>
        <select value={filters.departmentId} onChange={e => onChange({ departmentId: e.target.value })}>
          <option value=''>Усі відділення</option>
          {departments.map(dep => (
            <option key={dep.id} value={dep.id}>{dep.name}</option>
          ))}
        </select>
      </label>

      <label className='check'>
        <input
          type='checkbox'
          checked={filters.onlyFavorites}
          onChange={e => onChange({ onlyFavorites: e.target.checked })}
        />
        <span>Лише обрані</span>
      </label>
    </div>
  );
}
