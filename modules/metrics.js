/* ═══════════════════════════════════════════════
   METRICS.JS — Dashboard analítico
═══════════════════════════════════════════════ */
import { S, getCatSecs, maxStreak, calcBestDay } from '../js/state.js';

const CAT_COLORS = { academico: '#8b6cf6', carreira: '#38bdf8', arte: '#f06292', saude: '#34d399' };
const CAT_LABELS = { academico: 'Académico', carreira: 'Carreira', arte: 'Arte & Exp.', saude: 'Saúde' };

let charts = {}, period = 'day';

window.setPeriod = function(p, el) {
  period = p;
  document.querySelectorAll('.period-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderMetrics();
};

function getSessions() {
  const now = new Date();
  let cutoff;
  if (period === 'day') cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  else if (period === 'week') cutoff = new Date(now.getTime() - 7 * 86400000);
  else cutoff = new Date(now.getTime() - 30 * 86400000);
  return S.sessions.filter(s => new Date(s.start) >= cutoff);
}

function totalSecs(s) { return s.reduce((a, ss) => a + ss.secs, 0); }

export function renderMetrics() {
  const sessions = getSessions();
  const cats = ['academico', 'carreira', 'arte', 'saude'];
  const catMin = {};
  cats.forEach(c => { catMin[c] = Math.round(sessions.filter(s => s.cat === c).reduce((a, s) => a + s.secs, 0) / 60); });
  const total = Object.values(catMin).reduce((a, b) => a + b, 0) || 1;

  // Balance score
  const minCat = Math.min(...Object.values(catMin));
  const maxCat = Math.max(...Object.values(catMin)) || 1;
  const balance = total > 0 ? Math.round(100 * (1 - (maxCat - minCat) / maxCat)) : 0;
  const scoreEl = document.getElementById('balanceScore');
  if (scoreEl) {
    scoreEl.textContent = total > 0 ? balance + '%' : '—';
    scoreEl.style.color = balance >= 60 ? 'var(--emerald)' : balance >= 30 ? 'var(--warn)' : 'var(--rose)';
  }
  const noteEl = document.getElementById('balanceNote');
  if (noteEl) noteEl.textContent = total === 0 ? 'Usa o timer para gerar dados' : balance >= 60 ? 'Excelente equilíbrio!' : balance >= 30 ? 'Algumas categorias em falta' : 'Distribui melhor o foco';

  const barsEl = document.getElementById('balanceBars');
  if (barsEl) barsEl.innerHTML = cats.map(c => `<div class="bsb-label">
    <span>${CAT_LABELS[c]}</span>
    <span style="color:${CAT_COLORS[c]}">${catMin[c]}min</span>
  </div>
  <div class="progress-bar"><div class="progress-fill" style="background:${CAT_COLORS[c]};width:${total ? Math.round(catMin[c] / Math.max(...Object.values(catMin), 1) * 100) : 0}%"></div></div>`).join('');

  // Records
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('recBestDay', calcBestDay());
  set('recMaxStreak', maxStreak());
  set('recArtHours', Math.round(getCatSecs('arte') / 360) / 10 + 'h');
  set('recTasksDone', S.kanban.filter(k => k.col === 'done').length);

  // Chart barras
  const ctxCats = document.getElementById('chartCats')?.getContext('2d');
  if (ctxCats) {
    if (charts.cats) charts.cats.destroy();
    charts.cats = new Chart(ctxCats, {
      type: 'bar',
      data: {
        labels: cats.map(c => CAT_LABELS[c]),
        datasets: [{
          data: cats.map(c => catMin[c]),
          backgroundColor: cats.map(c => CAT_COLORS[c] + '99'),
          borderColor: cats.map(c => CAT_COLORS[c]),
          borderWidth: 1.5,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: 'rgba(26,26,38,0.95)', titleColor: '#eeeef8', bodyColor: '#9090b0', borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1, cornerRadius: 8 }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#9090b0', font: { size: 11 } } },
          x: { grid: { display: false }, ticks: { color: '#9090b0', font: { size: 11 } } }
        }
      }
    });
    const legEl = document.getElementById('catLegend');
    if (legEl) legEl.innerHTML = cats.map(c => `<div class="cat-leg-item"><div class="cat-leg-dot" style="background:${CAT_COLORS[c]}"></div>${CAT_LABELS[c]}: ${catMin[c]}min</div>`).join('');
  }

  // Chart doughnut
  const ctxBal = document.getElementById('chartBalance')?.getContext('2d');
  if (ctxBal) {
    if (charts.bal) charts.bal.destroy();
    const bData = cats.map(c => catMin[c]);
    charts.bal = new Chart(ctxBal, {
      type: 'doughnut',
      data: {
        labels: cats.map(c => CAT_LABELS[c]),
        datasets: [{
          data: bData.every(v => v === 0) ? [1, 1, 1, 1] : bData,
          backgroundColor: cats.map(c => CAT_COLORS[c] + 'cc'),
          borderColor: 'transparent',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '58%',
        plugins: {
          legend: { position: 'bottom', labels: { color: '#9090b0', font: { size: 12 }, boxWidth: 10, padding: 14 } },
          tooltip: { backgroundColor: 'rgba(26,26,38,0.95)', titleColor: '#eeeef8', bodyColor: '#9090b0', borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1, cornerRadius: 8 }
        }
      }
    });
  }

  // Chart linha
  const ctxLine = document.getElementById('chartLine')?.getContext('2d');
  if (ctxLine) {
    if (charts.line) charts.line.destroy();
    const days = [], labels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000), key = d.toISOString().slice(0, 10);
      const secs = S.sessions.filter(s => s.start.startsWith(key)).reduce((a, s) => a + s.secs, 0);
      days.push(Math.round(secs / 60));
      labels.push(d.toLocaleDateString('pt', { weekday: 'short' }));
    }
    charts.line = new Chart(ctxLine, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Minutos',
          data: days,
          borderColor: '#8b6cf6',
          backgroundColor: 'rgba(139,108,246,0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#8b6cf6',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: 'rgba(26,26,38,0.95)', titleColor: '#eeeef8', bodyColor: '#9090b0', borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1, cornerRadius: 8 }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#9090b0', font: { size: 11 } } },
          x: { grid: { display: false }, ticks: { color: '#9090b0', font: { size: 11 } } }
        }
      }
    });
  }

  // Sessions list
  const sessEl = document.getElementById('sessionsList');
  if (sessEl) {
    const recent = [...S.sessions].reverse().slice(0, 6);
    sessEl.innerHTML = recent.length ? recent.map(s => {
      const catEmojis = { academico: '🎓', carreira: '💻', arte: '🎨', saude: '💚' };
      return `<div class="session-item">
        <div>
          <span class="session-cat" style="color:${CAT_COLORS[s.cat]}">${catEmojis[s.cat]} ${CAT_LABELS[s.cat]}</span>
          <div class="session-time-ago">${relDate(s.start)}</div>
        </div>
        <span class="session-dur">${fmtSecs(s.secs)}</span>
      </div>`;
    }).join('') : '<div class="empty-state" style="padding:40px"><span class="empty-icon">⏱️</span><span class="empty-text">Sem sessões. Usa o Timer no Lab!</span></div>';
  }
}

function relDate(iso) {
  const d = Date.now() - new Date(iso);
  const m = Math.floor(d / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return m + 'min';
  if (m < 1440) return Math.floor(m / 60) + 'h';
  return Math.floor(m / 1440) + 'd';
}

function fmtSecs(s) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}
