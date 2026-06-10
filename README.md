# 🤖 HalfRobo — AI Robotics & IoT E-Commerce Platform

![HalfRobo Banner](client/src/assets/hero.png)

> A full-stack futuristic e-commerce platform for AI robots, drones, IoT devices and smart home products — built with React, Node.js, and PostgreSQL.

---

## ✨ Features

### 🛍️ Customer Side
- 🔐 User authentication (Register / Login / JWT)
- 🏠 Dynamic homepage with featured products & hero section
- 🛒 Shopping cart with save-for-later & coupon codes
- ❤️ Wishlist management
- 📦 Order placement, tracking & order history
- 🔍 Product search with filters, sorting & pagination
- 💬 Product reviews & ratings
- 👤 User dashboard & profile management

### ⚙️ Admin Panel
- 📊 Analytics dashboard with revenue charts & stats
- 📦 Full product management (add/edit/delete + image upload)
- 🗂️ Category management
- 🧾 Order management with status updates
- 👥 User management (block/unblock/delete)
- 🏷️ Coupon management (create, edit, activate)
- 📋 Review moderation
- 📦 Inventory & stock tracking
- ⚙️ Site settings — footer, contact, social links
- 🗺️ Live shop location map (admin-controlled)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, React Router v6 |
| **Styling** | Vanilla CSS, Glassmorphism, Neon effects |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **Backend** | Node.js, Express.js (ES Modules) |
| **Database** | PostgreSQL (Neon cloud) / SQLite (local) |
| **Auth** | JWT + bcryptjs |
| **File Upload** | Multer + Sharp |
| **Fonts** | Orbitron + Inter (Google Fonts) |

---

## 🚀 Quick Start (Local)

### Prerequisites
- Node.js 18+
- npm

### 1. Clone the repo
```bash
git clone https://github.com/yourname/halfrobo.git
cd halfrobo
```

### 2. Install dependencies
```bash
# Backend
cd server && npm install

# Frontend
cd ../client && npm install
```

### 3. Setup environment
```bash
cd server
cp .env.example .env
# Edit .env and add your database URL
```

### 4. Start both servers

**Terminal 1 — Backend:**
```bash
cd server
node server.js
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```

### 5. Open in browser
- 🌐 **Store:** http://localhost:5173
- 👑 **Admin:** http://localhost:5173/admin/login

---

## 🔑 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@halfrobo.com | admin123 |
| **User** | demo@halfrobo.com | demo123 |

---

## 🌐 Deployment

| Service | Purpose |
|---------|---------|
| [Vercel](https://vercel.com) | Frontend hosting (free) |
| [Render](https://render.com) | Backend API hosting (free) |
| [Neon](https://neon.tech) | PostgreSQL database (free) |

---

## 📁 Project Structure

```
halfrobo/
├── client/                  # React Frontend (Vite)
│   └── src/
│       ├── pages/
│       │   ├── user/        # Home, Products, Cart, Orders...
│       │   └── admin/       # Dashboard, Products, Orders...
│       ├── components/      # Navbar, Footer, ProductCard, Cart
│       ├── context/         # AuthContext, CartContext
│       └── utils/           # api.js (Axios instance)
│
└── server/                  # Node.js + Express Backend
    ├── config/              # database.js
    ├── middleware/          # auth.js, upload.js
    ├── routes/              # auth, products, cart, orders, admin...
    └── seed.js              # Database seeder
```

---

## 📸 Screenshots

> Futuristic dark UI with glassmorphism, neon glow effects, and smooth animations.

---

## 📄 License

MIT License — feel free to use and modify.

---

<p align="center">
  Built with ❤️ by <strong>Priyanshu Suman</strong> | Powered by AI & Robotics 🤖
</p>
