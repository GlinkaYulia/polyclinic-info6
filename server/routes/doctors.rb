DOCTORS_SQL = <<~SQL
  SELECT d.id, d.full_name, d.specialty, d.room, d.schedule,
         d.experience_years, d.department_id, dep.name AS department
  FROM doctors d
  JOIN departments dep ON dep.id = d.department_id
SQL

helpers do
  def find_doctor(id)
    DB.query(DOCTORS_SQL + ' WHERE d.id = $1', [id]).first
  end

  def optional_text(data, key, max, errors)
    value = data[key]
    return nil if value.nil?
    unless value.is_a?(String) && value.strip.length <= max
      errors[key] = "Рядок до #{max} символів"
      return nil
    end
    value.strip.empty? ? nil : value.strip
  end

  # Повертає [очищені_дані, помилки]
  def validate_doctor(data)
    errors = {}
    full_name = text(data['full_name'])
    specialty = text(data['specialty'])
    errors['full_name'] = 'Обов’язкове поле (до 150 символів)' if full_name.empty? || full_name.length > 150
    errors['specialty'] = 'Обов’язкове поле (до 100 символів)' if specialty.empty? || specialty.length > 100

    department_id = data['department_id']
    unless department_id.is_a?(Integer) && department_id > 0
      errors['department_id'] = 'Має бути додатним цілим числом'
    end

    room = optional_text(data, 'room', 10, errors)
    schedule = optional_text(data, 'schedule', 100, errors)

    experience = data.fetch('experience_years', 0)
    unless experience.is_a?(Integer) && experience.between?(0, 70)
      errors['experience_years'] = 'Ціле число від 0 до 70'
    end

    if errors.empty? && DB.query('SELECT 1 FROM departments WHERE id = $1', [department_id]).empty?
      errors['department_id'] = 'Відділення не існує'
    end

    clean = {
      full_name: full_name, specialty: specialty, department_id: department_id,
      room: room, schedule: schedule, experience_years: experience
    }
    [clean, errors]
  end
end

# Список лікарів із пошуком і фільтрацією
get '/api/doctors' do
  conditions = []
  values = []

  search = params[:search].to_s.strip
  unless search.empty?
    # екрануємо спецсимволи ILIKE
    values << '%' + search.gsub(/[\\%_]/) { |m| '\\' + m } + '%'
    conditions << "(d.full_name ILIKE $#{values.size} OR d.specialty ILIKE $#{values.size})"
  end

  dep = Integer(params[:department_id], exception: false)
  if dep
    values << dep
    conditions << "d.department_id = $#{values.size}"
  end

  sql = DOCTORS_SQL
  sql += ' WHERE ' + conditions.join(' AND ') unless conditions.empty?
  DB.query(sql + ' ORDER BY d.full_name', values).to_json
end

get '/api/doctors/:id' do
  doctor = find_doctor(id_param)
  halt 404, json_error('Лікаря не знайдено') unless doctor
  doctor.to_json
end

post '/api/doctors' do
  clean, errors = validate_doctor(json_body)
  halt 422, json_error('Помилка валідації', errors) unless errors.empty?

  id = DB.query(
    'INSERT INTO doctors (full_name, specialty, department_id, room, schedule, experience_years)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
    clean.values_at(:full_name, :specialty, :department_id, :room, :schedule, :experience_years)
  ).first['id']

  status 201
  headers 'Location' => "/api/doctors/#{id}"
  find_doctor(id).to_json
end

put '/api/doctors/:id' do
  id = id_param
  halt 404, json_error('Лікаря не знайдено') unless find_doctor(id)

  clean, errors = validate_doctor(json_body)
  halt 422, json_error('Помилка валідації', errors) unless errors.empty?

  DB.query(
    'UPDATE doctors
     SET full_name = $1, specialty = $2, department_id = $3, room = $4, schedule = $5, experience_years = $6
     WHERE id = $7',
    clean.values_at(:full_name, :specialty, :department_id, :room, :schedule, :experience_years) + [id]
  )
  find_doctor(id).to_json
end

delete '/api/doctors/:id' do
  deleted = DB.query('DELETE FROM doctors WHERE id = $1 RETURNING id', [id_param])
  halt 404, json_error('Лікаря не знайдено') if deleted.empty?
  halt 204
end
