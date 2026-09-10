# MPLADS Risk Intelligence & Early-Warning Platform (SIH26102)

A government-grade web app that scores 10,000 MPLADS works for risk, explains every flag,
and gives officers a printable field investigation brief.

## Look and feel
Indian government enterprise: deep navy base, saffron accents, slate greys, crisp
condensed headings with a highly readable body face. Dense data tables, calm cards,
clear risk colour coding (Critical red, High orange, Medium amber, Low green).
Responsive from phone to control-room monitor.

## Pages

1. **Executive Dashboard** (home)
   - Portfolio tiles: 10,000 works split 120 Critical / 510 High / 1,530 Medium / 7,840 Low
   - Top-100 Inspection Precision: 72% (with trend)
   - Sanctioned vs actual expenditure chart
   - Live feed of expenditure-vs-physical-progress mismatch alerts

2. **Risk Map**
   - State choropleth heatmap plus district clusters with colour-coded markers
   - Click a district to open a side drawer listing its flagged works, filterable by tier

3. **Project Risk Profile** ("Why was this flagged?")
   - 0-100 risk gauge, confidence score, data quality score
   - Six signal cards: cost anomaly vs peer benchmark, timeline delay, expenditure vs
     physical mismatch (e.g. 82% funds / 38% work), duplicate & semantic similarity,
     agency behaviour score, compliance rule violations — each with evidence and weight
   - Fixed disclaimer: "Potential anomaly requiring human verification. This score does
     not establish fraud."

4. **Peer Comparison** — side-by-side table and charts vs comparable works by work type,
   cost, duration, progress

5. **Duplicate / Ghost Detector** — paired records showing text similarity %, distance in
   metres, overlapping sanction dates, photo verification status

6. **Agency Analytics** — agency risk leaderboard, completion track record, delay frequency

7. **Investigation Brief** — one-click official MoSPI brief: work details, red flags,
   recommended verification checklist, signature block; print/export ready

## Global chrome
- Persona switcher: MoSPI Central Monitoring Officer / District Authority / Risk Analyst,
  changing default landing view and visible scope
- Backend connect bar: settings panel for the FastAPI endpoint (default
  http://127.0.0.1:8000), a health-check ping with status light, and a toggle between
  Live Backend and Hackathon Mock Mode

## Technical notes
- TanStack Start routes: `/` (dashboard), `/map`, `/projects`, `/projects/$id`,
  `/duplicates`, `/agencies`, `/brief/$id`
- A single data layer reads from mock generators by default; when Live Backend is on it
  calls the configured FastAPI base URL with the same shapes, so switching is seamless.
  Endpoint and mode persist in the browser.
- Deterministic seeded mock dataset (10,000 works, districts, agencies) so numbers match
  the stated tier counts and stay stable across reloads.
- Charts via Recharts; map via a lightweight SVG India state/district map with cluster
  markers (no external map key needed).
- Design tokens in `src/styles.css`; shadcn components restyled to the gov palette.
- Print styles for the investigation brief.

No backend/database is created — data is mock until a FastAPI URL is connected.
