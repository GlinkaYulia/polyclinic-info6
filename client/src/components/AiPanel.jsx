import { useEffect, useState } from 'react';
import { getAiStatus } from '../api.js';
import ChatWidget from './ChatWidget.jsx';
import ReviewAnalyzer from './ReviewAnalyzer.jsx';

export default function AiPanel() {
  const [tab, setTab] = useState('chat');
  const [status, setStatus] = useState(null);

  useEffect(() => {
    getAiStatus().then(setStatus).catch(() => setStatus(null));
  }, []);

  return (
    <section className='panel' id='ai'>
      <h2>Розумний помічник</h2>

      {status && !status.configured && (
        <p className='status error'>AI-сервіс не налаштовано (немає API-ключа). Функції тимчасово недоступні.</p>
      )}
      {status && status.configured && status.provider === 'mock' && (
        <p className='status'>Демо-режим: відповіді формуються без підключення до AI.</p>
      )}

      <div className='tabs' role='tablist'>
        <button type='button' role='tab' aria-selected={tab === 'chat'}
                className={tab === 'chat' ? 'tab active' : 'tab'} onClick={() => setTab('chat')}>
          Чат-помічник
        </button>
        <button type='button' role='tab' aria-selected={tab === 'analyze'}
                className={tab === 'analyze' ? 'tab active' : 'tab'} onClick={() => setTab('analyze')}>
          Аналіз відгуку
        </button>
      </div>

      {tab === 'chat' ? <ChatWidget /> : <ReviewAnalyzer />}
    </section>
  );
}
