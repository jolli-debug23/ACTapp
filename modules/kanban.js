/* ═══════════════════════════════════════════════
   KANBAN.JS — Tela Kanban com drag & drop
═══════════════════════════════════════════════ */
import { S, todayKey } from '../js/state.js';
import { gainXP, autosave, toast, burstParticles } from '../js/app.js';
import { checkAchievements } from '../js/achievements.js';

const KCOLS = [
  { id: 'todo', title: 'A Fazer', color: '#8b6cf6' },
  { id: 'doing', title: 'Em Andamento', color: '#fb923c' },
  { id: 'done', title: 'Concluído', color: '#34d399' },
];
const CAT_COLORS = { academico: '#8b6cf6', carreira: '#38bdf8', arte: '#f06292', saude: '#34d399' };
const CAT_LABELS = { academico: 'Académico', carreira: 'Carreira', arte: 'Arte & Exp.', saude: 'Saúde' };
const CAT_EMOJIS = { academico: '🎓', carreira: '💻', arte: '🎨', saude: '💚' };

let dragCardId = null;

window.filterKanban = function(f, el) {
  S.kFilter = f;
  document.querySelectorAll('.kanban-toolbar .chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderKanban();
};

window.openKanbanModal = function() {
  document.getElementById('kTitle').value = '';
  document.getElementById('kDate').value = '';
  document.getElementById('kSubs').value = '';
  window.openModal('kanbanModal');
};

window.saveKanban = function() {
  const title = document.getElementById('kTitle').value.trim();
  if (!title) return;
  const subs = document.getElementById('kSubs').value.split('\n').map(s => s.trim()).filter(Boolean);
  S.kanban.push({
    id: Date.now(),
    title,
    date: document.getElementById('kDate').value,
    cat: document.getElementById('kCat').value,
    priority: document.getElementById('kPriority').value,
    col: 'todo',
    subs: subs.map(s => ({ text: s, done: false }))
  });
  gainXP(5);
  window.closeModal('kanbanModal');
  autosave();
  renderKanban();
  checkAchievements();
};

window.moveCard = function(id, dir) {
  const card = S.kanban.find(k => k.id === id);
  if (!card) return;
  const cols = ['todo', 'doing', 'done'];
  const ni = cols.indexOf(card.col) + dir;
  if (ni < 0 || ni >= cols.length) return;
  card.col = cols[ni];
  if (card.col === 'done') {
    gainXP(20);
    burstParticles(window.innerWidth / 2, window.innerHeight * 0.4);
    toast('✅ Quest concluída! +20 XP');
    checkAchievements();
  }
  autosave();
  renderKanban();
};

window.delCard = function(id) {
  S.kanban = S.kanban.filter(k => k.id !== id);
  autosave();
  renderKanban();
};

window.toggleSub = function(cardId, subIdx) {
  const card = S.kanban.find(k => k.id === cardId);
  if (!card || !card.subs) return;
  card.subs[subIdx].done = !card.subs[subIdx].done;
  if (card.subs[subIdx].done) gainXP(3);
  autosave();
  renderKanban();
};

window.addSubtask = function(cardId) {
  const inp = document.getElementById('sub-inp-' + cardId);
  if (!inp) return;
  const text = inp.value.trim();
  if (!text) return;
  const card = S.kanban.find(k => k.id === cardId);
  if (!card.subs) card.subs = [];
  card.subs.push({ text, done: false });
  gainXP(2);
  inp.value = '';
  autosave();
  renderKanban();
};

// Drag & drop
window.onDragStart = function(e, id) {
  dragCardId = id;
  e.dataTransfer.effectAllowed = 'move';
  setTimeout(() => {
    const el = document.getElementById('kc-' + id);
    if (el) el.classList.add('dragging');
  }, 0);
};

window.onDragEnd = function(e) {
  const el = document.getElementById('kc-' + dragCardId);
  if (el) el.classList.remove('dragging');
  dragCardId = null;
  document.querySelectorAll('.kanban-cards-area').forEach(a => a.classList.remove('drag-over'));
};

window.onDragOver = function(e, col) {
  e.preventDefault();
  e.currentTarget.querySelector('.kanban-cards-area')?.classList.add('drag-over');
};

window.onDragLeave = function(e) {
  e.currentTarget.querySelector('.kanban-cards-area')?.classList.remove('drag-over');
};

window.onDrop = function(e, col) {
  e.preventDefault();
  if (!dragCardId) return;
  const card = S.kanban.find(k => k.id === dragCardId);
  if (card && card.col !== col) {
    card.col = col;
    if (col === 'done') {
      gainXP(20);
      burstParticles(e.clientX, e.clientY);
      toast('✅ +20 XP');
      checkAchievements();
    }
    autosave();
    renderKanban();
  }
  e.currentTarget.querySelector('.kanban-cards-area')?.classList.remove('drag-over');
};

export function renderKanban() {
  const container = document.getElementById('kanbanCols');
  if (!container) return;
  const filter = S.kFilter || 'all';
  const filtered = filter === 'all' ? S.kanban : S.kanban.filter(k => k.cat === filter);
  container.innerHTML = KCOLS.map(col => {
    const cards = filtered.filter(k => k.col === col.id);
    return `<div class="kanban-col" ondragover="onDragOver(event,'${col.id}')" ondrop="onDrop(event,'${col.id}')" ondragleave="onDragLeave(event)">
      <div class="kanban-col-hd">
        <span class="kanban-col-title" style="color:${col.color}">${col.title}</span>
        <span class="kanban-col-badge">${cards.length}</span>
      </div>
      <div class="kanban-cards-area">
        ${cards.length ? cards.map(c => kcardHTML(c)).join('') : '<div class="empty-state" style="padding:24px"><span class="empty-icon">📭</span></div>'}
      </div>
    </div>`;
  }).join('');
}

function kcardHTML(c) {
  const cc = CAT_COLORS[c.cat] || '#8b6cf6';
  const days = daysUntil(c.date);
  const daysBadge = c.date ? `<span class="kc-days ${days < 0 ? 'past' : days <= 2 ? 'soon' : 'ok'}">${days < 0 ? Math.abs(days) + 'd atrás' : days === 0 ? 'Hoje' : days + 'd'}</span>` : '';
  const subsHTML = (c.subs && c.subs.length) ? `<div class="subtasks">
    ${c.subs.map((s, i) => `<div class="subtask-row"><div class="subtask-cb ${s.done ? 'done' : ''}" onclick="toggleSub(${c.id},${i})">${s.done ? '✓' : ''}</div><span class="subtask-text ${s.done ? 'done' : ''}">${escHtml(s.text)}</span></div>`).join('')}
    <div class="add-sub-row"><input class="add-sub-input" id="sub-inp-${c.id}" placeholder="+ Subtarefa..." onkeydown="if(event.key==='Enter')addSubtask(${c.id})"><button class="btn btn-xs btn-ghost" onclick="addSubtask(${c.id})">+</button></div>
  </div>` : `<div class="add-sub-row" style="margin-top:12px"><input class="add-sub-input" id="sub-inp-${c.id}" placeholder="+ Subtarefa..." onkeydown="if(event.key==='Enter')addSubtask(${c.id})"><button class="btn btn-xs btn-ghost" onclick="addSubtask(${c.id})">+</button></div>`;
  return `<div class="kanban-card" style="--kc:${cc}" draggable="true" id="kc-${c.id}" ondragstart="onDragStart(event,${c.id})" ondragend="onDragEnd(event)">
    <div class="kc-title">${c.priority === 'urgente' ? '🔴 ' : ''}${escHtml(c.title)}</div>
    <div class="kc-meta"><span class="tag tag-accent">${CAT_EMOJIS[c.cat]} ${CAT_LABELS[c.cat]}</span>${daysBadge}</div>
    ${subsHTML}
    <div class="kc-actions">
      ${c.col !== 'todo' ? `<button class="btn btn-xs btn-ghost" onclick="moveCard(${c.id},-1)">← Voltar</button>` : ''}
      ${c.col !== 'done' ? `<button class="btn btn-xs btn-ghost" style="color:var(--emerald)" onclick="moveCard(${c.id},1)">Avançar →</button>` : ''}
      <button class="btn btn-xs btn-danger" onclick="delCard(${c.id})" style="margin-left:auto">✕</button>
    </div>
  </div>`;
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + ' 00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((d - today) / 86400000);
}

function escHtml(t) {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
