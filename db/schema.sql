-- Схема БД інформаційно-довідкової системи поліклініки
DROP TABLE IF EXISTS doctors;
DROP TABLE IF EXISTS departments;

CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE doctors (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  specialty VARCHAR(100) NOT NULL,
  department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  room VARCHAR(10),
  schedule VARCHAR(100),
  experience_years INTEGER NOT NULL DEFAULT 0 CHECK (experience_years >= 0)
);

CREATE INDEX idx_doctors_department ON doctors(department_id);
