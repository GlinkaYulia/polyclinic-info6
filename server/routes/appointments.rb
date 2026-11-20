APPOINTMENT_SQL = <<~SQL
  SELECT a.id, a.doctor_id, d.full_name AS doctor_name, d.specialty, d.room,
         a.patient_name, a.phone,
         to_char(a.appointment_date, 'YYYY-MM-DD') AS appointment_date,
         to_char(a.appointment_time, 'HH24:MI') AS appointment_time,
         a.comment
  FROM appointments a
  JOIN doctors d ON d.id = a.doctor_id
SQL

# Зайняті години лікаря на дату (публічний, без персональних даних)
get '/api/appointments/busy' do
  doctor_id = Integer(params[:doctor_id], exception: false)
  date = begin
    Date.iso8601(params[:date].to_s)
  rescue ArgumentError
    nil
  end
  halt 400, json_error('Потрібні doctor_id та date (РРРР-ММ-ДД)') unless doctor_id && date

  DB.query(
    "SELECT to_char(appointment_time, 'HH24:MI') AS t
     FROM appointments WHERE doctor_id = $1 AND appointment_date = $2::date",
    [doctor_id, date.iso8601]
  ).map { |row| row['t'] }.to_json
end

# Лише записи поточного користувача
get '/api/appointments' do
  user = require_auth!
  DB.query(
    APPOINTMENT_SQL + ' WHERE a.user_id = $1 ORDER BY a.appointment_date, a.appointment_time',
    [user['id']]
  ).to_json
end

post '/api/appointments' do
  user = require_auth!
  clean, errors = Validation.appointment(json_body)

  if errors.empty? && DB.query('SELECT 1 FROM doctors WHERE id = $1', [clean[:doctor_id]]).empty?
    errors['doctor_id'] = 'Лікаря не існує'
  end
  halt 422, json_error('Помилка валідації', errors) unless errors.empty?

  begin
    id = DB.query(
      'INSERT INTO appointments
         (user_id, doctor_id, patient_name, phone, appointment_date, appointment_time, comment)
       VALUES ($1, $2, $3, $4, $5::date, $6::time, $7) RETURNING id',
      [user['id'], clean[:doctor_id], clean[:patient_name], clean[:phone],
       clean[:date], clean[:time], clean[:comment]]
    ).first['id']
  rescue PG::UniqueViolation
    halt 409, json_error('Цей час уже зайнятий. Оберіть інший.')
  end

  status 201
  headers 'Location' => "/api/appointments/#{id}"
  DB.query(APPOINTMENT_SQL + ' WHERE a.id = $1', [id]).first.to_json
end

# Видалити можна лише свій запис; чужий дає 404 (без розкриття існування)
delete '/api/appointments/:id' do
  user = require_auth!
  deleted = DB.query(
    'DELETE FROM appointments WHERE id = $1 AND user_id = $2 RETURNING id',
    [id_param, user['id']]
  )
  halt 404, json_error('Запис не знайдено') if deleted.empty?
  halt 204
end
