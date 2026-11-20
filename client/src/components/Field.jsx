// Поле форми з підписом і повідомленням про помилку
export default function Field({ label, name, error, children }) {
  return (
    <label className='field' htmlFor={name}>
      <span>{label}</span>
      {children}
      {error && (
        <small className='field-error' id={name + '-error'} role='alert'>
          {error}
        </small>
      )}
    </label>
  );
}
