/* ═══════════════════════════════════════════════
   ACHIEVEMENTS.JS — Sistema de conquistas
═══════════════════════════════════════════════ */
import { S, getCatSecs, maxStreak, checkBalanced } from './state.js';
import { gainXP } from './app.js';

export const ACH_DEFS = [
  { id:'first_task',   icon:'⚔️',  name:'Primeira Quest',     desc:'1ª quest criada',              p: s => s.kanban.length >= 1, max: 1 },
  { id:'task_5',       icon:'🗡️',  name:'Caçador',            desc:'5 quests concluídas',         p: s => s.kanban.filter(k=>k.col==='done').length >= 5, max: 5 },
  { id:'task_20',      icon:'🏹',  name:'Veterano',           desc:'20 quests concluídas',        p: s => s.kanban.filter(k=>k.col==='done').length >= 20, max: 20 },
  { id:'first_timer',  icon:'⏱️',  name:'Primeira Sessão',    desc:'1ª sessão de foco',           p: s => s.sessions.length >= 1, max: 1 },
  { id:'timer_10',     icon:'🔟',  name:'10 Sessões',         desc:'10 sessões de foco',          p: s => s.sessions.length >= 10, max: 10 },
  { id:'timer_1h',     icon:'⌚',  name:'1 Hora Focado',      desc:'1h total de foco',            p: s => totalSecs(s) >= 3600, max: 3600 },
  { id:'arte_1h',      icon:'🎨',  name:'1h de Arte',         desc:'1h registada em arte',        p: s => getCatSecs(s,'arte') >= 3600, max: 3600 },
  { id:'arte_10h',     icon:'🏅',  name:'10h de Arte',        desc:'10h registadas em arte',      p: s => getCatSecs(s,'arte') >= 36000, max: 36000 },
  { id:'streak_5',     icon:'🔥',  name:'Em Chamas',          desc:'Streak de 5 dias',            p: s => maxStreak(s) >= 5, max: 5 },
  { id:'streak_30',    icon:'🌊',  name:'Imparável',          desc:'Streak de 30 dias',           p: s => maxStreak(s) >= 30, max: 30 },
  { id:'skill_1',      icon:'📚',  name:'Primeira Skill',     desc:'1ª skill do roadmap',         p: s => (s.roadmapSkillsDone||0) >= 1, max: 1 },
  { id:'phase_1',      icon:'🗺️',  name:'Fase Concluída',     desc:'1 fase do roadmap',           p: s => (s.roadmapPhasesDone||0) >= 1, max: 1 },
  { id:'balanced',     icon:'⚖️',  name:'Semana Equilibrada', desc:'Todas categorias na semana',   p: checkBalanced, max: 1 },
  { id:'lvl_5',        icon:'🌟',  name:'Nível 5',            desc:'Alcançar nível 5',            p: s => s.level >= 5, max: 5 },
  { id:'lvl_10',       icon:'👑',  name:'Nível 10',           desc:'Alcançar nível 10',           p: s => s.level >= 10, max: 10 },
  { id:'notes_5',      icon:'📝',  name:'Escriba',            desc:'5 insights guardados',        p: s => s.notes.length >= 5, max: 5 },
  { id:'all_ritmos',   icon:'✨',  name:'Ritual Perfeito',    desc:'Todos ritmos no mesmo dia',   p: checkAllRitmos, max: 1 },
  { id:'night_owl',    icon:'🦉',  name:'Coruja',             desc:'Sessão após 22h',             p: s => s.sessions.some(ss => new Date(ss.start).getHours() >= 22), max: 1 },
];

function totalSecs(s) { return s.sessions.reduce((a, ss) => a + ss.secs, 0); }

function checkAllRitmos(s) {
  if (s.ritmos.length === 0) return false;
  const today = new Date().toISOString().slice(0,10);
  return s.ritmos.every(r => r.lastDone === today);
}

export function checkAchievements() {
  if (!S.unlockedAchievements) S.unlockedAchievements = [];
  ACH_DEFS.forEach(a => {
    if (!S.unlockedAchievements.includes(a.id) && a.p(S)) {
      S.unlockedAchievements.push(a.id);
      gainXP(25);
      showAchPopup(a);
    }
  });
}

function showAchPopup(a) {
  const popup = document.getElementById('achPopup');
  if (!popup) return;
  document.getElementById('achPopupIcon').textContent = a.icon;
  document.getElementById('achPopupName').textContent = a.name;
  popup.classList.add('show');
  setTimeout(() => popup.classList.remove('show'), 3600);
}

export function achProgress(a) {
  if (S.unlockedAchievements.includes(a.id)) return 1;
  if (a.id === 'task_5') return Math.min(1, S.kanban.filter(k => k.col === 'done').length / 5);
  if (a.id === 'task_20') return Math.min(1, S.kanban.filter(k => k.col === 'done').length / 20);
  if (a.id === 'timer_1h') return Math.min(1, totalSecs(S) / 3600);
  if (a.id === 'arte_1h') return Math.min(1, getCatSecs(S,'arte') / 3600);
  if (a.id === 'arte_10h') return Math.min(1, getCatSecs(S,'arte') / 36000);
  if (a.id === 'streak_5') return Math.min(1, maxStreak(S) / 5);
  if (a.id === 'streak_30') return Math.min(1, maxStreak(S) / 30);
  if (a.id === 'timer_10') return Math.min(1, S.sessions.length / 10);
  if (a.id === 'notes_5') return Math.min(1, S.notes.length / 5);
  if (a.id === 'lvl_5') return Math.min(1, S.level / 5);
  if (a.id === 'lvl_10') return Math.min(1, S.level / 10);
  return 0;
}
