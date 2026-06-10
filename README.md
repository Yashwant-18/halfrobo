# 🤖 HalfRobo E-Commerce Platform — Setup Guide

## Prerequisites

Before running HalfRobo, install these:

1. **Node.js 18+** — https://nodejs.org
2. **PostgreSQL 15+** — https://www.postgresql.org/download/windows/

---

## Step 1 — Install PostgreSQL

1. Download from: https://www.postgresql.org/download/windows/
2. During install:
   - Set password: `postgres` (or change it in `.env`)
   - Default port: `5432`
   - Keep pgAdmin checked ✅

---

## Step 2 — Create the Database

Open **pgAdmin** or **psql** and run:
```sql
CREATE DATABASE halfrobo;
```

Or via command line:
```powershell
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -c "CREATE DATABASE halfrobo;"
```

---

## Step 3 — Configure Environment

Edit `server/.env` to match your PostgreSQL password:
```
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/halfrobo
JWT_SECRET=halfrobo_jwt_secret_2024_ultra_secure_key
JWT_EXPIRES_IN=7d
```
> Change `postgres:postgres` to `postgres:YOUR_PASSWORD` if you used a different password.

---

## Step 4 — Install Dependencies

```powershell
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

---

## Step 5 — Seed the Database

```powershell
cd server
npm run seed
```

This creates:
- ✅ All database tables
- 👤 Admin: `admin@halfrobo.com` / `admin123`
- 👤 Demo user: `demo@halfrobo.com` / `demo123`
- 📦 16 products across 8 categories
- 🎟️ 3 coupon codes: `WELCOME10`, `ROBO20`, `HALFROBO50`

---

## Step 6 — Run the Platform

**Option A — Use the root convenience script:**
```powershell
cd halfrobo
npm run dev
```

**Option B — Run separately:**
```powershell
# Terminal 1 — Backend
cd server && npm start

# Terminal 2 — Frontend
cd client && npm run dev
```

---

## 🌐 Access the Platform

| URL | Description |
|-----|-------------|
| http://localhost:5173 | 🛍️ User Store |
| http://localhost:5173/admin | ⚙️ Admin Panel |
| http://localhost:5173/admin/login | 🔐 Admin Login |
| http://localhost:5000/api/health | 💚 API Health Check |

---

## 🔑 Default Credentials

| Account | Email | Password |
|---------|-------|----------|
| Admin | admin@halfrobo.com | admin123 |
| Demo User | demo@halfrobo.com | demo123 |

---

## 🎟️ Coupon Codes

| Code | Discount |
|------|----------|
| `WELCOME10` | 10% off (min ₹100) |
| `ROBO20` | 20% off (min ₹500) |
| `HALFROBO50` | ₹50 flat off (min ₹200) |

---

## 📁 Project Structure

```
halfrobo/
├── client/          # React + Vite frontend
│   └── src/
│       ├── pages/
│       │   ├── user/    # User-facing pages
│       │   └── admin/   # Admin panel pages
│       ├── components/  # Reusable UI components
│       ├── context/     # AuthContext, CartContext
│       └── layouts/     # UserLayout, AdminLayout
├── server/          # Node.js + Express backend
│   ├── routes/      # API route handlers
│   ├── middleware/  # Auth + upload middleware
│   └── config/      # Database connection
└── package.json     # Root convenience scripts
```

---

## 🚀 Features

### User Store
- 🏠 Futuristic animated homepage
- 🛍️ Products with filters, search, sort, pagination
- 🤖 Detailed product pages with specs & reviews
- 🛒 Full shopping cart with save-for-later
- 💳 3-step checkout (Shipping → Payment → Review)
- ✅ Order confirmation with animation
- 👤 User dashboard with order history
- ℹ️ About & Contact pages

### Admin Panel
- 📊 Analytics dashboard with charts
- 📦 Product management (add/edit/delete + image upload)
- 📋 Order management with status tracking
- 👥 User management (block/unblock)
- 🏷️ Category management
- ⭐ Review moderation (approve/reject)
- 📉 Inventory management with stock alerts
- ⚙️ Settings + coupon management

### Tech Stack
- **Frontend**: React 19, Vite, Framer Motion, Recharts
- **Backend**: Node.js, Express (ES Modules)
- **Database**: PostgreSQL
- **Auth**: JWT + bcryptjs
- **Images**: Multer + Sharp (auto-resize to WebP)
