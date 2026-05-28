// global-api.js - Versão definitiva: importa todos os módulos e expõe globalmente

// Importa todos os módulos como objetos
import * as stateModule from './state.js';
import * as homeModule from '../modules/home.js';
import * as kanbanModule from '../modules/kanban.js';
import * as ritmosModule from '../modules/ritmos.js';
import * as roadmapModule from '../modules/roadmap.js';
import * as metricsModule from '../modules/metrics.js';
import * as profileModule from '../modules/profile.js';
import * as captureModule from '../modules/capture.js';
import * as achievementsModule from './achievements.js';

// Extrai as funções que precisamos (mas vamos expor todas)
const { S, load, save, seed, dailyReset, todayKey, yesterdayKey } = stateModule;

// ─────────────────────────────────────────────────────────────
// FUNÇÕES GLOBAIS DEFINIDAS AQUI (navegação, timer, tema, etc.)
// ─────────────────────────────────────────────────────────────

// Navegação
window.navigate = function(screenId, btn) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  const screen = document.getElementById('screen-' + screenId);
  if (screen) {
    screen.classList.add('active');
    if (btn) btn.classList.add('active');
    const renders = { 
      home: homeModule.renderHome, 
      kanban: kanbanModule.renderKanban, 
      ritmos: ritmosModule.renderRitmos, 
      roadmap: roadmapModule.renderRoadmap, 
      metrics: metricsModule.renderMetrics, 
      profile: profileModule.renderProfile 
    };
    if (renders[screenId]) renders[screenId]();
  }
};

// Modais
window.openModal = (id) => document.getElementById(id)?.classList.add('open');
window.closeModal = (id) => document.getElementById(id)?.classList.remove('open');

// Capture drawer
window.openCapture = function() {
  document.getElementById('captureOverlay')?.classList.add('open');
  document.getElementById('captureDrawer')?.classList.add('open');
  if (captureModule.renderNotes) captureModule.renderNotes();
  if (captureModule.renderQuickTodos) captureModule.renderQuickTodos();
};
window.closeCapture = function() {
  document.getElementById('captureOverlay')?.classList.remove('open');
  document.getElementById('captureDrawer')?.classList.remove('open');
};

// Autosave
let _asTimer = null;
window.autosave = function() {
  clearTimeout(_asTimer);
  _asTimer = setTimeout(() => {
    save();
    const pill = document.getElementById('autosavePill');
    pill?.classList.add('show');
    setTimeout(() => pill?.classList.remove('show'), 1400);
  }, 600);
};

// Timer (versão completa, adaptada do seu código)
const MODES = [25, 50, 90];
let timerMode = 0, timerRunning = false, timerSecs = 25 * 60, timerInterval = null, timerStartTime = null, timerCategory = 'academico';

function updateTimerDisplay() {
  const m = Math.floor(timerSecs / 60).toString().padStart(2, '0');
  const s = (timerSecs % 60).toString().padStart(2, '0');
  const el = document.getElementById('timerDisplay');
  if (el) el.textContent = m + ':' + s;
}

function recordSession(secs) {
  if (secs < 30) return;
  const now = new Date();
  const key = now.toISOString().slice(0, 10);
  if (!S.timerSessions[key]) S.timerSessions[key] = {};
  S.timerSessions[key][timerCategory] = (S.timerSessions[key][timerCategory] || 0) + secs;
  S.sessions.push({ cat: timerCategory, secs, start: now.toISOString() });
  achievementsModule.checkAchievements();
  save();
  if (homeModule.renderHome) homeModule.renderHome();
}

function gainXP(amount, x, y) {
  if (x != null && y != null) xpBurst('+' + amount + ' XP', x, y);
  S.xp += amount;
  S.gold += Math.floor(amount / 10);
  let levelUp = false;
  const xpForLevel = (lvl) => Math.floor(120 * Math.pow(1.3, lvl - 1));
  while (S.xp >= xpForLevel(S.level)) {
    S.xp -= xpForLevel(S.level);
    S.level++;
    levelUp = true;
  }
  if (levelUp) setTimeout(() => window.toast(`⚡ Nível ${S.level}! Continue assim.`), 500);
  save();
  updateHero();
  achievementsModule.checkAchievements();
}

function xpBurst(text, x, y) {
  const el = document.createElement('div');
  el.className = 'xp-burst';
  el.textContent = text;
  el.style.cssText = `left:${x - 28}px;top:${y - 20}px;color:var(--accent2)`;
  document.getElementById('fxLayer')?.appendChild(el);
  setTimeout(() => el.remove(), 1400);
}

function updateHero() {
  const LEVELS = ['Explorador', 'Aprendiz', 'Estudioso', 'Praticante', 'Analista', 'Especialista', 'Mestre', 'Sábio', 'Lendário', 'Transcendente'];
  const xpForLevel = (lvl) => Math.floor(120 * Math.pow(1.3, lvl - 1));
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
        window.toast(`🎉 +${MODES[timerMode] * 2} XP — sessão de ${MODES[timerMode]}min!`);
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

// Tema
window.applyTheme = function(id) {
  S.theme = id;
  document.body.setAttribute('data-theme', id === 'dark' ? '' : id);
  const mc = document.getElementById('themeColorMeta');
  const colors = { dark: '#0e0e16', fantasy: '#080612', light: '#f2f2f8', highcontrast: '#000000' };
  if (mc) mc.content = colors[id] || '#0e0e16';
  save();
  if (profileModule.renderProfile) profileModule.renderProfile();
  window.toast('🎨 Tema aplicado!');
};

// Chip select
window.selectChip = function(el, hiddenId) {
  const group = el.closest('.chip-group');
  group?.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  const inp = document.getElementById(hiddenId);
  if (inp) inp.value = el.dataset.val || '';
};

// Toast
window.toast = function(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.getElementById('toastStack')?.appendChild(el);
  setTimeout(() => el.remove(), 2900);
};

// ─────────────────────────────────────────────────────────────
// EXPOR TODAS AS FUNÇÕES DOS MÓDULOS PARA window
// ─────────────────────────────────────────────────────────────
// Isso inclui: kanban, ritmos, roadmap, metrics, profile, capture, e também state se necessário

const allModules = [kanbanModule, ritmosModule, roadmapModule, metricsModule, profileModule, captureModule, achievementsModule];

allModules.forEach(module => {
  Object.keys(module).forEach(key => {
    const value = module[key];
    if (typeof value === 'function' && !window[key]) {
      window[key] = value;
    }
  });
});

// Também expomos as funções de state se necessário (ex: save, load, etc.)
if (stateModule.save && !window.save) window.save = stateModule.save;
if (stateModule.load && !window.load) window.load = stateModule.load;
if (stateModule.seed && !window.seed) window.seed = stateModule.seed;
if (stateModule.dailyReset && !window.dailyReset) window.dailyReset = stateModule.dailyReset;

// Para garantir que renderHome seja chamada no início (já está no homeModule)
window.renderHome = homeModule.renderHome;

// Inicialização no DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  load();
  seed();
  dailyReset();
  if (S.theme && S.theme !== 'dark') document.body.setAttribute('data-theme', S.theme);
  const mc = document.getElementById('themeColorMeta');
  const colors = { dark:'#0e0e16', fantasy:'#080612', light:'#f2f2f8', highcontrast:'#000000' };
  if (mc) mc.content = colors[S.theme] || '#0e0e16';
  if (homeModule.renderHome) homeModule.renderHome();
  if (kanbanModule.renderKanban) kanbanModule.renderKanban();
  if (ritmosModule.renderRitmos) ritmosModule.renderRitmos();
  if (roadmapModule.renderRoadmap) roadmapModule.renderRoadmap();
  achievementsModule.checkAchievements();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
});