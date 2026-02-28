# Trade Analyzer Pro 📊

> **Free, open-source portfolio analytics tool for SPX options traders — powered by AI**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Try%20Now-00d4aa?style=for-the-badge)](https://yourusername.github.io/trade-analyzer)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![No Backend](https://img.shields.io/badge/No%20Backend-100%25%20Client--Side-orange?style=for-the-badge)](#)

---

## What is this?

Trade Analyzer Pro is a **single-file HTML application** that transforms your Option Omega CSV exports into deep portfolio insights. No installation, no server, no data sent anywhere — everything runs locally in your browser.

Built by a retail trader, for retail traders.

---

## Features

### 📈 Portfolio Analytics
- Full equity curve with drawdown visualization
- Monthly P&L table with win rate breakdown
- Annual performance chart
- Capital base calculation (max daily margin + 2× max drawdown)
- Annualized return on capital

### 🎯 Strategy Comparison
- Per-strategy metrics: Sharpe, Win Rate, Profit Factor, Max DD, Return on Margin
- **Size multiplier** — scale each strategy independently and see real-time impact on portfolio metrics
- Correlation matrix across all strategies
- Sub-portfolio mode — select any strategy subset and analyze it in full detail

### 🌊 VIX Regime Analysis
- Performance breakdown across VIX bands (< 15, 15–20, 20–25, 25–30, 30+)
- Identify which strategies thrive or suffer in high-volatility regimes
- Day-of-week performance patterns

### 💰 Margin Analytics
- Daily margin exposure over time
- Max & average concurrent open strategies
- Concurrent strategy distribution histogram
- Day-of-week margin and strategy count averages
- **0DTE handling**: margin for same-day trades is automatically set to Max Loss (no leverage)

### 🤖 AI-Powered Insights (Claude API)
- Full portfolio analysis with customizable depth (concise / detailed / expert)
- Focused analysis modes: strategy comparison, VIX exposure, risk management, improvement suggestions
- **Portfolio Optimizer**: generates 3 optimized portfolio proposals (max Sharpe / max return / max robustness) with strategy selection and size recommendations
- One-click load of AI-suggested portfolios into the selector

---

## How to Use

### Option 1 — Use Online (recommended)
👉 **[Open Live Demo](https://yourusername.github.io/trade-analyzer)**

1. Export your trades from Option Omega as CSV
2. Drag & drop the file into the app
3. Explore your portfolio analytics

### Option 2 — Run Locally
Download `trade_analyzer.html` and open it with the included launcher:

- **Windows**: double-click `Apri_TradeAnalyzer.bat` (opens Chrome with CORS disabled)
- **Mac/Linux**: run `./avvia_server.sh` (starts a local server)

> The local launchers are needed only for the AI analysis feature. All other features work directly from `file://`.

---

## AI Analysis Setup

The app connects directly to the [Anthropic Claude API](https://www.anthropic.com) from your browser.

- When used via the **live demo** (GitHub Pages / Netlify), the API key is entered in the AI tab and stored in your browser's localStorage — never transmitted to any third party
- When used inside **claude.ai**, no API key is needed
- Recommended: set a monthly spending limit on your Anthropic API key

---

## Data & Privacy

- **No backend** — zero data leaves your browser
- **No tracking** — no analytics, no cookies, no external requests (except the Anthropic API when you explicitly trigger AI analysis)
- **No installation** — single HTML file, ~120KB

---

## Supported Data Format

Exported CSV from **[Option Omega](https://optonomega.com)** with the following columns:

`Date Opened · Time Opened · Date Closed · Time Closed · Strategy · P/L · P/L % · Margin Req. · Max Loss · No. of Contracts · Opening VIX · Closing VIX · Reason For Close · Opening Price · Closing Price · Premium · Max Profit · Legs`

---

## Screenshots

> *(coming soon)*

---

## Roadmap

- [ ] Multi-account / multi-broker CSV support
- [ ] Export analysis as PDF report
- [ ] Strategy performance alerts
- [ ] Position sizing calculator
- [ ] More automation tools *(in development)*

---

## License

MIT License — free to use, modify and distribute.

---

## Author

Built with ❤️ by a retail SPX options trader.  
Questions, suggestions, feedback → open an [Issue](../../issues) or reach out on Telegram.

> *This tool is for informational and educational purposes only. Nothing here constitutes financial advice.*
