<div align="center">

<img src=".assets/logo.png" width="100" alt="Risk Profiler Logo">

# Risk Profiler

[![Python 3.13](https://img.shields.io/badge/Python-3.13-blue.svg)](https://www.python.org/downloads/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6.svg)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.128-009688.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.6-F7931E.svg?logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)

Machine learning prototype for profiling risk in insurance claims using AutoGluon and SHAP explainability.

**[Live Demo](https://risk-profiler.symfa.ai/)** · **[GitHub](https://github.com/Symfa-Inc/risk-profiler)** · **[Confluence](https://symfa.atlassian.net/wiki/x/BYD6LAE)**

</div>

## Preview

https://github.com/user-attachments/assets/79f3bf10-3dd2-4ca9-8b5c-b3c0fb95070c

## Features

- **Fraud Prediction** – Binary classification using trained AutoGluon ensemble models
- **Probability Scoring** – Configurable fraud probability threshold with risk assessment
- **SHAP Explainability** – Per-prediction feature contributions showing which inputs drive the result
- **Feature Importance** – Global feature importance visualization from SHAP training analysis
- **AI Summary** – Natural language fraud assessment generated via OpenAI
- **Interactive Dashboard** – Input form with real-time prediction, gauge visualization, and feature impact charts

## How It Works

The system uses an AutoGluon TabularPredictor trained on the 2023 Travelers NESS Statathon dataset (insurance claim records with driver demographics, claim details, and vehicle information). When a user submits claim features through the dashboard, the backend runs the model prediction, computes SHAP contributions using a KernelExplainer with 25-sample background, and generates a natural language summary via GPT-4o-mini. Claims exceeding the 65% fraud probability threshold are flagged as high risk.

## Tech Stack

| Category | Technologies |
|----------|-------------|
| Backend | Python 3.13, FastAPI, Uvicorn |
| Frontend | TypeScript, Next.js, React, Tailwind CSS |
| AI/ML | AutoGluon, scikit-learn, SHAP, OpenAI |
| Data | pandas, NumPy, Pydantic |
| Package Management | uv (backend), pnpm (frontend) |
| Deployment | Docker, GitHub Actions, Google Artifact Registry |

## Getting Started

### Prerequisites

- Python 3.13+ / [uv](https://docs.astral.sh/uv/)
- Node.js 24+ / [pnpm](https://pnpm.io/)

### Installation & Running

```bash
# Backend
cd backend
cp .env.example .env          # Add your OpenAI API key
uv sync
uv run uvicorn risk_profiler.main:app --reload

# Frontend
cd frontend
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) (frontend) and [http://localhost:8000/docs](http://localhost:8000/docs) (API docs).

## License

[MIT](LICENSE)
