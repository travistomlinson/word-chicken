# Phase 1: Foundation - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Project toolchain and dictionary are in place so all engine work can begin with zero infrastructure blockers. Delivers: Vite + React + TypeScript scaffold, dictionary loading via fetch into `Set<string>`, dev tooling (Vitest), and placeholder routing between Config and Game screens.

</domain>

<decisions>
## Implementation Decisions

### Visual direction
- Minimalist, colorful, geometric aesthetic inspired by Le Corbusier
- Light mode only — off-white/concrete gray background with bold primary color accents (red, blue, yellow)
- Sharp corners, no shadows — clean architectural feel
- Color-blocked geometric letter tiles: bold primary-colored squares cycling through red/blue/yellow, white letter centered, sharp corners
- Typography: Jost (Google Fonts) — bold uppercase with letter-spacing for headings, bold for tiles, regular weight for body text

### Claude's Discretion
- Dictionary file source and format (TWL word list acquisition, serving from public/ as text vs JSON)
- Project folder structure (flat vs feature-based src/ organization)
- App shell navigation pattern (how Config and Game screens are routed)
- Tailwind configuration details (exact color values for the Corbusier palette, spacing scale)
- Loading states and transitions
- Animation approach (CSS transitions vs library)

</decisions>

<specifics>
## Specific Ideas

- Le Corbusier is the primary design reference — think Modulor proportions, De Stijl-adjacent color blocking, functional composition
- Tiles rotate through primary colors (red, blue, yellow) — not all the same color
- The bold geometric style should carry through all future phases (board, config screen, score panels)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- No existing code — this is the first phase, building from scratch

### Established Patterns
- No patterns yet — this phase establishes them

### Integration Points
- Dictionary module will be consumed by WordValidator in Phase 2
- Tailwind theme and Jost font setup will be inherited by all UI in Phase 4
- Zustand store structure will be extended in Phase 3 (FSM reducer)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-18*
