# Інформаційно-довідкова система поліклініки

Лабораторна робота №6. Інтеграція з AI: чат-бот і аналіз відгуків (Google Gemini / OpenAI / демо-режим).

## Нове в цій лабораторній
- `server/lib/ai.rb` — клієнт AI API (Net::HTTP), нормалізація відповідей
- `server/routes/ai.rb` — `/api/ai/status`, `/api/ai/chat`, `/api/ai/analyze`
- `client/src/components/` — `AiPanel`, `ChatWidget`, `ReviewAnalyzer`

## Налаштування AI (`server/.env`)
```
AI_PROVIDER=mock        # mock | gemini | openai
GEMINI_API_KEY=         # ключ із Google AI Studio
GEMINI_MODEL=gemini-flash-latest
OPENAI_API_KEY=
OPENAI_MODEL=
```
- `mock` працює без ключа (демо). Для реального AI виберіть `gemini` та вставте ключ.
- Назви моделей змінюються — перевіряйте актуальні в документації провайдера.
- Ключ ніколи не додавайте в код або в Git: лише в `.env` / змінні середовища Render.

## Запуск
```bash
psql -U postgres -c "CREATE DATABASE polyclinic ENCODING 'UTF8';"
cd server && cp .env.example .env     # заповніть значення
bundle install
ruby bin/prepare_db.rb
bundle exec ruby app.rb               # http://localhost:4567
cd ../client && npm install && npm run dev   # http://localhost:5173
```
Увійдіть у застосунок — з'явиться блок «Розумний помічник».

## Перевірка через curl
```bash
curl -i -c cookies.txt -X POST http://localhost:4567/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password1"}'

curl -b cookies.txt -X POST http://localhost:4567/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Які кардіологи у вас працюють?"}]}'

curl -b cookies.txt -X POST http://localhost:4567/api/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{"text":"Дякую лікарю, прийняв швидко, але в черзі довго чекав."}'
```

## Деплой на Render
Як у лабораторній №5. У вкладці **Environment** додайте `GEMINI_API_KEY` (у Blueprint для нього стоїть `sync: false`, Render попросить значення).

## Типові проблеми
- **503 «AI-сервіс не налаштовано»** — не задано ключ для вибраного `AI_PROVIDER`.
- **502 від AI** — невірний ключ, назва моделі або вичерпано ліміт; дивіться `upstream_status` у логах.
- **Порожня відповідь моделі** — модель може витрачати ліміт токенів на «роздуми»; змініть `GEMINI_MODEL` або збільште `maxOutputTokens` у `lib/ai.rb`.
- **429** — перевищено 12 запитів на хвилину.
