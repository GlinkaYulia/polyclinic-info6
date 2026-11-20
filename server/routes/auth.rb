# Фіктивний хеш: перевірка паролю виконується завжди, щоб час відповіді
# не показував, чи існує користувач із таким email
DUMMY_DIGEST = BCrypt::Password.create('dummy-password-1')

helpers do
  def user_json(user)
    { id: user['id'], email: user['email'], full_name: user['full_name'], role: user['role'] }.to_json
  end

  def check_rate_limit!
    halt 429, json_error('Забагато спроб. Спробуйте за хвилину') if rate_limited?("auth:#{request.ip}")
  end
end

post '/api/auth/register' do
  check_rate_limit!
  clean, errors = Validation.register(json_body)
  halt 422, json_error('Помилка валідації', errors) unless errors.empty?

  digest = BCrypt::Password.create(clean[:password])
  user = DB.query(
    'INSERT INTO users (email, password_digest, full_name) VALUES ($1, $2, $3)
     RETURNING id, email, full_name, role',
    [clean[:email], digest.to_s, clean[:full_name]]
  ).first

  session.clear
  session[:user_id] = user['id']
  status 201
  user_json(user)
rescue PG::UniqueViolation
  halt 409, json_error('Помилка валідації', { 'email' => 'Цей email уже зареєстровано' })
end

post '/api/auth/login' do
  check_rate_limit!
  data = json_body
  email = Validation.str(data['email']).downcase
  password = data['password'].is_a?(String) ? data['password'] : ''

  user = DB.query(
    'SELECT id, email, full_name, role, password_digest FROM users WHERE email = $1', [email]
  ).first

  digest = BCrypt::Password.new(user ? user['password_digest'] : DUMMY_DIGEST)
  password_ok = digest == password
  halt 401, json_error('Невірний email або пароль') unless user && password_ok

  session.clear
  session[:user_id] = user['id']
  user_json(user)
end

post '/api/auth/logout' do
  session.clear
  halt 204
end

get '/api/auth/me' do
  user_json(require_auth!)
end
