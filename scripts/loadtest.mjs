// Простий навантажувальний тест (Node.js 18+, без залежностей).
// Використання: node scripts/loadtest.mjs <url> [запитів=200] [одночасно=10]
const [url, total = '200', concurrency = '10'] = process.argv.slice(2);

if (!url) {
  console.error('Використання: node scripts/loadtest.mjs <url> [запитів] [одночасно]');
  process.exit(1);
}

const N = Number(total);
const C = Number(concurrency);
const times = [];
let errors = 0;
let sent = 0;

async function worker() {
  while (sent < N) {
    sent++;
    const t0 = performance.now();
    try {
      const res = await fetch(url);
      await res.arrayBuffer();
      if (!res.ok) errors++;
    } catch {
      errors++;
    }
    times.push(performance.now() - t0);
  }
}

const started = performance.now();
await Promise.all(Array.from({ length: C }, worker));
const seconds = (performance.now() - started) / 1000;

times.sort((a, b) => a - b);
const pct = p => times[Math.min(times.length - 1, Math.floor(times.length * p))];
const avg = times.reduce((s, t) => s + t, 0) / times.length;

console.log('URL:               ' + url);
console.log('Запитів:           ' + N + ' (одночасно ' + C + ')');
console.log('Загальний час:     ' + seconds.toFixed(2) + ' с');
console.log('Пропускна здатність: ' + (N / seconds).toFixed(1) + ' запитів/с');
console.log('Середній час:      ' + avg.toFixed(1) + ' мс');
console.log('p50:               ' + pct(0.5).toFixed(1) + ' мс');
console.log('p95:               ' + pct(0.95).toFixed(1) + ' мс');
console.log('Максимум:          ' + times[times.length - 1].toFixed(1) + ' мс');
console.log('Помилок:           ' + errors + ' (' + ((errors * 100) / N).toFixed(1) + '%)');
