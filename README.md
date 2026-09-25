# DSA Progress Tracker & Learning Analytics Platform

[![CI Pipeline](https://github.com/Krishnaprasad-debug/DSA-Progress-Tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/Krishnaprasad-debug/DSA-Progress-Tracker/actions/workflows/ci.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Krishnaprasad-debug_DSA-Progress-Tracker&metric=alert_status)](https://sonarcloud.io/dashboard?id=Krishnaprasad-debug_DSA-Progress-Tracker)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=Krishnaprasad-debug_DSA-Progress-Tracker&metric=coverage)](https://sonarcloud.io/dashboard?id=Krishnaprasad-debug_DSA-Progress-Tracker)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Release](https://img.shields.io/badge/Release-v1.0.0-blue.svg)](https://github.com/Krishnaprasad-debug/DSA-Progress-Tracker/releases/tag/v1.0.0)

A production-grade, enterprise-ready web application engineered to track, analyze, and optimize Data Structures & Algorithms (DSA) preparation through spaced repetition, real-time analytics, mock interview contests, and continuous deployment workflows.

---

## 🏛️ System Architecture

Built on a robust **Git-Flow SDLC** across 10 structured engineering phases, integrating strict automated CI/CD pipelines, multi-tenant database isolation, and containerized microservices:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React 18 + Vite Frontend                        │
│   (TailwindCSS • Lucide Icons • Recharts Analytics • Glassmorphism)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST API (Cookies)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Express.js TypeScript Backend                     │
│  (Helmet • Rate Limiting • NoSQL Sanitization • JWT HttpOnly Auth)     │
└──────────────┬────────────────────┬────────────────────┬───────────────┘
               │                    │                    │
               ▼                    ▼                    ▼
     ┌──────────────────┐  ┌─────────────────┐  ┌─────────────────┐
     │ Problem Library  │  │ Spaced Revision │  │   Assessment    │
     │ & Attempt Engine │  │ Leitner System  │  │ Contest Sandbox │
     └──────────────────┘  └─────────────────┘  └─────────────────┘
               │                    │                    │
               └────────────────────┼────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       MongoDB Replica / Storage                        │
│   (Indexed Collections: Users, Problems, Attempts, Revisions, Goals,    │
│                           Assessments)                                 │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Feature Domains

### 1. User Authentication & Multi-Tenancy (Phase 2)
- Secure registration and login powered by `bcryptjs` salted password hashing.
- Stateless, sessionless authentication via `HttpOnly`, `SameSite=Lax` signed JWT cookies.
- Comprehensive data isolation ensuring strict multi-tenant privacy across all domains.

### 2. Problem Library CRUD & Search/Filter (Phase 3)
- Manage coding challenges across 16 canonical DSA topics and 3 difficulty tiers (Easy, Medium, Hard).
- Multi-dimensional filtering by Topic, Difficulty, Platform (LeetCode, HackerRank, CodeChef, GFG), and Status.
- Real-time search by title, description, and custom tags with pagination and sorting.

### 3. Practice Attempts & Execution Metrics (Phase 4)
- Log granular attempts with duration (minutes), outcome (`Solved` vs. `Failed`), and solution approach notes.
- Automatically transitions problem status from *Not Started* to *Attempted* or *Solved*.
- Complete attempt history timeline with chronological review logs.

### 4. Spaced Repetition Leitner Engine (Phase 5)
- Automated retention scheduling based on cognitive spacing intervals ($1\text{d} \rightarrow 7\text{d} \rightarrow 30\text{d} \rightarrow \text{Mastered}$).
- Automatically triggers Day 1 revision upon problem solution.
- Due revision dashboard banner and quick completion progression.

### 5. Learning Analytics & Heatmaps (Phase 6)
- **Topic Mastery Algorithm:** Quantifies proficiency ($0-100\%$) weighted by difficulty ($E=1.0, M=1.5, H=2.0$) and success rates.
- **Struggle Detection:** Pinpoints topics with high failure frequency and low mastery for targeted remediation.
- **Activity Heatmap & Streaks:** Tracks daily consistency, current streak, longest streak, and practice velocity.

### 6. Personal Goals & Weekly Performance Reports (Phase 7)
- Configure target quotas: weekly problems, topic mastery percentages, practice time duration, or custom milestones.
- Dynamic live progress percentage calculations and auto-completion triggers.
- Comprehensive Monday-to-Sunday UTC weekly performance reports with week-over-week velocity deltas and neglected weak topic alerts.

### 7. Assessment Engine & Mock Interview Contests (Phase 8)
- Timed mock interview contests with live countdown clocks and sandboxed attempt submission.
- Deterministic scoring: Easy (20 pts), Medium (40 pts), Hard (60 pts).
- Failed attempt penalty (-5 pts floored at 50%) and early finish time bonuses (+15 pts).
- Automated readiness verdict evaluation: **Strong Hire** ($\ge 85\%$), **Hire** ($70-84\%$), **Leaning Hire** ($50-69\%$), and **Needs Practice** ($< 50\%$).

### 8. Security Hardening & Quality Gate (Phase 9)
- **Helmet Headers:** `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, Content Security Policy (CSP), `X-DNS-Prefetch-Control`.
- **NoSQL Injection Sanitizer:** Strips `$` operators and dot-notation paths from request bodies, queries, and params.
- **Brute-Force Protection:** Rate limiting restricting general traffic (100 req / 15m) and authentication endpoints (10 req / 15m).
- **Diagnostics Probes:** `/api/health` reporting live uptime, database state, memory statistics, and security flags.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, Lucide React, Recharts |
| **Backend** | Node.js 20, Express, TypeScript, Mongoose, Zod, Joi, Helmet, express-rate-limit |
| **Database** | MongoDB 6+ (Indexed collections, multi-tenant compound indexes) |
| **DevOps / CI/CD** | GitHub Actions, Git-Flow, SonarCloud, Docker, Docker Compose, Nginx |
| **Testing** | Jest, Supertest, Vitest, React Testing Library, V8 Coverage |

---

## 🚦 Automated Quality Gates & Test Suites

The project maintains **100% passing tests** with strict quality gate thresholds ($\ge 80\%$ test coverage and 0 linting errors):

| Metric | Threshold | Result | Status |
|---|---|---|---|
| **ESLint Analysis** | 0 errors, 0 warnings | 0 errors, 0 warnings | ✅ PASS |
| **Backend Test Suite** | $\ge 80\%$ statement coverage | **115/115 passed** (84.45% coverage) | ✅ PASS |
| **Frontend Test Suite** | $\ge 80\%$ statement coverage | **53/53 passed** (87.54% coverage) | ✅ PASS |
| **TypeScript Typecheck** | Strict compilation | 0 type errors | ✅ PASS |
| **Production Build** | Vite bundle compilation | Successfully bundled in `dist/` | ✅ PASS |
| **Security Audit** | 0 high/critical issues | 0 vulnerabilities (`npm audit`) | ✅ PASS |

---

## 📦 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version `>= 20.0.0`)
- [npm](https://www.npmjs.com/) (version `>= 10.0.0`)
- [MongoDB](https://www.mongodb.com/) (running locally on port 27017 or via Docker)

### Option A: Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Krishnaprasad-debug/DSA-Progress-Tracker.git
   cd DSA-Progress-Tracker
   ```

2. **Install all dependencies:**
   ```bash
   npm ci
   ```

3. **Configure environment variables:**
   ```bash
   # In backend/.env
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173
   MONGODB_URI=mongodb://localhost:27017/dsa-progress-tracker
   JWT_SECRET=super_secret_jwt_key_min_32_characters_long
   JWT_EXPIRES_IN=7d
   COOKIE_SECRET=super_secret_cookie_signing_key_32_characters
   ```

4. **Start development servers:**
   ```bash
   # Run both backend and frontend concurrently
   npm run dev:backend
   npm run dev:frontend
   ```

5. **Access the application:**
   - Frontend UI: `http://localhost:5173`
   - Backend API: `http://localhost:5000`
   - Health Probe: `http://localhost:5000/api/health`

### Option B: Docker Compose Deployment

Run the complete multi-container stack (Frontend + Backend + MongoDB) with a single command:

```bash
docker-compose up --build -d
```

- Frontend (Nginx SPA): `http://localhost:5173`
- Backend API: `http://localhost:5000/api`
- MongoDB: `localhost:27017`

To inspect service health:
```bash
docker-compose ps
```

---

## 🧪 Running Tests & Quality Checks

```bash
# Run linting across all workspaces
npm run lint

# Run backend unit and integration test suites
npm run test:backend

# Run frontend Vitest component tests with coverage
npm run test:frontend

# Run production build validation
npm run build
```

---

## 📖 API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new account (Rate limited: 10/15m)
- `POST /api/auth/login` — Sign in and receive HttpOnly cookie (Rate limited: 10/15m)
- `POST /api/auth/logout` — Invalidate session and clear auth cookie
- `GET  /api/auth/me` — Retrieve current authenticated profile

### Problem Library (`/api/problems`)
- `GET    /api/problems` — List user problems with search, filtering, and pagination
- `POST   /api/problems` — Create a new DSA problem
- `GET    /api/problems/:id` — Retrieve problem details
- `PUT    /api/problems/:id` — Update problem metadata
- `DELETE /api/problems/:id` — Delete problem and cascade cleanup

### Practice Attempts (`/api/problems/:problemId/attempts`)
- `GET  /api/problems/:problemId/attempts` — List all attempts for a problem
- `POST /api/problems/:problemId/attempts` — Log new attempt and trigger auto-revision

### Spaced Revisions (`/api/revisions`)
- `GET /api/revisions/today` — Fetch all spaced revisions due on or before today
- `PUT /api/revisions/:id/complete` — Advance Leitner interval ($1\text{d} \rightarrow 7\text{d} \rightarrow 30\text{d} \rightarrow \text{Mastered}$)

### Learning Analytics (`/api/analytics`)
- `GET /api/analytics/dashboard` — Overview metrics, streak, and daily heatmap activity
- `GET /api/analytics/topics` — Mastery scores and struggle diagnostics across 16 topics
- `GET /api/analytics/streak` — Current and longest consecutive practice streak

### Personal Goals & Reports (`/api/goals`, `/api/reports`)
- `GET  /api/goals` — List goals with live computed progress percentages
- `POST /api/goals` — Create weekly problems, mastery, or practice time goal
- `GET  /api/reports/weekly` — Calendar week performance report with velocity comparison

### Mock Interview Assessments (`/api/assessments`)
- `POST   /api/assessments` — Create mock interview contest
- `GET    /api/assessments` — List user mock interviews
- `GET    /api/assessments/:id` — Contest session with countdown remaining seconds
- `POST   /api/assessments/:id/start` — Start contest clock
- `POST   /api/assessments/:id/submit` — Submit contest attempt with penalty calculations
- `POST   /api/assessments/:id/finish` — Finalize score, apply early bonus, evaluate readiness verdict
- `DELETE /api/assessments/:id` — Delete mock interview

### System Health (`/api/health`)
- `GET /api/health` — System status, uptime, database connection state, memory, and security flags

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.