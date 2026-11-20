import { useState } from 'react';
import { analyzeReview, ApiError } from '../api.js';

const MIN_LEN = 10;
const MAX_LEN = 1000;

const SENTIMENT_LABELS = {
  positive: 'Позитивний',
  neutral: 'Нейтральний',
  negative: 'Негативний'
};

export default function ReviewAnalyzer() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const value = text.trim();
    if (value.length < MIN_LEN || value.length > MAX_LEN) {
      setError('Відгук: від ' + MIN_LEN + ' до ' + MAX_LEN + ' символів');
      return;
    }

    setError('');
    setResult(null);
    setCopied(false);
    setLoading(true);
    try {
      setResult(await analyzeReview(value));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не вдалося зʼєднатися із сервером');
    } finally {
      setLoading(false);
    }
  }

  async function copyReply() {
    try {
      await navigator.clipboard.writeText(result.suggested_reply);
      setCopied(true);
    } catch {
      setError('Не вдалося скопіювати. Виділіть текст і скопіюйте вручну.');
    }
  }

  return (
    <div>
      <p className='muted small'>
        Вставте відгук пацієнта (без персональних даних) — система визначить тональність, теми та запропонує відповідь.
      </p>

      <form onSubmit={handleSubmit} className='form' noValidate>
        <label className='field'>
          <span>Текст відгуку ({text.length}/{MAX_LEN})</span>
          <textarea rows={5} maxLength={MAX_LEN} value={text} onChange={e => setText(e.target.value)} />
        </label>
        <div className='actions'>
          <button type='submit' className='button' disabled={loading}>
            {loading ? 'Аналізуємо…' : 'Проаналізувати'}
          </button>
        </div>
      </form>

      {error && <p className='status error' role='alert'>{error}</p>}

      {result && (
        <section className='result' aria-label='Результат аналізу'>
          <div className='result-head'>
            <span className={'badge ' + result.sentiment}>{SENTIMENT_LABELS[result.sentiment]}</span>
            <span className='muted small'>Оцінка: {result.score}</span>
          </div>

          <div className='meter' role='img' aria-label={'Оцінка тональності ' + result.score + ' зі шкали від −1 до 1'}>
            <div className={'meter-fill ' + result.sentiment} style={{ width: ((result.score + 1) / 2) * 100 + '%' }} />
          </div>

          {result.topics.length > 0 && (
            <ul className='topics'>
              {result.topics.map(t => <li key={t}>{t}</li>)}
            </ul>
          )}

          <h3>Коротко</h3>
          <p>{result.summary}</p>

          <h3>Пропонована відповідь</h3>
          <p className='reply'>{result.suggested_reply}</p>
          <button type='button' className='link-button' onClick={copyReply}>
            {copied ? 'Скопійовано ✓' : 'Копіювати відповідь'}
          </button>
        </section>
      )}
    </div>
  );
}
