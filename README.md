# Project Sentinel

Build an AI-Powered MPLADS Risk Intelligence & Early-Warning Platform frontend for Smart India Hackathon 2026 (SIH26102, Ministry of Statistics & Programme Implementation - MoSPI).

Include:
1. Executive Risk Dashboard: Portfolio overview of 10,000 projects categorized by Risk Tiers (120 Critical, 510 High, 1,530 Medium, 7,840 Low), Top-100 Inspection Precision metric (72%), Total Sanctioned vs Actual Expenditure, and Expenditure-vs-Physical progress mismatch alerts.
2. Interactive Geospatial Risk Map: State and district risk heatmap and cluster map with color-coded risk markers (Critical, High, Medium, Low) and district drawer filtering flagged works.
3. Explainable AI Project Risk Profile ('Why was this flagged?'): 0-100 Risk Score gauge, confidence score, data quality score, and the 6 anomaly detection signals:
   - Cost Anomaly vs Peer IQR benchmark
   - Timeline & Delay Detection
   - Expenditure vs Physical Progress Mismatch (e.g. 82% funds disbursed vs 38% physical work done)
   - Duplicate & Semantic Work Similarity
   - Implementing Agency Behavioural Score
   - Compliance & Guideline Rule Violations
   Include the disclaimer: 'Potential anomaly requiring human verification. This score does not establish fraud.'
4. Peer Comparison Engine: Side-by-side comparison table & charts against comparable projects by work type, cost, duration, and progress.
5. Duplicate / Ghost Project Detector: Side-by-side comparison showing semantic text similarity %, geospatial distance, overlapping sanction dates, and photo verification checks.
6. Agency Behavioural Analytics: Implementing agency risk leaderboard, project completion track records, and delay frequency.
7. One-Click Investigation Brief: Printable / exportable official MoSPI field investigation brief with red flags and recommended verification checklist for District Collectors.
8. FastAPI Backend Connect Bar: Settings modal/panel with FastAPI endpoint configuration (default http://127.0.0.1:8000), API health check ping, and a seamless toggle between Live Backend and Hackathon Mock Mode.
9. Role-based persona switcher (MoSPI Central Monitoring Officer, District Authority, Risk Analyst).
Professional Indian government enterprise design language with saffron/navy/slate accents, crisp typography, and responsive layouts.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a6b7916a-0991-4e61-8d08-f98c7819535d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
