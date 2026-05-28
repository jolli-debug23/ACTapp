/* ═══════════════════════════════════════════════
   APP.JS — Inicialização, navegação, timer, XP
═══════════════════════════════════════════════ */
import { S, load, save, seed, dailyReset, todayKey, yesterdayKey } from './state.js';
import { renderHome } from '../modules/home.js';
import { renderKanban } from '../modules/kanban.js';
import { renderRitmos } from '../modules/ritmos.js';
import { renderRoadmap } from '../modules/roadmap.js';
import { renderMetrics } from '../modules/metrics.js';
import { renderProfile } from '../modules/profile.js';
import { checkAchievements } from './achievements.js';

// ── SETUP ──
export function init() {
  load();
  seed();
  dailyReset();
  if (S.theme && S.theme !== 'dark') document.body.setAttribute('data-theme', S.theme);
  const mc = document.getElementById('themeColorMeta');
  const colors = { dark:'#0e0e16', fantasy:'#080612', light:'#f2f2f8', highcontrast:'#000000' };
  if (mc) mc.content = colors[S.theme] || '#0e0e16';
  renderHome();
  renderKanban();
  renderRitmos();
  renderRoadmap();
  checkAchievements();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
}

// ── NAVEGAÇÃO ──
window.navigate = function(screenId, btn) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  const screen = document.getElementById('screen-' + screenId);
  if (screen) {
    screen.classList.add('active');
    if (btn) btn.classList.add('active');
    const renders = { home: renderHome, kanban: renderKanban, ritmos: renderRitmos, roadmap: renderRoadmap, metrics: renderMetrics, profile: renderProfile };
    if (renders[screenId]) renders[screenId]();
  }
};

// ── TIMER ──
const MODES = [25, 50, 90];
let timerMode = 0, timerRunning = false, timerSecs = 25 * 60, timerInterval = null, timerStartTime = null, timerCategory = 'academico';

function updateTimerDisplay() {
  const m = Math.floor(timerSecs / 60).toString().padStart(2, '0');
  const s = (timerSecs % 60).toString().padStart(2, '0');
  const el = document.getElementById('timerDisplay');
  if (el) el.textContent = m + ':' + s;
}

window.toggleTimer = function() {
  if (timerRunning) {
    clearInterval(timerInterval);
    timerRunning = false;
    const el = document.getElementById('timerDisplay');
    if (el) el.classList.remove('running');
    document.getElementById('timerBtnText').textContent = '▶ Retomar';
    document.getElementById('timerLbl').textContent = 'Em pausa';
    const elapsed = Math.floor((Date.now() - timerStartTime) / 1000);
    recordSession(elapsed);
  } else {
    timerRunning = true;
    timerStartTime = Date.now();
    timerCategory = document.getElementById('timerCat')?.value || 'academico';
    const el = document.getElementById('timerDisplay');
    if (el) el.classList.add('running');
    document.getElementById('timerBtnText').textContent = '⏸ Pausar';
    const CAT_LABELS = { academico: 'Académico', carreira: 'Carreira', arte: 'Arte & Exp.', saude: 'Saúde' };
    document.getElementById('timerLbl').textContent = `A focar em ${CAT_LABELS[timerCategory]}`;
    timerInterval = setInterval(() => {
      timerSecs--;
      updateTimerDisplay();
      if (timerSecs <= 0) {
        clearInterval(timerInterval);
        timerRunning = false;
        const el = document.getElementById('timerDisplay');
        if (el) el.classList.remove('running');
        const secs = MODES[timerMode] * 60;
        recordSession(secs);
        timerSecs = MODES[timerMode] * 60;
        updateTimerDisplay();
        document.getElementById('timerBtnText').textContent = '▶ Iniciar';
        document.getElementById('timerLbl').textContent = '✅ Sessão concluída!';
        gainXP(MODES[timerMode] * 2);
        toast(`🎉 +${MODES[timerMode] * 2} XP — sessão de ${MODES[timerMode]}min!`);
      }
    }, 1000);
  }
};

window.resetTimer = function() {
  clearInterval(timerInterval);
  timerRunning = false;
  const el = document.getElementById('timerDisplay');
  if (el) el.classList.remove('running');
  timerSecs = MODES[timerMode] * 60;
  updateTimerDisplay();
  document.getElementById('timerBtnText').textContent = '▶ Iniciar';
  document.getElementById('timerLbl').textContent = 'Pronto para começar';
};

window.cycleTimerMode = function() {
  timerMode = (timerMode + 1) % MODES.length;
  timerSecs = MODES[timerMode] * 60;
  updateTimerDisplay();
  document.getElementById('timerModeBtn').textContent = `🍅 ${MODES[timerMode]}min`;
  if (!timerRunning) document.getElementById('timerLbl').textContent = 'Pronto para começar';
};

function recordSession(secs) {
  if (secs < 30) return;
  const now = new Date();
  const key = now.toISOString().slice(0, 10);
  if (!S.timerSessions[key]) S.timerSessions[key] = {};
  S.timerSessions[key][timerCategory] = (S.timerSessions[key][timerCategory] || 0) + secs;
  S.sessions.push({ cat: timerCategory, secs, start: now.toISOString() });
  checkAchievements();
  save();
  renderHome();
}

// ── XP / LEVEL ──
function xpForLevel(lvl) { return Math.floor(120 * Math.pow(1.3, lvl - 1)); }

export function gainXP(amount, x, y) {
  if (x != null && y != null) xpBurst('+' + amount + ' XP', x, y);
  S.xp += amount;
  S.gold += Math.floor(amount / 10);
  let levelUp = false;
  while (S.xp >= xpForLevel(S.level)) {
    S.xp -= xpForLevel(S.level);
    S.level++;
    levelUp = true;
  }
  if (levelUp) setTimeout(() => toast(`⚡ Nível ${S.level}! Continue assim.`), 500);
  save();
  updateHero();
  checkAchievements();
}

function xpBurst(text, x, y) {
  const el = document.createElement('div');
  el.className = 'xp-burst';
  el.textContent = text;
  el.style.cssText = `left:${x - 28}px;top:${y - 20}px;color:var(--accent2)`;
  document.getElementById('fxLayer')?.appendChild(el);
  setTimeout(() => el.remove(), 1400);
}

export function burstParticles(x, y) {
  const cols = ['#8b6cf6', '#34d399', '#fb7185', '#fbbf24', '#38bdf8'];
  for (let i = 0; i < 14; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const angle = Math.random() * 360, dist = 45 + Math.random() * 95;
    p.style.cssText = `left:${x}px;top:${y}px;width:${5 + Math.random() * 6}px;height:${5 + Math.random() * 6}px;background:${cols[i % cols.length]};--px:${Math.cos(angle * Math.PI / 180) * dist}px;--py:${Math.sin(angle * Math.PI / 180) * dist - 70}px;--pd:${0.4 + Math.random() * 0.6}s`;
    document.getElementById('fxLayer')?.appendChild(p);
    setTimeout(() => p.remove(), 950);
  }
}

// ── HERO UPDATE ──
export function updateHero() {
  const LEVELS = ['Explorador', 'Aprendiz', 'Estudioso', 'Praticante', 'Analista', 'Especialista', 'Mestre', 'Sábio', 'Lendário', 'Transcendente'];
  const xpN = xpForLevel(S.level);
  const cur = S.xp % xpN;
  const pct = Math.min(100, Math.round(cur / xpN * 100));
  const lvlName = LEVELS[Math.min(S.level - 1, LEVELS.length - 1)];
  
  const avatarEl = document.getElementById('avatarEmoji');
  if (avatarEl) avatarEl.textContent = S.avatar;
  const badgeEl = document.getElementById('avatarLvlBadge');
  if (badgeEl) badgeEl.textContent = S.level;
  const nameEl = document.getElementById('heroName');
  if (nameEl) nameEl.textContent = S.name || 'Clica para definir nome';
  const classEl = document.getElementById('heroClass');
  if (classEl) classEl.textContent = `Nível ${S.level} — ${lvlName}`;
  const xpEl = document.getElementById('xpText');
  if (xpEl) xpEl.textContent = `${cur} / ${xpN} XP`;
  const pctEl = document.getElementById('xpPct');
  if (pctEl) pctEl.textContent = `${pct}%`;
  const barEl = document.getElementById('xpBar');
  if (barEl) barEl.style.width = pct + '%';
  const goldEl = document.getElementById('statGold');
  if (goldEl) goldEl.textContent = S.gold || 0;
  
  // Profile
  const profileAvatarEl = document.getElementById('profileAvatarEmoji');
  if (profileAvatarEl) profileAvatarEl.textContent = S.avatar;
  const profileNameEl = document.getElementById('profileName');
  if (profileNameEl) profileNameEl.textContent = S.name || '—';
  const profileClassEl = document.getElementById('profileClass');
  if (profileClassEl) profileClassEl.textContent = `Nível ${S.level} — ${lvlName}`;
  const xpText2El = document.getElementById('xpText2');
  if (xpText2El) xpText2El.textContent = `${cur}/${xpN} XP`;
  const barEl2 = document.getElementById('xpBar2');
  if (barEl2) barEl2.style.width = pct + '%';
}

// ── MODAL / DRAWER ──
window.openModal = function(id) { document.getElementById(id)?.classList.add('open'); };
window.closeModal = function(id) { document.getElementById(id)?.classList.remove('open'); };
window.openCapture = function() {
  document.getElementById('captureOverlay')?.classList.add('open');
  document.getElementById('captureDrawer')?.classList.add('open');
};
window.closeCapture = function() {
  document.getElementById('captureOverlay')?.classList.remove('open');
  document.getElementById('captureDrawer')?.classList.remove('open');
};

// ── THEME ──
window.applyTheme = function(id) {
  S.theme = id;
  document.body.setAttribute('data-theme', id === 'dark' ? '' : id);
  const mc = document.getElementById('themeColorMeta');
  const colors = { dark: '#0e0e16', fantasy: '#080612', light: '#f2f2f8', highcontrast: '#000000' };
  if (mc) mc.content = colors[id] || '#0e0e16';
  save();
  renderProfile();
  toast('🎨 Tema aplicado!');
};

window.selectChip = function(el, hiddenId) {
  const group = el.closest('.chip-group');
  group?.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  const inp = document.getElementById(hiddenId);
  if (inp) inp.value = el.dataset.val || '';
};

// ── TOAST ──
export function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.getElementById('toastStack')?.appendChild(el);
  setTimeout(() => el.remove(), 2900);
}

// ── AUTOSAVE ──
let asTimer = null;
export function autosave() {
  clearTimeout(asTimer);
  asTimer = setTimeout(() => {
    save();
    const pill = document.getElementById('autosavePill');
    pill?.classList.add('show');
    setTimeout(() => pill?.classList.remove('show'), 1400);
  }, 600);
}

// ── AVATAR PICKER ──
const AVATARS = ['🧙', '🧝', '🦸', '🌱', '🔬', '🎨', '🎵', '💫', '🧬', '🔭', '🧩', '🦋', '🐉', '🌊', '⚡'];
window.pickAvatar = function(a) {
  S.avatar = a;
  autosave();
  renderProfile();
  updateHero();
};

window.saveProfile = function() {
  S.name = document.getElementById('profileNameInput')?.value?.trim() || '';
  closeModal('avatarModal');
  autosave();
  updateHero();
  toast('✅ Perfil guardado!');
};

window.openAvatarModal = function() {
  const inp = document.getElementById('profileNameInput');
  if (inp) inp.value = S.name || '';
  renderAvatarChips('avatarPickerModal');
  openModal('avatarModal');
};

function renderAvatarChips(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = AVATARS.map(a => 
    `<div class="chip ${S.avatar === a ? 'active' : ''}" onclick="pickAvatar('${a}')" style="font-size:1.6rem;padding:8px 12px">${a}</div>`
  ).join('');
}

// ── INIT ON DOM READY ──
document.addEventListener('DOMContentLoaded', init);
