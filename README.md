# Carbon Explorer

An interactive data visualization platform for exploring the voluntary carbon credit market. Built with React, D3.js, and Framer Motion.

**[→ Live Demo](https://sashatoporov.github.io/carbon-registry/)**

## About

Carbon Explorer provides an analytical lens into the global voluntary carbon offset registry, featuring 10,000+ projects across major registries (Verra/VCS, Gold Standard, ACR, CDM, CAR). The application enables carbon market professionals to discover, explore, and analyze project data through rich interactive charts and a local AI-powered query engine.

### Data Source

All project data is sourced from the [Berkeley Voluntary Registry Offsets Database](https://gspp.berkeley.edu/research-and-impact/centers/cepp/projects/berkeley-carbon-trading-project/offsets-database), maintained by the Goldman School of Public Policy at UC Berkeley.

## Features

- **Discover** — Market overview with KPIs, top projects by volume, and trending sectors
- **Explore** — Searchable, filterable project table with detailed project drawer (includes AI-generated project summaries)
- **Map** — Choropleth world map of credit issuance by country
- **Data** — 9 analytical charts: market growth, issuance vs retirement, registry share, sector treemap, country rankings, project pipeline, reduction vs removal, top methodologies, and top developers
- **Collections** — Curated views (Nature-Based, Tech Removals, High Volume, Renewables)
- **Carbon AI** — Local heuristic query engine for natural-language data questions

## Tech Stack

- **React 19** + **Vite** — fast builds, HMR
- **D3.js** — all charts are hand-crafted SVG visualizations
- **Framer Motion** — smooth page transitions, scroll animations
- **TopoJSON / D3-geo** — world map rendering
- **GitHub Pages** — static deployment

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## License

MIT
