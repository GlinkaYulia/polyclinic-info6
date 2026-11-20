require_relative 'config'

# Прості метрики в пам'яті процесу
module Metrics
  STARTED_AT = Time.now
  MUTEX = Mutex.new
  MAX_SAMPLES = 1000

  @total = 0
  @classes = Hash.new(0)
  @durations = []

  class << self
    def record(status, duration_ms)
      MUTEX.synchronize do
        @total += 1
        @classes["#{status / 100}xx"] += 1
        @durations << duration_ms
        @durations.shift if @durations.size > MAX_SAMPLES
      end
    end

    def uptime
      (Time.now - STARTED_AT).to_i
    end

    def snapshot
      MUTEX.synchronize do
        sorted = @durations.sort
        avg = sorted.empty? ? 0 : (sorted.sum / sorted.size).round(2)
        p95 = sorted.empty? ? 0 : sorted[((sorted.size - 1) * 0.95).round]
        server_errors = @classes['5xx']
        {
          version: Config.version,
          uptime_seconds: uptime,
          requests_total: @total,
          responses: @classes.dup,
          avg_ms: avg,
          p95_ms: p95,
          error_rate_percent: @total.zero? ? 0 : (server_errors * 100.0 / @total).round(2),
          memory_mb: memory_mb
        }
      end
    end

    private

    # Пам'ять процесу (Linux); на інших системах повертає nil
    def memory_mb
      rss = File.read('/proc/self/status')[/VmRSS:\s+(\d+)/, 1]
      rss ? (rss.to_i / 1024.0).round(1) : nil
    rescue StandardError
      nil
    end
  end
end
