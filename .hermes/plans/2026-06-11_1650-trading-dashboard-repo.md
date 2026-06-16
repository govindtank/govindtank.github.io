# Trading Dashboard — Private Consolidated Repo

> **Goal:** Consolidate all trading data (Darvas paper trader, Options paper trader, DarvaX scanner, real trade tracker) into a single private GitHub repo with an interactive dashboard, proper data separation, and standard practices.

**Architecture:** Python + Plotly static HTML dashboard (zero server dependencies)
**Repo:** `govindtank/trading-dashboard` (private) at `~/hermes_projects/trading-dashboard/`
**Data source:** `~/workspace/stock-scanner-repo/` (symlinked raw data)

---

## Phases

### Phase 1: Repo Setup & Data Ingestion
- [ ] Create private GitHub repo `govindtank/trading-dashboard`
- [ ] Set up project skeleton (README, .gitignore, requirements.txt, Makefile)
- [ ] Create data directory structure (raw/ processed/ reports/)
- [ ] Create `src/ingest/` — scripts to symlink and snapshot data from scanner repo
- [ ] Create `sync_data.sh` — one-shot sync from scanner repo
- [ ] Commit initial structure

### Phase 2: Analytics Engine
- [ ] `src/analytics/performance.py` — P&L curves, win rates, Sharpe, max drawdown
- [ ] `src/analytics/risk_metrics.py` — position sizing, exposure, correlation
- [ ] `src/analytics/options_metrics.py` — greeks, theta decay, POP, max pain
- [ ] `src/analytics/darvas_metrics.py` — pattern distribution, streak analysis

### Phase 3: Dashboard Generation
- [ ] `src/dashboard/generate.py` — main dashboard builder
- [ ] Plotly charts: P&L curve, allocation pie, win/loss bars, drawdown
- [ ] Open positions table with conditional formatting
- [ ] Options greeks overview table
- [ ] DarvaX pattern distribution chart
- [ ] DV signal timeline
- [ ] Daily report archive browser

### Phase 4: Historical Tracking
- [ ] Snapshot script — take daily snapshot of all data files with timestamps
- [ ] Historical DB (SQLite) — store snapshots for trend analysis
- [ ] Backfill: ingest any existing report history (June 3–11)

### Phase 5: Cron Integration
- [ ] Create Hermes cron job: consolidate all data & regenerate dashboard daily
- [ ] Update existing cron jobs to optionally push data to new repo
- [ ] Telegram delivery of daily dashboard summary

---

## File Structure

```
~/hermes_projects/trading-dashboard/
├── .gitignore
├── README.md
├── Makefile
├── requirements.txt
├── data/
│   ├── raw/                    # Symlinked from scanner repo (not in git)
│   ├── processed/              # Cleaned parquet/CSV (git-tracked)
│   ├── historical.db           # SQLite historical snapshots (git-tracked)
│   └── reports/                # Generated HTML reports (git-tracked)
├── src/
│   ├── __init__.py
│   ├── ingest/
│   │   ├── __init__.py
│   │   ├── darvas.py           # Read darvas_state.json, darvas_memory.json
│   │   ├── options.py          # Read options_state.json, options_transactions.json
│   │   ├── scanner.py          # Read darvax_scan_results.json, dv_scan_results.json
│   │   ├── trade_tracker.py    # Read darvax_trade_tracker.json
│   │   └── reports.py          # Parse report_*.md files
│   ├── analytics/
│   │   ├── __init__.py
│   │   ├── performance.py
│   │   ├── risk_metrics.py
│   │   ├── options_metrics.py
│   │   └── darvas_metrics.py
│   ├── dashboard/
│   │   ├── __init__.py
│   │   ├── generate.py         # Main dashboard HTML generator
│   │   ├── components.py       # Reusable Plotly chart builders
│   │   └── templates/          # Jinja2 HTML templates
│   └── db/
│       ├── __init__.py
│       ├── schema.py           # SQLite schema
│       └── snapshot.py         # Historical snapshot manager
├── tests/
│   ├── test_ingest.py
│   ├── test_analytics.py
│   └── test_dashboard.py
├── scripts/
│   ├── sync_data.sh            # Symlink/sync from scanner repo
│   ├── snapshot.sh             # Take daily snapshot
│   ├── build_dashboard.sh      # Full rebuild
│   └── setup.sh                # First-time setup
└── dashboards/                 # Generated output (git-tracked)
    ├── index.html              # Main dashboard
    ├── archive/                # Historical dashboards
    └── assets/                 # CSS/JS
```

## Visuals Planned

| Page | Charts | Data Source |
|------|--------|-------------|
| **Overview** | P&L curve (multi-system overlay), Allocation pie, Daily P&L bar | All |
| **Darvas** | Positions table, P&L per trade, Win rate by strategy, ATR exposure | darvas_state.json |
| **Options** | Greeks table, Theta decay curve, POP vs time, Credit received timeline | options_state.json |
| **DarvaX Patterns** | Pattern radar, Score histogram, DV Bull/Bear counts timeline | darvax/dv results |
| **Real Trades** | Trade timeline, P&L scatter, Win rate, Max favorable/adverse excursion | darvax_trade_tracker.json |
| **Risk** | Drawdown curve, Exposure gauge, Correlation matrix, VIX overlay | All (calculated) |
| **Reports** | Archived daily reports with search/filter | reports/ |

## Design Principles

1. **DRY** — Single source of truth (scanner repo raw files). Symlink, don't copy
2. **YAGNI** — Start with core dashboard, add pages as data accumulates
3. **Separation of concerns** — ingest/ → analytics/ → dashboard/ pipeline
4. **Git-friendly** — Raw data gitignored, processed/ and dashboards/ tracked for history
5. **Self-contained** — Open dashboards/index.html in any browser, no server
6. **Tested** — Unit tests for all analytics functions
