# 🏆 Oxygen Sports — AI Match Preparation Checklist

> An AI-powered pre-match preparation platform for athletes. Generate personalised checklists covering equipment, warm-up, nutrition, and mental readiness — in seconds.

![Stack](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue)
![Stack](https://img.shields.io/badge/Backend-Flask%20%2B%20PostgreSQL-green)
![Stack](https://img.shields.io/badge/Auth-Firebase-orange)
![Stack](https://img.shields.io/badge/AI-Gemini%20%2F%20OpenAI-purple)
![Deployed](https://img.shields.io/badge/Deployed-Render%20%2B%20Netlify-brightgreen)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [User Roles](#user-roles)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Known Issues & Notes](#known-issues--notes)

---

## Overview

Oxygen Sports lets athletes generate a personalised pre-match checklist by entering their name, sport, match format, competition level, and any additional notes. The AI (Google Gemini or OpenAI GPT-4o) returns a structured checklist across four categories: **Equipment**, **Warm-Up**, **Nutrition**, and **Mental Readiness**.

Admins can monitor platform usage via an analytics dashboard and configure the AI prompt and registration code from a settings panel — all without touching the code.

---

## Features

### Player
- Generate an AI checklist tailored to sport, format, and level
- Tick off checklist items with live progress tracking
- Rate the checklist (1–5 stars)
- Save checklists to personal history (stored in backend DB)
- Preview and update saved checklists
- Copy to clipboard or export as `.txt`

### Admin
- Full analytics dashboard — total generations, feedback, ratings, sports breakdown
- View all generations and users
- Edit the AI system prompt live from the Settings tab
- Update the admin registration code without redeploying

### Auth
- Firebase Authentication — email/password, Google, and GitHub sign-in
- Email verification on signup
- Role-based access: **Player** and **Admin**
- Admin registration requires a secret code (set via Settings tab)
- All user records stored in Firestore

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tabler Icons |
| Auth | Firebase Auth + Firestore |
| Backend | Python 3.12, Flask 3.0 |
| Database | PostgreSQL (Neon) via SQLAlchemy |
| AI | Google Gemini (`gemini-1.5-flash`) or OpenAI (`gpt-4o`) |
| Hosting | Netlify (frontend) + Render (backend) |

---

## Project Structure

```
OxtgenSportsApp/
│
├── backend/
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── analytics.py      # GET /api/analytics
│   │   ├── auth.py           # POST /api/auth/register, /login, /me
│   │   ├── checklist.py      # POST /api/generate
│   │   ├── config.py         # GET/POST /api/config
│   │   ├── feedback.py       # POST /api/feedback
│   │   └── history.py        # GET/POST/PUT/DELETE /api/history
│   ├── .env                  # Local secrets (never commit)
│   ├── .env.example          # Template for env vars
│   ├── ai_service.py         # Gemini + OpenAI callers, prompt builder
│   ├── app.py                # Flask app factory + entry point
│   ├── config.py             # Config class (reads from .env)
│   ├── database.py           # SQLAlchemy models: User, Generation, Feedback, Config
│   ├── requirements.txt      # Python dependencies
│   ├── run_backend.bat       # Windows quick-start script
│   └── runtime.txt           # python-3.12.9 (for Render)
│
└── src/
    ├── component/
    │   ├── analytics/
    │   │   ├── Analytics.jsx     # Admin analytics dashboard
    │   │   └── Analytics.css
    │   ├── login/
    │   │   ├── Login.jsx         # Player login page (used by ProtectedRoute)
    │   │   └── Login.css
    │   ├── oxygensportsmatchprep/
    │   │   ├── oxygensportmatchprep.jsx   # Main player checklist UI
    │   │   └── oxygensportmatchprep.css
    │   ├── superman/
    │   │   ├── SupermanDashboard.jsx      # Admin dashboard
    │   │   └── SupermanDashboard.css
    │   └── ProtectedRoute.jsx    # Auth guard (redirects to Login if not signed in)
    ├── config/
    │   └── api.js                # Backend API base URL
    ├── context/
    │   └── AuthContext.jsx       # Firebase auth state + role resolution
    ├── App.jsx                   # Root: routing, auth flow, role-based page rendering
    ├── App.css
    ├── firebase.js               # Firebase app + auth + provider init
    ├── main.jsx
    └── index.css
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.12
- A **Firebase project** with Authentication (Email/Password, Google, GitHub) and Firestore enabled
- A **PostgreSQL** database (Neon recommended — free tier works)
- A **Gemini API key** from [Google AI Studio](https://aistudio.google.com/) or an **OpenAI API key**

---

### Backend Setup

```bash
# 1. Navigate to backend folder
cd backend

# 2. Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy env template and fill in your values
cp .env.example .env

# 5. Start the server
python app.py
```

The backend runs on `http://localhost:5000` by default.

On **Windows**, you can also double-click `run_backend.bat`.

---

### Frontend Setup

```bash
# 1. From the project root
npm install

# 2. Start dev server
npm run dev
```

The frontend runs on `http://localhost:5173` by default.

---

## Environment Variables

### Backend — `backend/.env`

```env
# Flask
SECRET_KEY=your_random_secret_key
DEBUG=True

# Database (PostgreSQL / Neon)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# AI Provider — choose "gemini" or "openai"
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash

OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o

# CORS — comma-separated frontend origins, or * for development
ALLOWED_ORIGINS=http://localhost:5173,https://your-app.netlify.app

# Admin API secret (used by admin Settings tab to update prompt/code)
ADMIN_SECRET=OXYGEN2024
```

> ⚠️ **Never commit your `.env` file.** It contains secret keys.

### Frontend — `src/config/api.js`

```js
const API = "https://your-backend.onrender.com/api";
export default API;
```

Change this to `http://localhost:5000/api` for local development.

---

## User Roles

| Role | How to get it | Access |
|---|---|---|
| **Player** | Sign up normally (email, Google, or GitHub) | Generate checklists, view personal history |
| **Admin** | Sign up via the Admin path + enter the admin registration code | Everything above + Admin Dashboard, Analytics, Settings |

The admin registration code defaults to `OXYGEN2024` and can be changed at any time from the **Settings tab** in the Admin Dashboard — no redeployment needed.

Role assignments are stored in **Firestore** under the `users` collection. The role is read on every login and cannot be changed by the user.

---

## API Reference

All endpoints are prefixed with `/api`.

### Checklist
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/generate` | Generate AI checklist and save to DB |

### History
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/history` | List generations (filter by `?uid=`, `?sport=`, `?limit=`) |
| `GET` | `/history/<id>` | Get a single generation |
| `POST` | `/history` | Save a generation manually |
| `PUT` | `/history/<id>` | Update checklist or rating |
| `DELETE` | `/history/<id>` | Delete a generation |

### Feedback
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/feedback` | Submit or update a star rating |
| `GET` | `/feedback/<generation_id>` | Get feedback for a generation |

### Analytics
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/analytics` | Get usage stats (totals, by sport, by user, ratings) |

### Config (Admin)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/config` | List all config entries |
| `GET` | `/config/<key>` | Get a single config value |
| `POST` | `/config` | Create/update a config value (requires `X-Admin-Secret` header) |
| `POST` | `/config/validate-admin-code` | Validate an admin registration code |

---

## Deployment

### Backend — Render

1. Push the `backend/` folder to a GitHub repo (or the whole monorepo).
2. Create a new **Web Service** on [Render](https://render.com).
3. Set **Build Command**: `pip install -r requirements.txt`
4. Set **Start Command**: `python app.py`
5. Add all environment variables from `.env` in the Render dashboard.
6. Add `runtime.txt` containing `python-3.12.9` to pin the Python version.

### Frontend — Netlify

1. Connect your GitHub repo to [Netlify](https://netlify.com).
2. Set **Build Command**: `npm run build`
3. Set **Publish Directory**: `dist`
4. Update `src/config/api.js` to point to your Render backend URL.
5. Add a `_redirects` file in `public/` with:
   ```
   /* /index.html 200
   ```
   This ensures React Router works correctly on page refresh.

---

## Known Issues & Notes

- **Gemini model name**: The `.env.example` shows `gemini-3.5-flash` which does not exist. Use `gemini-1.5-flash` or `gemini-2.0-flash` instead.
- **`ProtectedRoute.jsx`**: This component exists and is wired to `Login.jsx` for the player flow. `App.jsx` handles admin routing separately via its own inline `LoginPage`. Both are intentional — `ProtectedRoute` is the player guard; `App.jsx` handles the role-selection and admin-code flow.
- **Flask auth routes** (`/api/auth/register`, `/api/auth/login`): These exist in the backend but are not used by the frontend, which relies entirely on Firebase Auth. They are safe to leave in place for future use or can be removed.
- **Firestore rules**: Make sure your Firestore security rules allow authenticated users to read/write their own `users/{uid}` document. A minimal rule set:
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /users/{uid} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }
  }
  ```
- **PostgreSQL on Neon**: The free tier has a brief cold-start delay (~1–2 s) on the first query after inactivity. This is normal.

---

## License

This project is private. All rights reserved — Oxygen Sports.
