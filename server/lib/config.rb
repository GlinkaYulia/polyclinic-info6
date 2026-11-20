require 'openssl'

# Конфігурація зі змінних середовища (Twelve-Factor App)
module Config
  module_function

  def production?
    ENV['RACK_ENV'] == 'production'
  end

  # Обов'язкова змінна: якщо її немає, сервер зупиняється з зрозумілим повідомленням
  def fetch!(key)
    value = ENV[key].to_s.strip
    abort("Не задано змінну середовища #{key}. Дивіться .env.example") if value.empty?
    value
  end

  def database_url
    fetch!('DATABASE_URL')
  end

  # Секрет «розтягується» SHA-512, щоб підпис cookie мав достатню довжину
  def session_secret
    raw = fetch!('SESSION_SECRET')
    abort('SESSION_SECRET занадто короткий (мінімум 32 символи)') if production? && raw.length < 32
    OpenSSL::Digest::SHA512.hexdigest(raw)
  end

  def port
    ENV.fetch('PORT', '4567').to_i
  end

  def metrics_token
    ENV['METRICS_TOKEN'].to_s
  end

  def version
    (ENV['RENDER_GIT_COMMIT'] || 'dev')[0, 7]
  end

  # ---- Інтеграція з AI (лабораторна №6) ----
  AI_PROVIDERS = %w[gemini openai mock].freeze

  def ai_provider
    provider = (ENV['AI_PROVIDER'].to_s.strip.empty? ? 'mock' : ENV['AI_PROVIDER']).strip.downcase
    abort("AI_PROVIDER має бути одним із: #{AI_PROVIDERS.join(', ')}") unless AI_PROVIDERS.include?(provider)
    provider
  end

  def gemini_api_key
    ENV['GEMINI_API_KEY'].to_s.strip
  end

  def gemini_model
    safe_model(ENV['GEMINI_MODEL'].to_s.strip.empty? ? 'gemini-flash-latest' : ENV['GEMINI_MODEL'])
  end

  def openai_api_key
    ENV['OPENAI_API_KEY'].to_s.strip
  end

  def openai_model
    ENV['OPENAI_MODEL'].to_s.strip
  end

  # Назва моделі потрапляє в URL, тому допускаємо лише безпечні символи
  def safe_model(name)
    value = name.to_s.strip
    abort("Некоректна назва моделі: #{value}") unless value.match?(/\A[A-Za-z0-9._-]+\z/)
    value
  end
end
