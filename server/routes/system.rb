# Службові маршрути: головна сторінка, health check, метрики

# Зібраний React-клієнт (у Docker копіюється в public/)
get '/' do
  index = File.join(settings.public_folder, 'index.html')
  halt 404, json_error('Клієнт не зібрано. Для розробки запустіть npm run dev у client/') unless File.exist?(index)
  content_type :html
  send_file index
end

# Перевірка стану: сервер + база даних
get '/api/health' do
  started = Process.clock_gettime(Process::CLOCK_MONOTONIC)
  begin
    DB.query('SELECT 1')
    db_ok = true
  rescue StandardError
    db_ok = false
  end
  db_ms = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - started) * 1000).round(1)

  status db_ok ? 200 : 503
  {
    status: db_ok ? 'ok' : 'degraded',
    database: db_ok ? 'up' : 'down',
    db_latency_ms: db_ms,
    uptime_seconds: Metrics.uptime,
    version: Config.version
  }.to_json
end

# Метрики: адміністратор (сесія) або власник токена METRICS_TOKEN
get '/api/metrics' do
  token = Config.metrics_token
  provided = request.env['HTTP_AUTHORIZATION'].to_s.sub(/\ABearer /, '')
  token_ok = !token.empty? && Rack::Utils.secure_compare(token, provided)

  user = current_user
  admin_ok = user && user['role'] == 'admin'
  halt 401, json_error('Потрібна авторизація') unless token_ok || admin_ok

  Metrics.snapshot.to_json
end
