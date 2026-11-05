# TaskFlow – Modern Task Management System

TaskFlow is a production-ready, full-stack task management web application designed for teams to organize, assign, and track tasks with real-time status updates and automated email notifications.

Built with **Next.js (React 19)**, **Flask (Python 3.14)**, **Supabase PostgreSQL**, **Google OAuth**, and **Gmail Notification Services**.

---

## 🚀 Key Features

- **Google OAuth Authentication:** Secure sign-in powered by Supabase Auth with Google Identity provider.
- **Dynamic Task Dashboard:**
  - Real-time statistics: Total tasks, Pending, In-Progress, and Completed.
  - Interactive status tabs with percentage indicators.
- **Comprehensive Task Lifecycle:**
  - Create tasks with title, description, assignee, and due date.
  - Quick 1-click status transitions (`Pending` ➔ `In Progress` ➔ `Completed`).
  - Edit task details and reassign to team members.
  - Delete tasks with confirmation guards.
- **Team Assignment:** Assign tasks to registered workspace users fetched dynamically from Supabase profiles.
- **Gmail Notifications:**
  - Automated HTML & plain-text emails sent when tasks are assigned or marked as completed.
  - Safe credential validation (clear warnings if unconfigured, no hardcoded secrets).
- **Search & Filter:** Instant search by task title, description, or assigned team member.
- **Security-First Architecture:**
  - Supabase Service Role key restricted strictly to backend environment.
  - Row Level Security (RLS) policies guarding PostgreSQL tables.
  - Zero sensitive secrets exposed to browser bundles.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide Icons |
| **Backend** | Python 3.14, Flask, Flask-CORS, python-dotenv, Requests, PyJWT |
| **Database & Auth** | Supabase (PostgreSQL 15), Supabase Auth (Google OAuth 2.0), PostgREST |
| **Email Service** | Gmail SMTP / Google OAuth2, TLS 587, Multi-part HTML/Text MIME |

---

## 📁 Project Structure

```text
TaskFlow/
├── .env.example                 # Root environment variable template
├── .gitignore                   # Universal git ignore for secrets, venvs, and build artifacts
├── README.md                    # Complete project documentation and guide
│
├── backend/                     # Flask REST API Backend
│   ├── .venv/                   # Python virtual environment (auto-created)
│   ├── .env                     # Backend private credentials (DO NOT COMMIT)
│   ├── .env.example             # Backend environment template
│   ├── .gitignore               # Backend gitignore
│   ├── app.py                   # Main Flask REST API application & routing
│   ├── supabase_client.py       # Direct PostgREST client for Supabase
│   ├── email_service.py         # Gmail notification engine (HTML + Text)
│   ├── schema.sql               # Supabase database schema, triggers, and RLS policies
│   └── requirements.txt         # Python package dependencies
│
└── frontend/                    # Next.js React Frontend
    ├── .env.local               # Frontend public credentials (DO NOT COMMIT)
    ├── .env.example             # Frontend environment template
    ├── package.json             # NPM dependencies and scripts
    ├── next.config.ts           # Next.js configuration
    ├── tsconfig.json            # TypeScript configuration
    ├── public/                  # Static assets and icons
    └── src/
        ├── app/
        │   ├── globals.css      # Tailwind styling
        │   ├── layout.tsx       # Root HTML layout with system typography
        │   └── page.tsx         # Main interactive TaskFlow dashboard
        ├── components/
        │   ├── Navbar.tsx       # Navigation header with health check & user profile
        │   ├── DashboardStats.tsx # 4 responsive task metric cards
        │   ├── TaskCard.tsx     # Task item card with quick status & action buttons
        │   ├── TaskModal.tsx    # Modal form for creating and editing tasks
        │   └── AuthModal.tsx    # Google OAuth and Demo login modal
        ├── lib/
        │   ├── api.ts           # REST API client connecting to Flask backend
        │   └── supabaseClient.ts # Supabase Auth client for browser session
        └── types/
            └── index.ts         # TypeScript interfaces (Task, User, Status)
```

---

## ⚙️ Step-by-Step Installation & Setup

### 1. Database Setup (Supabase)

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** in the left sidebar.
3. Click **New Query**.
4. Copy the entire contents of [`backend/schema.sql`](backend/schema.sql) and paste it into the editor.
5. Click **Run**.
   - This creates the `profiles` table, the auto-sync trigger from `auth.users`, the `tasks` table, foreign keys, indexes, and enables Row Level Security (RLS) policies.

---

### 2. Google OAuth Setup

1. In the **Google Cloud Console** ([console.cloud.google.com](https://console.cloud.google.com/)):
   - Create a project: `TaskFlow`.
   - Go to **APIs & Services** ➔ **OAuth consent screen**:
     - User Type: **External**.
     - Fill in App name (`TaskFlow`) and support email.
   - Go to **Credentials** ➔ **Create Credentials** ➔ **OAuth client ID**:
     - Application type: **Web application**.
     - Under **Authorized redirect URIs**, add your Supabase Auth callback URL:
       `https://<your-project-id>.supabase.co/auth/v1/callback`
     - Copy your **Client ID** and **Client Secret**.

2. In your **Supabase Dashboard**:
   - Go to **Authentication** ➔ **Providers**.
   - Expand **Google**, toggle it **ON**.
   - Paste your **Client ID** and **Client Secret**.
   - Click **Save**.

---

### 3. Environment Variables Setup

#### Backend (`backend/.env`):
Create or update `backend/.env`:
```ini
SUPABASE_URL=https://qvwgofrjwmrkvlqevxup.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_your_secret_key_here
PORT=5000
FLASK_DEBUG=True

# Optional: Gmail Notifications Setup
# To enable automated Gmail sending, create an App Password in your Google Account:
# (Google Account -> Security -> 2-Step Verification -> App Passwords)
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
```

#### Frontend (`frontend/.env.local`):
Create or update `frontend/.env.local`:
```ini
NEXT_PUBLIC_SUPABASE_URL=https://qvwgofrjwmrkvlqevxup.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_public_key
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 🏃 Running the Application

Open **two separate Windows PowerShell terminals**:

### Terminal 1: Start Flask Backend

```powershell
# Navigate to the backend directory
cd c:\Users\VIJAYAGOUDA\Desktop\TaskFlow\backend

# Activate the virtual environment
.\.venv\Scripts\Activate.ps1

# Start the Flask API server
python app.py
```
> The backend will start on: **`http://localhost:5000`**  
> Health check URL: `http://localhost:5000/api/health`

---

### Terminal 2: Start Next.js Frontend

```powershell
# Navigate to the frontend directory
cd c:\Users\VIJAYAGOUDA\Desktop\TaskFlow\frontend

# Start the Next.js development server
npm run dev
```
> The frontend will open on: **`http://localhost:3000`**

---

## 📡 REST API Documentation

| Method | Endpoint | Description | Request Body / Query |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | System health, DB connection, & email status | None |
| `GET` | `/api/tasks` | Get all tasks (supports filters) | Query: `?status=pending&assigned_to=...` |
| `POST` | `/api/tasks` | Create a new task & trigger email | `{"title": "Task 1", "description": "...", "assigned_to": "..."}` |
| `GET` | `/api/tasks/<id>` | Get single task details | None |
| `PUT` | `/api/tasks/<id>` | Full update of task | `{"title": "Updated", "status": "in_progress", ...}` |
| `PATCH` | `/api/tasks/<id>/status` | Quick update status & set completed timestamp | `{"status": "completed"}` |
| `DELETE`| `/api/tasks/<id>` | Delete a task | None |
| `GET` | `/api/users` | List registered user profiles for assignment | None |
| `POST` | `/api/notify/test` | Test Gmail notification delivery | `{"email": "recipient@example.com"}` |

---

## 🧪 Verification & Testing

### 1. Test Backend API
Run this PowerShell command in the terminal to verify the backend:
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get
```
Expected output:
```json
{
  "status": "healthy",
  "database": { "connected": true, "status": "Supabase reachable" },
  "email_notifications": { "configured": false, "provider": "..." }
}
```

### 2. Test Frontend Build
```powershell
cd c:\Users\VIJAYAGOUDA\Desktop\TaskFlow\frontend
npm run build
```
Build output:
`✓ Compiled successfully in ~2s` with 0 errors.

---

## 🚢 Deployment Guidelines

### Frontend Deployment (Vercel)
1. Push your repository to GitHub (ensure `.env` and `.env.local` are in `.gitignore`).
2. Go to [Vercel](https://vercel.com/) and click **Import Project**.
3. Set the Root Directory to `frontend`.
4. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL` (points to your deployed backend URL).
5. Click **Deploy**.

### Backend Deployment (Render or Railway)
1. Create a new Web Service on Render or Railway connected to your repository.
2. Set Root Directory to `backend`.
3. Set Build Command: `pip install -r requirements.txt`.
4. Set Start Command: `gunicorn app:app` or `python app.py`.
5. Add Environment Variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`.

---

## 💡 Internship Interview Preparation Guide

When discussing this project in an interview, highlight these key design points:

1. **Separation of Concerns:** The Next.js frontend handles responsive UI state, user sessions, and client-side interactions, while the Flask backend acts as the secure intermediary validating business logic, handling emails, and interacting with Supabase.
2. **Security & Least Privilege:** The secret Supabase `service_role` key never touches the browser. It remains exclusively inside the Flask backend. The client-side utilizes only public anon keys and Google OAuth tokens.
3. **Robust Fallback Strategy:** If Gmail SMTP credentials or Supabase OAuth keys are missing, the application does not crash. It provides explicit status messages and demo modes so evaluators can inspect every feature immediately.
4. **PostgreSQL Relational Design:** User profiles are automatically synchronized with Supabase's `auth.users` via PostgreSQL triggers, enabling task assignment without manual user table synchronization.

