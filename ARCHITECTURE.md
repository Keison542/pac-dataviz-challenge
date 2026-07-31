# Architecture

This document gives a short orientation to the project's structure and where the main logic lives.

Top-level structure

```
src/
  app/                 # Next.js App Router entry: layout.tsx, page.tsx and global CSS
  components/          # Visualizations and UI components (Hero, PacificMap, DoughnutClimateDashboard, etc.)
  climatedata/         # Processed dataset modules and geographic data
  hooks/                # Reusable hooks (useClimateData, useNarrativeScroll)
  lib/                  # Helper utilities used across components
  vizualization/        # Lower-level d3 and chart helpers
public/                # Static assets
```

Key modules

- `src/hooks/useClimateData.ts` — central hook that aggregates all datasets, computes KPIs and shapes the data passed to visualizations.
- `src/components/PacificMap.tsx` — custom map component that renders Pacific features and handles country selection.
- `src/climatedata/pacificGeoData.ts` — the in-repo geographic data used by the map. Consider converting to topojson and reducing precision for faster loads.
- `src/components/DoughnutClimateDashboard.tsx`, `HumanEconomicSection.tsx` — large visualization components that assemble charts and KPI cards.

Recommendation for runtime improvements

- Lazy-load heavy visualization components (e.g., PacificMap and large D3-based charts) using Next.js dynamic imports to reduce initial bundle size.
- Precompute expensive transforms (sankey layout, beeswarm placements) at build time and include the result as static JSON if they don't change often.

Developer notes

- The main narrative is composed in `src/app/page.tsx` which imports many components and uses `useClimateData()` to get data.
- To add tests, the minimal smoke test added in this branch verifies that the hook module exports the expected keys; adding component tests using Testing Library + Vitest is recommended next.
