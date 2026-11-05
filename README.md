# TaskFlow – Task Management Application

TaskFlow is a full-stack task management application designed to help users create, organize, assign, and track tasks efficiently. It includes Google authentication, task status management, Supabase database integration, and Gmail email notifications.

## 🚀 Features

- **Google Authentication:** Sign in using your Google account.
- **Task Creation:** Create tasks with titles, descriptions, and due dates.
- **Task Assignment:** Assign tasks to registered team members.
- **Task Management:** View, update, and delete tasks.
- **Status Tracking:** Track Pending, In Progress, and Completed tasks.
- **Email Notifications:** Send Gmail notifications for task events.
- **Dashboard:** View task statistics and task details.
- **Database Integration:** Store application data using Supabase.

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, TypeScript |
| Styling | CSS |
| Backend | Python, Flask |
| Database | Supabase |
| Authentication | Supabase Auth, Google OAuth |
| Email Service | Gmail SMTP |
| Version Control | Git and GitHub |

## 📁 Project Structure

```text
TaskFlow/
│
├── backend/
│   ├── app.py
│   ├── email_service.py
│   ├── supabase_client.py
│   ├── schema.sql
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── types/
│   ├── package.json
│   └── .env.example
│
├── .env.example
├── .gitignore
└── README.md
```

## ⚙️ Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/Vijaypatil713/TaskFlow.git
cd TaskFlow
```

### 2. Backend Setup

Open a terminal:

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment on Windows:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside the backend folder using `.env.example` as a reference.

Configure:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_secret_key
GMAIL_USER=your_gmail_address
GMAIL_APP_PASSWORD=your_gmail_app_password
```

Start the Flask server:

```bash
python app.py
```

Backend URL:

`http://127.0.0.1:5000`

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
```

Create `.env.local` using the frontend `.env.example` file.

Configure:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_key
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Start the development server:

```bash
npm run dev
```

Frontend URL:

`http://localhost:3000`

## 🗄️ Supabase Configuration

1. Create a Supabase project.
2. Configure Google authentication in Supabase Auth.
3. Configure the Google OAuth credentials and redirect URL.
4. Execute the database schema from `backend/schema.sql` in the Supabase SQL Editor.
5. Configure the Supabase environment variables in the frontend and backend.

## 📧 Gmail Configuration

To enable email notifications:

1. Enable 2-Step Verification on your Google account.
2. Generate a Gmail App Password.
3. Add the Gmail address and App Password to `backend/.env`.
4. Restart the Flask backend.

Never upload your `.env` files or secret credentials to GitHub.

## 🧪 Testing

The following features have been tested during local development:

- Backend health endpoint.
- Google sign-in.
- Task creation.
- Task status updates.
- Gmail notification delivery.

Task assignment should also be tested with multiple registered accounts.

## 🔗 Project Links

**GitHub Repository:**  
https://github.com/Vijaypatil713/TaskFlow

**Frontend:** Next.js – Port 3000

**Backend:** Flask – Port 5000

## 👨‍💻 Developer

**Vijayagouda B Patil**  
B.E. Computer Science and Business Systems  
S. G. Balekundri Institute of Technology

GitHub: https://github.com/Vijaypatil713

---

*TaskFlow – Organize Tasks. Manage Work. Track Progress.*