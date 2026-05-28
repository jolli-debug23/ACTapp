/* ═══════════════════════════════════════════════
   PROFILE.JS — Perfil, conquistas, temas
═══════════════════════════════════════════════ */
import { S } from '../js/state.js';
import { updateHero } from '../js/app.js';
import { ACH_DEFS, achProgress } from '../js/achievements.js';

const AVATARS = ['🧙', '🧝', '🦸', '🌱', '🔬', '🎨', '🎵', '💫', '🧬', '🔭', '🧩', '🦋', '🐉', '🌊', '⚡'];
const THEMES = [
  { id: 'dark', name: 'Escuro', desc: 'Clássico e focado', swatch: 'linear-gradient(135deg,#0e0e16,#1a1a26,#8b6cf6)' },
  { id: 'fantasy', name: 'Fantasia', desc: 'Magia e serenidade', swatch: 'linear-gradient(135deg,#080612,#150f28,#a78bfa)' },
  { id: 'light', name: 'Claro', desc: 'Leve e arejado', swatch: 'linear-gradient(135deg,#f2f2f8,#ffffff,#6d4fc4)' },
  { id: 'highcontrast', name: 'Alto Contraste', desc: 'Máxima legibilidade', swatch: 'linear-gradient(135deg,#000000,#ffffff,#ffff00)' }
];

export function renderProfile() {
  updateHero();
  renderAchGrid();
  renderThemes();
  renderAvatarChips();
}

function renderAchGrid() {
  const el = document.getElementById('achGrid');
  if (!el) return;
  if (!S.unlockedAchievements) S.unlockedAchievements = [];
  el.innerHTML = ACH_DEFS.map(a => {
    const unlocked = S.unlockedAchievements.includes(a.id);
    const prog = achProgress(a);
    const pct = Math.round(prog * 100);
    return `<div class="ach-card ${unlocked ? 'unlocked' : 'locked'}">
      ${unlocked ? '<div class="ach-check">✓</div>' : ''}
      <span class="ach-card-icon">${a.icon}</span>
      <div class="ach-card-name">${a.name}</div>
      <div class="ach-card-desc">${a.desc}</div>
      ${!unlocked && prog > 0 ? `<div class="ach-prog-bar">
        <div class="progress-bar"><div class="progress-fill pb-accent" style="width:${pct}%"></div></div>
        <div class="ach-prog-label">${pct}%</div>
      </div>` : ''}
    </div>`;
  }).join('');
}

function renderThemes() {
  const el = document.getElementById('themesGrid');
  if (!el) return;
  el.innerHTML = THEMES.map(t => `<div class="theme-card ${S.theme === t.id ? 'active' : ''}" onclick="applyTheme('${t.id}')">
    <div class="theme-swatch" style="background:${t.swatch}"></div>
    <div class="theme-name">${t.name}</div>
    <div class="theme-desc">${t.desc}</div>
  </div>`).join('');
}

function renderAvatarChips() {
  const el = document.getElementById('avatarPickerProfile');
  if (!el) return;
  el.innerHTML = AVATARS.map(a => `<div class="chip ${S.avatar === a ? 'active' : ''}" onclick="pickAvatar('${a}')" style="font-size:1.6rem;padding:8px 12px">${a}</div>`).join('');
}
