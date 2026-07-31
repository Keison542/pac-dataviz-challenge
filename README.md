# Pacific Interactive Dataviz Challenge

Live: https://keison542.github.io/pac-dataviz-challenge

## What this project is

An interactive, story-driven data visualization built with Next.js and TypeScript that explains climate impacts across Pacific Island countries. The site combines a custom Pacific map, multiple D3 charts, and narrative sections to guide readers through climate drivers, economic and human consequences, and regional comparisons.

## Quick start

```bash
npm install
# development
npm run dev
# build
npm run build
# start production server (if you want to preview the built app)
npm run start
# run tests (after installing dev deps)
npm run test
# deploy (existing script publishes `out/` with gh-pages)
npm run deploy
```

Notes:
- The project uses Next.js (App Router) and expects Node 18+.
- The repo includes `src/climatedata` which contains the processed CSV/TS data used by the visualizations.

## What I changed in this branch

This branch (improve/award-ready) contains documentation and accessibility/performance scaffolding to move the project toward award-quality readiness:

- Expanded README with run instructions and links to new documentation files.
- Added DATA_SOURCES.md and ARCHITECTURE.md to document datasets and high-level architecture.
- Added a ChartContainer component to standardize ARIA, captions and CSV download affordance for charts.
- Added a small design tokens file to centralize colors and spacing.
- Added vitest config and a minimal smoke test target (developer can run `npm run test`).

## Next high-impact steps (recommended)

1. Add provenance links (source URLs, licenses) to DATA_SOURCES.md.
2. Simplify or convert `src/climatedata/pacificGeoData.ts` to a topojson with reduced precision and lazy-load it.
3. Add ARIA descriptions and keyboard handlers to heavy interactive components (PacificMap.tsx, DoughnutClimateDashboard.tsx).
4. Add a11y and performance CI checks (axe, Lighthouse). 

## Contributing

See CONTRIBUTING.md (not yet present). If you'd like, I can open a follow-up PR that implements dynamic imports for heavy components and converts the geographic data to topojson.
