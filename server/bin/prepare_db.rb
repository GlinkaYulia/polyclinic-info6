# Створює таблиці та тестові дані, якщо БД порожня. Дані при повторному запуску не втрачаються.
# Запуск: ruby bin/prepare_db.rb
require 'pg'
require 'dotenv/load'

url = ENV['DATABASE_URL']
abort('DATABASE_URL не задано') if url.to_s.strip.empty?

candidates = [File.join(__dir__, '..', 'db'), File.join(__dir__, '..', '..', 'db')]
db_dir = candidates.find { |dir| File.exist?(File.join(dir, 'schema.sql')) }
abort('Не знайдено каталог db/ зі schema.sql') unless db_dir

conn = nil
10.times do |i|
  begin
    conn = PG.connect(url)
    break
  rescue PG::ConnectionBad => e
    puts "БД недоступна (спроба #{i + 1}/10): #{e.message.strip}"
    sleep 3
  end
end
abort('Не вдалося підключитися до БД') unless conn

def table_exists?(conn, name)
  !conn.exec_params('SELECT to_regclass($1)', ["public.#{name}"]).getvalue(0, 0).nil?
end

unless table_exists?(conn, 'departments')
  puts 'Створюю схему та тестові дані...'
  conn.exec(File.read(File.join(db_dir, 'schema.sql')))
  conn.exec(File.read(File.join(db_dir, 'seed.sql')))
end

unless table_exists?(conn, 'users')
  puts 'Створюю таблиці користувачів і записів...'
  conn.exec(File.read(File.join(db_dir, 'lab4.sql')))
end

puts 'БД готова.'
conn.close
