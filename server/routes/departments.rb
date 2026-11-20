DEPARTMENTS_SQL = <<~SQL
  SELECT dep.id, dep.name, dep.description, COUNT(d.id)::int AS doctors_count
  FROM departments dep
  LEFT JOIN doctors d ON d.department_id = dep.id
SQL

get '/api/departments' do
  DB.query(DEPARTMENTS_SQL + ' GROUP BY dep.id ORDER BY dep.name').to_json
end

get '/api/departments/:id' do
  row = DB.query(DEPARTMENTS_SQL + ' WHERE dep.id = $1 GROUP BY dep.id', [id_param]).first
  halt 404, json_error('Відділення не знайдено') unless row
  row.to_json
end

post '/api/departments' do
  data = json_body
  name = text(data['name'])
  errors = {}
  errors['name'] = 'Обов’язкове поле (до 100 символів)' if name.empty? || name.length > 100

  description = data['description']
  if !description.nil? && !description.is_a?(String)
    errors['description'] = 'Має бути рядком'
    description = nil
  end
  description = description.to_s.strip
  description = nil if description.empty?
  halt 422, json_error('Помилка валідації', errors) unless errors.empty?

  id = DB.query(
    'INSERT INTO departments (name, description) VALUES ($1, $2) RETURNING id',
    [name, description]
  ).first['id']

  status 201
  headers 'Location' => "/api/departments/#{id}"
  DB.query(DEPARTMENTS_SQL + ' WHERE dep.id = $1 GROUP BY dep.id', [id]).first.to_json
end

# Якщо у відділенні є лікарі, СУБД поверне порушення зовнішнього ключа -> 409
delete '/api/departments/:id' do
  deleted = DB.query('DELETE FROM departments WHERE id = $1 RETURNING id', [id_param])
  halt 404, json_error('Відділення не знайдено') if deleted.empty?
  halt 204
end
