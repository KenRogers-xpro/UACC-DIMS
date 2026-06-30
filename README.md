# UACC-DIMS

**Uganda Air Cargo Corporation — Digital Information and Management System**

A secure, role-based internal platform for document management, procurement approvals, staff activity logging, and AI-powered operational insights.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Auth | NextAuth v5 (Credentials + JWT) |
| Database / API | Backend REST API (frontend communicates with backend for all data and auth) |
| Styling | Tailwind CSS v4 + custom design tokens |
| AI | Claude (Anthropic API) — coming soon |

---

## 🚀 Getting Started (Fresh Clone)

### 1. Clone the repository

```bash
git clone https://github.com/KenRogers-xpro/UACC-DIMS.git
cd UACC-DIMS
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

Then open `.env.local` and update the frontend-specific variables:

```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api"   # Backend API base URL
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="YOUR_GENERATED_SECRET"
```

To generate a secure `AUTH_SECRET`, run:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Note: The frontend no longer talks directly to the database. All database operations and user management are performed by the backend API.

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
UACC-DIMS/
├── auth.js                          # NextAuth v5 root config (delegates auth to backend API)
├── lib/
│   └── ai.js                        # AI agent helper
├── src/
│   └── app/
│       ├── globals.css              # Design system (tokens, glass panels, animations)
│       ├── layout.jsx               # Root layout
│       ├── page.jsx                 # Landing page
│       ├── login/
│       │   └── page.jsx             # Login page (NextAuth credentials)
│       └── api/
│           └── auth/
│               └── [...nextauth]/
│                   └── route.js     # NextAuth API handler
├── components/                      # Shared UI components
├── .env.example                     # Environment variable template
└── .gitignore
```

---

## 👥 Roles

| Role | Access |
|---|---|
| `GENERAL_MANAGER` | Full system access, final procurement approval |
| `DEPARTMENT_HEAD` | Department-level approval, staff oversight |
| `STAFF` | Submit requests, upload documents, log activity |
| `IT_ADMINISTRATOR` | User management, system settings |
| `AUDITOR` | Read-only audit trail access |

---

## 🏢 Departments

`GENERAL_MANAGER_OFFICE` · `FINANCE_AND_ADMINISTRATION` · `ENGINEERING` · `PILOTS` · `OPERATIONS`

---

## 🔐 Security Notes

- Passwords are stored as **bcrypt hashes** (never plain text)
- Sessions are **JWT-based** (stateless, no DB session table needed)
- `.env.local` is **never committed** — always use `.env.example` as your template
- Role-based middleware (coming soon) will restrict routes per role

---

## 📄 License

Internal use only — Uganda Air Cargo Corporation © 2026. All rights reserved.  
Developed by **Lutaaya Ken Rogers** · Nkumba University · BCS Final Year Project 2026
