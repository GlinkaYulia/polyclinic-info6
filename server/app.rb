# Сервер інформаційно-довідкової системи поліклініки (лабораторна №6)
# Запуск: bundle exec ruby app.rb
require 'sinatra'
require 'json'
require 'date'
require 'time'
require 'pg'
require 'bcrypt'
require 'dotenv/load'
require_relative 'lib/config'
require_relative 'lib/metrics'
require_relative 'lib/db'
require_relative 'lib/validation'
require_relative 'lib/ai'

$stdout.sync = true

# Конфігурація зі змінних середовища (перевіряється при старті)
Config.database_url
set :port, Config.port
set :bind, '0.0.0.0'
set :show_exceptions, false
set :dump_errors, true

# Сесії: підписана cookie із захисними прапорцями
enable :sessions
set :sessions, key: 'polyclinic.session', httponly: true, same_site: :lax,
               secure: Config.production?, expire_after: 8 * 60 * 60
set :session_secret, Config.session_secret

MAX_BODY = 20_000
WRITE_METHODS = %w[POST PUT PATCH DELETE].freeze
RATE_LIMITS = {}
RATE_MUTEX = Mutex.new

helpers do
  def json_error(message, errors = nil)
    body = { error: message }
    body[:errors] = errors if errors
    body.to_json
  end

  # Читає тіло запиту як JSON-об'єкт (з обмеженням розміру)
  def json_body
    halt 413, json_error('Забагато даних у запиті') if request.content_length.to_i > MAX_BODY
    raw = request.body.read(MAX_BODY + 1).to_s
    halt 413, json_error('Забагато даних у запиті') if raw.bytesize > MAX_BODY
    data = JSON.parse(raw)
    halt 400, json_error('Тіло запиту має бути JSON-об’єктом') unless data.is_a?(Hash)
    data
  rescue JSON::ParserError
    halt 400, json_error('Некоректний JSON')
  end

  def id_param
    id = Integer(params[:id], exception: false)
    halt 400, json_error('Ідентифікатор має бути додатним цілим числом') if id.nil? || id < 1
    id
  end

  def text(value)
    value.is_a?(String) ? value.strip : ''
  end

  # Поточний користувач із сесії (або nil)
  def current_user
    return @current_user if defined?(@current_user)
    uid = session[:user_id]
    @current_user = uid ? DB.query('SELECT id, email, full_name, role FROM users WHERE id = $1', [uid]).first : nil
  end

  def require_auth!
    user = current_user
    halt 401, json_error('Потрібна авторизація') unless user
    user
  end

  def require_admin!
    user = require_auth!
    halt 403, json_error('Недостатньо прав') unless user['role'] == 'admin'
    user
  end

  # Простий обмежувач частоти запитів (за ключем, зазвичай IP)
  def rate_limited?(key, limit: 10, window: 60)
    now = Time.now.to_f
    RATE_MUTEX.synchronize do
      hits = (RATE_LIMITS[key] || []).select { |t| now - t < window }
      hits << now
      RATE_LIMITS[key] = hits
      hits.size > limit
    end
  end
end

# Початок вимірювання часу запиту (має бути першим фільтром)
before do
  @request_started = Process.clock_gettime(Process::CLOCK_MONOTONIC)
end

before do
  content_type :json
  headers 'Cache-Control' => 'no-store', 'Referrer-Policy' => 'no-referrer'

  # Зміна довідників лікарів і відділень — лише для адміністратора
  if WRITE_METHODS.include?(request.request_method) && request.path_info.match?(%r{\A/api/(doctors|departments)})
    require_admin!
  end
end

# Метрики та структурований лог (JSON). Персональні дані й тіло запиту не логуються.
after do
  next unless @request_started

  ms = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - @request_started) * 1000).round(1)
  Metrics.record(response.status, ms)

  unless request.path_info == '/api/health'
    $stdout.puts JSON.generate(
      time: Time.now.utc.iso8601, method: request.request_method, path: request.path_info,
      status: response.status, duration_ms: ms, ip: request.ip
    )
  end
end

error PG::UniqueViolation do
  status 409
  json_error('Запис з такими даними вже існує')
end

error PG::ForeignKeyViolation do
  status 409
  json_error('Операція порушує зв’язки між даними (є пов’язані записи)')
end

error PG::Error do
  status 500
  json_error('Помилка бази даних')
end

require_relative 'routes/system'
require_relative 'routes/doctors'
require_relative 'routes/departments'
require_relative 'routes/auth'
require_relative 'routes/appointments'
require_relative 'routes/ai'
require_relative 'routes/docs'

# Невідомі маршрути /api/* -> 404 у форматі JSON (має бути в кінці)
%w[get post put patch delete].each do |verb|
  send(verb, '/api/*') { halt 404, json_error('Ресурс не знайдено') }
end
