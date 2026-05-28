/* ═══════════════════════════════════════════════
   RITMOS.JS — Hábitos diários com heatmap
═══════════════════════════════════════════════ */
import { S, todayKey, yesterdayKey } from '../js/state.js';
import { gainXP, autosave, toast } from '../js/app.js';
import { checkAchievements } from '../js/achievements.js';

window.openRitoModal = function() {
  document.getElementById('rName').value = '';
  document.getElementById('rEmoji').value = '';
  window.openModal('ritoModal');
};

window.saveRito = function() {
  const name = document.getElementById('rName').value.trim();
  if (!name) return;
  S.ritmos.push({
    id: Date.now(),
    name,
    type: document.getElementById('rType').value,
    emoji: document.getElementById('rEmoji').value || '🌀',
    lastDone: null
  });
  gainXP(5);
  window.closeModal('ritoModal');
  autosave();
  renderRitmos();
  checkAchievements();
};

window.toggleRito = function(id, ev) {
  const r = S.ritmos.find(x => x.id === id);
  if (!r) return;
  const today = todayKey();
  const yest = yesterdayKey();
  const wasDone = r.lastDone === today;
  if (!wasDone) {
    r.lastDone = today;
    const st = S.streaks[id] || { count: 0, lastDate: null };
    st.count = st.lastDate === yest ? st.count + 1 : 1;
    st.lastDate = today;
    S.streaks[id] = st;
    gainXP(10, ev?.clientX, ev?.clientY);
    if (st.count % 5 === 0) toast(`🔥 Streak de ${st.count} dias em "${r.name}"!`);
  } else {
    r.lastDone = null;
  }
  checkAchievements();
  autosave();
  renderRitmos();
};

window.delRito = function(id) {
  S.ritmos = S.ritmos.filter(r => r.id !== id);
  autosave();
  renderRitmos();
};

export function renderRitmos() {
  renderHeatmap();
  ['manutencao', 'abastecimento'].forEach(type => {
    const container = document.getElementById(type === 'manutencao' ? 'ritosManuList' : 'ritosAbasList');
    if (!container) return;
    const items = S.ritmos.filter(r => r.type === type);
    const today = todayKey();
    if (!items.length) {
      container.innerHTML = `<div class="empty-state" style="padding:24px"><span class="empty-icon">✨</span><span class="empty-text">Sem ritmos ${type === 'manutencao' ? 'de manutenção' : 'criativos'} ainda.</span></div>`;
      return;
    }
    container.innerHTML = items.map(r => {
      const done = r.lastDone === today;
      const st = (S.streaks[r.id] || {}).count || 0;
      return `<div class="ritmo-card ${done ? 'done' : ''}">
        <div class="ritmo-check ${done ? 'done' : ''}" onclick="toggleRito(${r.id},event)">${done ? '✓' : ''}</div>
        <div class="ritmo-info">
          <div class="ritmo-name">${r.emoji} ${r.name}</div>
          ${st > 0 ? `<div class="ritmo-streak">🔥 ${st} dias</div>` : ''}
        </div>
        <div class="ritmo-actions">
          <button class="btn btn-icon-sm text-dim" onclick="delRito(${r.id})">✕</button>
        </div>
      </div>`;
    }).join('');
  });
}

function renderHeatmap() {
  const wrap = document.getElementById('heatmapWrap');
  if (!wrap) return;
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const grid = [];
  for (let w = 12; w >= 0; w--) {
    const week = [];
    for (let d = 6; d >= 0; d--) {
      const date = new Date(Date.now() - (w * 7 + d) * 86400000);
      const key = date.toISOString().slice(0, 10);
      const done = S.ritmos.filter(r => {
        if (r.lastDone === key) return true;
        const st = S.streaks[r.id];
        if (!st) return false;
        const lastDate = r.lastDone ? new Date(r.lastDone) : null;
        if (!lastDate) return false;
        const diff = Math.floor((lastDate - date) / 86400000);
        return diff >= 0 && diff < (st.count || 0);
      }).length;
      const total = S.ritmos.length || 1;
      const ratio = done / total;
      const level = ratio === 0 ? '' : ratio < 0.25 ? 'l1' : ratio < 0.5 ? 'l2' : ratio < 0.75 ? 'l3' : 'l4';
      week.push({ key, level, done, total, date });
    }
    grid.push(week);
  }
  wrap.innerHTML = `<div class="heatmap-wrap">
    <div class="heatmap-title">Consistência — 91 dias</div>
    <div style="overflow-x:auto;padding-bottom:8px">
      <div style="display:flex;gap:3px;padding-left:28px">
        ${grid.map((week, wi) => {
          const mo = months[week[0].date.getMonth()];
          const showMo = wi === 0 || grid[wi - 1][0].date.getMonth() !== week[0].date.getMonth();
          return `<div style="display:flex;flex-direction:column;gap:3px">
            <div style="font-size:0.68rem;color:var(--text2);height:14px;font-family:var(--mono);text-align:center">${showMo ? mo : ''}</div>
            ${week.map(d => `<div class="hm-day ${d.level}" title="${d.key}: ${d.done}/${d.total}"></div>`).join('')}
          </div>`;
        }).join('')}
      </div>
    </div>
    <div class="heatmap-legend">
      <span style="font-size:0.72rem">Menos</span>
      <div class="hm-leg" style="background:var(--elevated)"></div>
      <div class="hm-leg l1" style="background:rgba(139,108,246,0.22)"></div>
      <div class="hm-leg l2" style="background:rgba(139,108,246,0.45)"></div>
      <div class="hm-leg l3" style="background:rgba(139,108,246,0.7)"></div>
      <div class="hm-leg l4" style="background:var(--accent2)"></div>
      <span style="font-size:0.72rem">Mais</span>
    </div>
  </div>`;
}
