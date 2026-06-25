# UACC-DIMS

**Uganda Air Cargo Corporation — Digital Information and Management System**

A secure, role-based internal platform for document management, procurement approvals, staff activity logging, and AI-powered operational insights.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Auth | NextAuth v5 (Credentials + JWT) |
| Database | MySQL via Prisma ORM |
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

Then open `.env.local` and update:

```env
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/uacc_dims"
AUTH_SECRET="YOUR_GENERATED_SECRET"
NEXTAUTH_URL="http://localhost:3000"
```

To generate a secure `AUTH_SECRET`, run:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. Set up the database

Make sure MySQL is running and the `uacc_dims` database exists, then push the Prisma schema:

```bash
npx prisma db push
```

Or to use migrations (recommended for production):

```bash
npx prisma migrate dev --name init
```

### 5. (Optional) Seed an admin user

```bash
npx prisma studio
```

Use Prisma Studio to manually insert your first `IT_ADMINISTRATOR` user with a bcrypt-hashed password.

> To hash a password manually:
> ```bash
> node -e "const b=require('bcryptjs');b.hash('yourpassword',12).then(console.log)"
> ```

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
UACC-DIMS/
├── auth.js                          # NextAuth v5 root config (credentials + JWT)
├── prisma/
│   └── schema.prisma                # Database schema (MySQL)
├── lib/
│   ├── prisma.js                    # Prisma client singleton
│   └── ai.js                       # AI agent helper
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
