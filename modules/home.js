/* ═══════════════════════════════════════════════
   HOME.JS — Tela inicial do Lab
═══════════════════════════════════════════════ */
import { S, todayKey } from '../js/state.js';
import { updateHero, autosave, toast } from '../js/app.js';
import { checkAchievements } from '../js/achievements.js';

const CAT_LABELS = { academico: 'Académico', carreira: 'Carreira', arte: 'Arte & Exp.', saude: 'Saúde' };
const CAT_EMOJIS = { academico: '🎓', carreira: '💻', arte: '🎨', saude: '💚' };

export function renderHome() {
  updateHero();
  updateSummary();
  renderStreakRow();
  checkArtAlert();
}

function updateSummary() {
  const today = todayKey();
  const pending = S.kanban.filter(k => k.col !== 'done').length;
  const doneHabits = S.ritmos.filter(r => r.lastDone === today).length;
  const weekSecs = S.sessions.filter(s => new Date(s.start) >= new Date(Date.now() - 7 * 86400000)).reduce((a, s) => a + s.secs, 0);
  const ms = Math.max(0, ...Object.values(S.streaks || {}).map(st => st.count || 0));
  
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('sumPending', pending);
  set('sumHabits', `${doneHabits}/${S.ritmos.length}`);
  set('sumStreak', ms + '🔥');
  set('sumSessions', Math.round(weekSecs / 3600 * 10) / 10 + 'h');
}

function renderStreakRow() {
  const row = document.getElementById('streakRow');
  if (!row) return;
  if (!S.ritmos.length) {
    row.innerHTML = '<div class="text-sm text-dim" style="padding:16px">Adiciona ritmos no separador Ritmos</div>';
    return;
  }
  row.innerHTML = S.ritmos.map(r => {
    const st = (S.streaks[r.id] || {}).count || 0;
    return `<div class="streak-chip ${st >= 3 ? 'hot' : ''}"><div class="streak-num">${st}</div><div class="streak-name">${r.emoji} ${r.name}</div></div>`;
  }).join('');
}

function checkArtAlert() {
  const alert = document.getElementById('balanceAlert');
  if (!alert) return;
  const cutoff = new Date(Date.now() - 7 * 86400000).toISOString();
  const hasArt = S.sessions.some(s => s.cat === 'arte' && s.start >= cutoff);
  alert.classList.toggle('show', !hasArt);
}
