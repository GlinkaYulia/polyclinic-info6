import { useEffect, useRef, useState } from 'react';
import useSessionStorage from '../hooks/useSessionStorage.js';
import { sendChat, ApiError } from '../api.js';

const MAX_LEN = 500;
const SUGGESTIONS = [
  'Які лікарі працюють у кардіологічному відділенні?',
  'Коли приймає терапевт?',
  'У якому кабінеті приймає невролог?'
];

export default function ChatWidget() {
  // Історія діалогу живе лише в межах вкладки
  const [messages, setMessages] = useSessionStorage('chatHistory', []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, loading]);

  async function send(text) {
    const content = text.trim();
    if (!content || loading) return;
    if (content.length > MAX_LEN) {
      setError('Повідомлення занадто довге (максимум ' + MAX_LEN + ' символів)');
      return;
    }

    const next = [...messages, { role: 'user', content }];
    setMessages(next);
    setInput('');
    setError('');
    setLoading(true);

    try {
      // Серверу надсилаємо лише останні повідомлення, обрізані до ліміту
      const history = next.slice(-6).map(m => ({ role: m.role, content: m.content.slice(0, MAX_LEN) }));
      const { reply } = await sendChat(history);
      setMessages([...next, { role: 'assistant', content: reply }]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не вдалося зʼєднатися із сервером');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    send(input);
  }

  return (
    <div className='chat'>
      <p className='muted small'>
        Помічник відповідає на питання про лікарів і відділення та не ставить діагнозів.
        У невідкладних випадках телефонуйте 103 або 112.
      </p>

      <div className='chat-log' aria-live='polite'>
        <div className='msg assistant'>
          Вітаю! Я віртуальний помічник поліклініки. Запитайте про лікарів, відділення чи графік прийому.
        </div>

        {messages.map((m, i) => (
          <div key={i} className={'msg ' + m.role}>{m.content}</div>
        ))}

        {loading && <div className='msg assistant typing'>Помічник друкує…</div>}
        <div ref={endRef} />
      </div>

      {messages.length === 0 && (
        <div className='chips'>
          {SUGGESTIONS.map(s => (
            <button key={s} type='button' className='chip' onClick={() => send(s)} disabled={loading}>
              {s}
            </button>
          ))}
        </div>
      )}

      {error && <p className='status error' role='alert'>{error}</p>}

      <form onSubmit={handleSubmit} className='chat-form'>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder='Ваше запитання…'
          maxLength={MAX_LEN}
          aria-label='Повідомлення для помічника'
        />
        <button type='submit' className='button' disabled={loading || !input.trim()}>Надіслати</button>
        {messages.length > 0 && (
          <button type='button' className='link-button' onClick={() => { setMessages([]); setError(''); }}>
            Очистити
          </button>
        )}
      </form>
    </div>
  );
}
