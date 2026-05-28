/* ═══════════════════════════════════════════════
   ROADMAP.JS — Árvore de competências
═══════════════════════════════════════════════ */
import { S, save } from '../js/state.js';
import { gainXP, autosave, toast } from '../js/app.js';
import { checkAchievements } from '../js/achievements.js';

window.openPhaseModal = function() {
  document.getElementById('phaseName').value = '';
  document.getElementById('phaseEmoji').value = '';
  document.getElementById('phaseSkills').value = '';
  window.openModal('phaseModal');
};

window.savePhase = function() {
  const name = document.getElementById('phaseName').value.trim();
  if (!name) return;
  const skills = document.getElementById('phaseSkills').value.split('\n').map(s => s.trim()).filter(Boolean);
  S.roadmap.push({
    id: Date.now(),
    name,
    emoji: document.getElementById('phaseEmoji').value || '📚',
    completed: false,
    skills: skills.map(s => ({ name: s, done: false }))
  });
  gainXP(10);
  window.closeModal('phaseModal');
  autosave();
  renderRoadmap();
};

window.toggleSkill = function(phaseId, skillIdx) {
  const phase = S.roadmap.find(p => p.id === phaseId);
  if (!phase) return;
  phase.skills[skillIdx].done = !phase.skills[skillIdx].done;
  if (phase.skills[skillIdx].done) {
    S.roadmapSkillsDone = (S.roadmapSkillsDone || 0) + 1;
    gainXP(10);
  } else {
    S.roadmapSkillsDone = Math.max(0, (S.roadmapSkillsDone || 0) - 1);
  }
  if (phase.skills.every(s => s.done) && !phase.completed) {
    phase.completed = true;
    S.roadmapPhasesDone = (S.roadmapPhasesDone || 0) + 1;
    gainXP(50);
    toast(`🏆 Fase "${phase.name}" concluída! +50 XP`);
  }
  checkAchievements();
  autosave();
  renderRoadmap();
};

window.togglePhaseBody = function(id) {
  const body = document.getElementById('phase-body-' + id);
  if (body) body.classList.toggle('open');
};

window.delPhase = function(id) {
  S.roadmap = S.roadmap.filter(p => p.id !== id);
  autosave();
  renderRoadmap();
};

export function renderRoadmap() {
  const container = document.getElementById('roadmapContainer');
  if (!container) return;
  if (!S.roadmap.length) {
    container.innerHTML = `<div class="empty-state" style="padding:40px"><span class="empty-icon">🗺️</span><span class="empty-text">Sem fases ainda. Cria a tua primeira fase de aprendizagem.</span></div>`;
    return;
  }
  container.innerHTML = S.roadmap.map(phase => {
    const done = phase.skills.filter(s => s.done).length;
    const total = phase.skills.length;
    const pct = total ? Math.round(done / total * 100) : 0;
    return `<div class="roadmap-phase">
      <div class="roadmap-phase-hd" onclick="togglePhaseBody(${phase.id})">
        <span class="roadmap-phase-ico">${phase.emoji}</span>
        <div class="roadmap-phase-info">
          <div class="roadmap-phase-name">${phase.name}</div>
          <div class="roadmap-phase-prog">${done}/${total} skills · ${pct}%</div>
          <div class="progress-bar mt-3" style="height:4px"><div class="progress-fill pb-accent" style="width:${pct}%"></div></div>
        </div>
        <button class="btn btn-xs btn-ghost" onclick="event.stopPropagation();delPhase(${phase.id})">✕</button>
      </div>
      <div class="roadmap-phase-body" id="phase-body-${phase.id}">
        ${phase.skills.map((skill, idx) => `<div class="skill-row" onclick="toggleSkill(${phase.id},${idx})">
          <div class="skill-cb ${skill.done ? 'done' : ''}">${skill.done ? '✓' : ''}</div>
          <div class="skill-label ${skill.done ? 'done' : ''}">${escHtml(skill.name)}</div>
        </div>`).join('')}
      </div>
    </div>`;
  }).join('');
}

function escHtml(t) {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
