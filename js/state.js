/* ═══════════════════════════════════════════════
   STATE.JS — Estado global + persistência
═══════════════════════════════════════════════ */
export const SK = 'lab_pessoal_v3';

export const INITIAL_STATE = {
  name: '', avatar: '🧙', theme: 'dark',
  xp: 0, level: 1, gold: 0,
  kanban: [], ritmos: [], roadmap: [],
  sessions: [], notes: [], quickTodos: [],
  streaks: {},
  roadmapSkillsDone: 0, roadmapPhasesDone: 0,
  unlockedAchievements: [],
  dailyReset: null,
  timerSessions: {},
  seeded: false,
  kFilter: 'all',
};

export let S = { ...INITIAL_STATE };

export function save() {
  try { localStorage.setItem(SK, JSON.stringify(S)); } catch(e) {}
}

export function load() {
  try {
    // Try v3 first, then migrate from v2/v1
    const raw = localStorage.getItem(SK)
      || localStorage.getItem('lab_pessoal_v2')
      || localStorage.getItem('lab_pessoal_v1');
    if (raw) S = deepMerge(S, JSON.parse(raw));
  } catch(e) {}
}

function deepMerge(t, s) {
  const o = { ...t };
  for (const k in s) {
    if (s[k] && typeof s[k] === 'object' && !Array.isArray(s[k]))
      o[k] = deepMerge(t[k] || {}, s[k]);
    else o[k] = s[k];
  }
  return o;
}

export function seed() {
  if (S.seeded) return;
  S.seeded = true;
  const n = Date.now();
  S.kanban = [
    { id:n+1, title:'ATV 2 — ADMBD', date:'', cat:'academico', priority:'urgente', col:'todo', subs:[] },
    { id:n+2, title:'Seminário — IA', date:'', cat:'academico', priority:'urgente', col:'todo', subs:[] },
    { id:n+3, title:'Slide + Dinâmicas EXT', date:'', cat:'academico', priority:'normal', col:'todo', subs:['Criar slides','Definir dinâmica','Ensaiar'] },
    { id:n+4, title:'Revisar PHP', date:'', cat:'academico', priority:'normal', col:'doing', subs:['Variáveis e tipos','Funções e arrays','Conexão com BD'] },
    { id:n+5, title:'Seminário — Eng. Software', date:'', cat:'academico', priority:'urgente', col:'todo', subs:[] },
  ];
  S.ritmos = [
    { id:n+10, name:'Estudar bloco de TI', type:'manutencao', emoji:'💻', lastDone:null },
    { id:n+11, name:'Exercício físico 10–20min', type:'manutencao', emoji:'💪', lastDone:null },
    { id:n+12, name:'Dormir até 21h30', type:'manutencao', emoji:'😴', lastDone:null },
    { id:n+13, name:'Cantar / praticar música', type:'abastecimento', emoji:'🎵', lastDone:null },
    { id:n+14, name:'Desenhar ou criar algo', type:'abastecimento', emoji:'🎨', lastDone:null },
    { id:n+15, name:'Ler por prazer', type:'abastecimento', emoji:'📖', lastDone:null },
  ];
  S.roadmap = [
    { id:n+20, emoji:'🗄️', name:'Fase 1 — SQL', completed:false, skills:[
      {name:'SELECT, FROM, WHERE',done:false},{name:'GROUP BY e HAVING',done:false},
      {name:'JOINs: INNER, LEFT, RIGHT',done:false},{name:'Subqueries e CTEs',done:false},
      {name:'Janelas analíticas (RANK, LAG)',done:false},
    ]},
    { id:n+21, emoji:'🐍', name:'Fase 2 — Python para Dados', completed:false, skills:[
      {name:'Pandas: DataFrames, filtros',done:false},{name:'Pandas: Merge, GroupBy',done:false},
      {name:'Matplotlib e Seaborn',done:false},{name:'Projeto: análise exploratória',done:false},
    ]},
    { id:n+22, emoji:'📊', name:'Fase 3 — Power BI', completed:false, skills:[
      {name:'DAX básico: SUM, CALCULATE',done:false},{name:'Dashboard publicado online',done:false},
    ]},
    { id:n+23, emoji:'🎵', name:'Jornada Musical', completed:false, skills:[
      {name:'Teoria: escalas maiores e menores',done:false},
      {name:'Composição: 1 letra completa',done:false},
      {name:'Gravar 1 demo',done:false},
    ]},
  ];
}

export function dailyReset() {
  const today = todayKey();
  if (S.dailyReset === today) return;
  const yest = yesterdayKey();
  if (S.dailyReset && S.dailyReset !== yest) {
    Object.keys(S.streaks).forEach(id => {
      const st = S.streaks[id];
      if (st.lastDate !== yest && st.lastDate !== today) st.count = 0;
    });
  }
  S.quickTodos = S.quickTodos.filter(t => !t.done);
  S.dailyReset = today;
  save();
}

/* ── Helpers de data ── */
export function todayKey()     { return new Date().toISOString().slice(0,10); }
export function yesterdayKey() { return new Date(Date.now()-86400000).toISOString().slice(0,10); }

/* ── Helpers de stats ── */
export function totalSecs()        { return S.sessions.reduce((a,s)=>a+s.secs,0); }
export function getCatSecs(cat)    { return S.sessions.filter(s=>s.cat===cat).reduce((a,s)=>a+s.secs,0); }
export function maxStreak()        { return Math.max(0,...Object.values(S.streaks||{}).map(st=>st.count||0)); }
export function checkBalanced()    {
  const w = new Date(Date.now()-7*86400000).toISOString();
  return ['academico','carreira','arte','saude'].every(c=>S.sessions.some(s=>s.cat===c&&s.start>=w));
}
export function calcBestDay()      {
  const days = {};
  S.sessions.forEach(s=>{ const k=s.start.slice(0,10); days[k]=(days[k]||0)+s.secs; });
  return Math.round(Math.max(0,...Object.values(days))/60);
}
