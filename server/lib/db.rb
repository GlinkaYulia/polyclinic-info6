require 'pg'
require_relative 'config'

# Виконання параметризованих SQL-запитів до PostgreSQL
module DB
  def self.query(sql, params = [])
    conn = PG.connect(Config.database_url)
    conn.type_map_for_results = PG::BasicTypeMapForResults.new(conn)
    conn.exec_params(sql, params).to_a
  ensure
    conn&.close
  end
end
