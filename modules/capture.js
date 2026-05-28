/* ═══════════════════════════════════════════════
   CAPTURE.JS — Captura rápida com editor MD
═══════════════════════════════════════════════ */
import { S, todayKey } from '../js/state.js';
import { gainXP, autosave, toast } from '../js/app.js';
import { checkAchievements } from '../js/achievements.js';

const NOTE_TAGS = { arte: '🎨 Arte', livro: '📖 Escrita', carreira: '💻 Carreira', pessoal: '💭 Pessoal' };

window.setCaptureTab = function(tab, el) {
  document.querySelectorAll('.capture-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.capture-panel').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  const panelId = 'capture' + tab.charAt(0).toUpperCase() + tab.slice(1);
  document.getElementById(panelId)?.classList.add('active');
};

window.insertMd = function(pre, post) {
  const ta = document.getElementById('noteText');
  if (!ta) return;
  const s = ta.selectionStart, e = ta.selectionEnd, v = ta.value;
  const sel = v.substring(s, e);
  ta.value = v.substring(0, s) + pre + sel + post + v.substring(e);
  ta.focus();
  ta.selectionStart = s + pre.length;
  ta.selectionEnd = s + pre.length + sel.length;
};

window.togglePreview = function() {
  const write = document.getElementById('noteWriteWrap');
  const preview = document.getElementById('notePreviewWrap');
  if (!write || !preview) return;
  const isHidden = write.classList.contains('hidden');
  write.classList.toggle('hidden');
  preview.classList.toggle('hidden');
  if (!isHidden) updatePreview();
};

function updatePreview() {
  const md = document.getElementById('noteText')?.value || '';
  const preview = document.getElementById('notePreview');
  if (preview) preview.innerHTML = renderMd(md);
}

function renderMd(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n/g, '<br>');
}

window.saveNote = function() {
  const text = document.getElementById('noteText')?.value?.trim();
  if (!text) return;
  S.notes.unshift({
    id: Date.now(),
    tag: document.getElementById('noteTag')?.value || 'pessoal',
    text,
    date: new Date().toISOString(),
    pinned: false
  });
  document.getElementById('noteText').value = '';
  gainXP(3);
  checkAchievements();
  autosave();
  renderNotes();
  toast('💡 Insight guardado!');
};

window.pinNote = function(id) {
  const n = S.notes.find(x => x.id === id);
  if (n) {
    n.pinned = !n.pinned;
    autosave();
    renderNotes();
  }
};

window.delNote = function(id) {
  S.notes = S.notes.filter(n => n.id !== id);
  autosave();
  renderNotes();
};

export function renderNotes() {
  const q = document.getElementById('noteSearch')?.value?.toLowerCase() || '';
  let notes = [...S.notes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  if (q) notes = notes.filter(n => n.text.toLowerCase().includes(q) || n.tag.includes(q));
  const el = document.getElementById('savedNotesList');
  if (!el) return;
  el.innerHTML = notes.slice(0, 12).map(n => `<div class="note-card ${n.pinned ? 'pinned' : ''}">
    <div class="note-card-hd">
      <div class="note-card-tags">
        <span class="tag tag-accent" style="font-size:0.72rem">${NOTE_TAGS[n.tag] || n.tag}</span>
        <span class="tag" style="font-size:0.68rem">${relDate(n.date)}</span>
      </div>
      <div class="note-card-actions">
        <button class="pin-btn btn ${n.pinned ? 'active' : ''}" onclick="pinNote(${n.id})">📌</button>
        <button class="btn text-dim" style="font-size:0.8rem;padding:3px 7px;min-height:auto" onclick="delNote(${n.id})">✕</button>
      </div>
    </div>
    <div class="note-card-body">${renderMd(n.text)}</div>
  </div>`).join('') || '<div class="empty-state" style="padding:24px"><span class="empty-text">Sem notas ainda.</span></div>';
}

window.addQuickTodo = function() {
  const inp = document.getElementById('quickTodoInput');
  const text = inp?.value?.trim();
  if (!text) return;
  S.quickTodos.unshift({ id: Date.now(), text, done: false });
  inp.value = '';
  autosave();
  renderQuickTodos();
};

window.toggleQuickTodo = function(id) {
  const t = S.quickTodos.find(x => x.id === id);
  if (t) {
    t.done = !t.done;
    if (t.done) gainXP(5);
  }
  autosave();
  renderQuickTodos();
};

export function renderQuickTodos() {
  const el = document.getElementById('quickTodoList');
  if (!el) return;
  el.innerHTML = S.quickTodos.slice(0, 15).map(t => `<div class="todo-item">
    <div class="todo-check ${t.done ? 'done' : ''}" onclick="toggleQuickTodo(${t.id})">${t.done ? '✓' : ''}</div>
    <span class="todo-text ${t.done ? 'done' : ''}">${escHtml(t.text)}</span>
    <button class="btn text-dim" style="font-size:0.8rem;padding:3px 8px;min-height:auto;margin-left:auto" onclick="S.quickTodos=S.quickTodos.filter(x=>x.id!==${t.id});autosave();renderQuickTodos()">✕</button>
  </div>`).join('') || '<div class="empty-state" style="padding:24px"><span class="empty-text">Sem tarefas rápidas.</span></div>';
}

function relDate(iso) {
  const d = Date.now() - new Date(iso);
  const m = Math.floor(d / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return m + 'min';
  if (m < 1440) return Math.floor(m / 60) + 'h';
  return Math.floor(m / 1440) + 'd';
}

function escHtml(t) {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
