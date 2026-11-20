require 'date'

# Серверна валідація вхідних даних. Усі методи повертають очищені дані та хеш помилок.
module Validation
  EMAIL_RE = /\A[^@\s]+@[^@\s]+\.[^@\s]+\z/
  NAME_RE  = /\A\p{L}[\p{L}\s'’.\-]*\z/
  PHONE_RE = /\A\+?\d{10,13}\z/
  TIME_RE  = /\A(\d{2}):(\d{2})\z/

  module_function

  def str(value)
    value.is_a?(String) ? value.strip : ''
  end

  def name(value, field, errors, label)
    v = str(value)
    if v.length < 2 || v.length > 150
      errors[field] = "#{label}: від 2 до 150 символів"
    elsif !v.match?(NAME_RE)
      errors[field] = "#{label}: лише літери, пробіли, апостроф, дефіс і крапка"
    end
    v
  end

  def email(value, errors)
    v = str(value).downcase
    errors['email'] = 'Некоректний email' if v.length > 254 || !v.match?(EMAIL_RE)
    v
  end

  def password(value, errors)
    v = value.is_a?(String) ? value : ''
    if v.length < 8 || v.bytesize > 72
      errors['password'] = 'Пароль: щонайменше 8 символів, не більше 72 байт'
    elsif !v.match?(/\p{L}/) || !v.match?(/\d/)
      errors['password'] = 'Пароль має містити літеру та цифру'
    end
    v
  end

  def phone(value, errors)
    v = str(value).gsub(/[\s\-()]/, '')
    errors['phone'] = 'Телефон: від 10 до 13 цифр, можливий префікс +' unless v.match?(PHONE_RE)
    v
  end

  def date(value, errors)
    v = str(value)
    d = Date.iso8601(v)
    today = Date.today
    errors['appointment_date'] = 'Дата: від сьогодні до 90 днів уперед' if d < today || d > today + 90
    d.iso8601
  rescue ArgumentError
    errors['appointment_date'] = 'Дата має бути у форматі РРРР-ММ-ДД'
    v
  end

  def time(value, errors)
    v = str(value)
    m = TIME_RE.match(v)
    unless m && m[1].to_i.between?(8, 18) && [0, 30].include?(m[2].to_i)
      errors['appointment_time'] = 'Час: з 08:00 до 18:30 із кроком 30 хвилин'
    end
    v
  end

  def register(data)
    errors = {}
    clean = {
      full_name: name(data['full_name'], 'full_name', errors, 'ПІБ'),
      email: email(data['email'], errors),
      password: password(data['password'], errors)
    }
    [clean, errors]
  end

  def appointment(data)
    errors = {}
    doctor_id = data['doctor_id']
    errors['doctor_id'] = 'Оберіть лікаря' unless doctor_id.is_a?(Integer) && doctor_id > 0

    comment = data['comment']
    if comment.nil?
      comment = nil
    elsif !comment.is_a?(String) || comment.strip.length > 500
      errors['comment'] = 'Коментар: до 500 символів'
      comment = nil
    else
      comment = comment.strip
      comment = nil if comment.empty?
    end

    clean = {
      doctor_id: doctor_id,
      patient_name: name(data['patient_name'], 'patient_name', errors, 'ПІБ'),
      phone: phone(data['phone'], errors),
      date: date(data['appointment_date'], errors),
      time: time(data['appointment_time'], errors),
      comment: comment
    }
    [clean, errors]
  end
end
