# Lab Pessoal — v3

Aplicação web de organização pessoal baseada no paradigma de **Laboratório de Análise** — foco em equilíbrio, autocompaixão e dados reais.

## Demo

→ Abre `index.html` no browser, ou faz deploy gratuito no GitHub Pages.

## Funcionalidades

- **Kanban** — Quests com prazo, subtarefas, drag & drop
- **Ritmos** — Hábitos diários com heatmap de consistência (90 dias)
- **Roadmap** — Árvore de competências de longo prazo
- **Captura Rápida** — Editor de notas com Markdown lite, to-do rápido
- **Métricas** — Dashboard analítico alimentado pelo Timer de foco
- **Timer** — Pomodoro adaptado (25 / 50 / 90 min)
- **Gamificação** — XP, níveis, conquistas progressivas
- **3 Temas** — Escuro, Fantasia, Claro
- **Auto-save** — Guardado automático em localStorage
- **PWA** — Instalável como app no telemóvel

## Deploy no GitHub Pages

1. Faz fork ou upload deste repositório
2. Vai a **Settings → Pages**
3. Em "Source" escolhe `main` branch, pasta `/` (root)
4. O teu Lab fica disponível em `https://[teu-user].github.io/[repo-name]/`

## Estrutura

```
lab-v3/
├── index.html          ← Shell principal
├── manifest.json       ← PWA config
├── sw.js               ← Service Worker (offline)
├── README.md
├── css/
│   ├── base.css        ← Reset, tokens, tipografia
│   ├── themes.css      ← 3 temas visuais
│   ├── components.css  ← Botões, cards, tags, forms
│   └── layout.css      ← Nav, screens, drawer, modal
├── js/
│   ├── state.js        ← Estado global + save/load
│   ├── app.js          ← Init, navegação, timer, XP
│   └── achievements.js ← Motor de conquistas
└── modules/
    ├── home.js         ← Tela Lab + timer
    ├── kanban.js       ← Kanban + drag & drop
    ├── ritmos.js       ← Ritmos + heatmap
    ├── roadmap.js      ← Roadmap de competências
    ├── capture.js      ← Captura rápida + editor MD
    ├── metrics.js      ← Dashboard + gráficos
    └── profile.js      ← Perfil + temas + conquistas
```

## Stack

- HTML / CSS / JavaScript — zero dependências de framework
- [Chart.js 4.4](https://www.chartjs.org/) — gráficos
- Google Fonts — Space Grotesk + Space Mono
- localStorage — dados persistentes offline
