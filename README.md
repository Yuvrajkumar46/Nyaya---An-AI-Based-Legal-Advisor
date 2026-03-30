# Nyaya---An-AI-Based-Legal-Advisor
Nyaya is an AI-powered legal advisory platform for India that provides instant legal guidance, advocate discovery, secure video consultations, and document management. Built with React, Node.js, and MySQL, it ensures accessibility, transparency, and secure legal assistance through AI and modern web technologies.
<div align="center">

# ⚖️ Nyaya
### An AI-Based Legal Advisor

*न्याय — Justice for Everyone*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://mysql.com/)

**Nyaya** is a full-stack AI-powered legal advisory platform that bridges the gap between citizens and the legal system. Get instant AI legal guidance, connect with verified advocates, manage legal documents, and book consultations — all in one place.

</div>

---

## ✨ Features

- 🤖 **AI Legal Guidance** — Ask any legal question and get plain-language answers powered by AI
- 👨‍⚖️ **Advocate Discovery** — Browse and connect with verified legal professionals
- 📅 **Appointment Booking** — Schedule consultations with advocates at their available slots
- 📞 **Real-Time Video/Audio Calls** — Live consultations via WebSocket-powered calling
- 📁 **Document Management** — Upload, organize, preview, version, and share legal documents
- 💳 **Billing & Wallet** — In-app wallet to pay for consultations and manage transactions
- 🔔 **Notifications** — Real-time updates for appointments, calls, and documents
- 🛡️ **Admin Dashboard** — Full platform management, user control, and audit logs

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Vite, Tailwind CSS, Axios |
| Backend | Node.js, Express.js |
| Database | MySQL (with versioned migrations) |
| AI | Large Language Model API |
| Real-Time | Socket.IO (WebSockets) |
| Auth | JWT + bcrypt |
| File Uploads | Multer |
| API | RESTful — `/api/v1/` |

---

## 📁 Project Structure

```
nyaya/
├── backend/
│   ├── migrations/          # SQL migration files (001–006)
│   ├── src/
│   │   ├── config/          # DB and JWT config
│   │   ├── controllers/     # Business logic (auth, AI, billing, calls, docs...)
│   │   ├── middleware/      # Auth and admin middleware
│   │   ├── models/          # Database models (User, Advocate, Call, Document...)
│   │   ├── routes/          # Express route definitions
│   │   ├── socket/          # WebSocket call handler
│   │   ├── seeders/         # Database seed scripts
│   │   └── utils/           # Notification utilities
│   └── server.js            # Entry point
│
└── frontend/
    ├── src/
    │   ├── components/      # Reusable UI components
    │   ├── context/         # Auth and AdminAuth React contexts
    │   ├── pages/           # Pages (admin, billing, calls, documents, etc.)
    │   └── utils/           # Axios API utility
    └── index.html
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- MySQL 8.0+
- npm

---

### 1. Clone the Repository

```bash
git clone https://github.com/Yuvrajkumar46/Nyaya---An-AI-Based-Legal-Advisor.git
cd Nyaya---An-AI-Based-Legal-Advisor
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=legal_advisor
JWT_SECRET=your_jwt_secret_key
AI_API_KEY=your_ai_api_key
PORT=5000
```

Run database migrations:

```bash
node run-migrations.js
```

(Optional) Seed initial data:

```bash
node src/seeders/seedAllData.js
```

Start the backend server:

```bash
node server.js
```

The backend will run at `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will run at `http://localhost:5173`

---

## 👤 User Roles

| Role | Description |
|------|-------------|
| `user` | Regular citizens seeking legal help |
| `advocate` | Verified legal professionals |
| `admin` | Platform administrators |
| `director` | Highest authority with full access |

---

## 🔒 Security

- JWT-based authentication with refresh token support
- Passwords hashed with bcrypt
- Role-based access control (RBAC)
- Account lockout to prevent brute-force attacks
- Login audit logs and admin audit trails
- All secrets managed via environment variables (`.env`)

> ⚠️ **Never commit your `.env` file.** It is already excluded in `.gitignore`.

---

## 📡 API Overview

All API routes are versioned under `/api/v1/`:

| Module | Base Route |
|--------|-----------|
| Auth | `/api/v1/auth` |
| Users | `/api/v1/users` |
| Advocates | `/api/v1/professionals` |
| AI Guidance | `/api/v1/ai` |
| Appointments | `/api/v1/appointments` |
| Calls | `/api/v1/calls` |
| Documents | `/api/v1/documents` |
| Billing | `/api/v1/billing` |
| Notifications | `/api/v1/notifications` |
| Admin | `/api/v1/admin` |

All protected routes require a `Bearer <token>` in the `Authorization` header.

---

## 🗄️ Database Models

`User` · `Advocate` · `Appointment` · `Call` · `Document` · `DocumentVersion` · `DocumentSharing` · `BillingTransaction` · `LegalQuery` · `Notification` · `Review` · `RefreshToken` · `AccountLockout` · `LoginAuditLog` · `AdminAuditLog` · `UserConsent`

---

## 🛣️ Roadmap

- [ ] Multi-language support (Hindi + regional languages)
- [ ] Mobile app (React Native)
- [ ] Court database integration & case tracking
- [ ] AI-powered contract analysis and drafting
- [ ] E-signature support
- [ ] Bar Council of India verification for advocates
- [ ] UPI / Razorpay payment gateway
- [ ] Voice-based legal query input

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🙏 Acknowledgements

Built with ❤️ using React, Node.js, Express, Socket.IO, and MySQL.

---

<div align="center">
  <sub><i>"Nyaya — Justice for Everyone."</i></sub>
</div>
