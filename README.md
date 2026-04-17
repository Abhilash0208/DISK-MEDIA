# Disk Media 🎬

A production-ready multimedia platform delivering news, videos, podcasts, and live streams with AI-powered personalization, real-time updates, and built-in monetization.

---

## Tech Stack

| Layer       | Technology                                  |
|-------------|---------------------------------------------|
| Frontend    | React 18, Vite, Zustand, React Router v6    |
| Backend     | Node.js, Express.js, Socket.io              |
| Database    | MongoDB Atlas + Mongoose                    |
| Media       | Cloudinary (images, video, audio)           |
| Auth        | JWT (access + refresh) + Google OAuth       |
| Payments    | Stripe (subscriptions + webhooks)           |
| Push Notifs | Firebase Cloud Messaging                    |
| Hosting     | Vercel (frontend) + Render (backend)        |
| CI/CD       | GitHub Actions                              |

---

## Project Structure

```
disk-media/
├── frontend/                  # React + Vite SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/          # ProtectedRoute guards
│   │   │   ├── common/        # SkeletonCard, PageLoader
│   │   │   ├── content/       # MediaCard, HeroSection, BreakingTicker, TrendingSidebar
│   │   │   ├── layout/        # Navbar
│   │   │   └── player/        # MiniPlayer (audio + video)
│   │   ├── hooks/             # useAuth, useInfiniteScroll, useSocket
│   │   ├── pages/             # All page components
│   │   ├── services/          # api.js (Axios), firebase.js
│   │   ├── store/             # Zustand: auth, content, player, ui
│   │   ├── styles/            # globals.css (design tokens, dark/light)
│   │   └── utils/             # helpers.js (timeAgo, formatDuration, validators)
│   ├── public/
│   │   └── firebase-messaging-sw.js
│   ├── index.html
│   ├── vite.config.js
│   └── vercel.json
│
├── backend/                   # Node.js + Express API
│   ├── src/
│   │   ├── config/            # db.js, firebase.js, cloudinary.js
│   │   ├── controllers/       # auth.controller.js, content.controller.js
│   │   ├── jobs/              # trendingScore.job.js (cron)
│   │   ├── middleware/        # auth, role, validate
│   │   ├── models/            # User, Content, Behavior, Subscription, Notification
│   │   ├── routes/            # auth, content, feed, search, behavior, subscribe, admin
│   │   ├── services/          # recommendation, notification, email
│   │   └── server.js
│   ├── tests/
│   │   └── api.test.js
│   ├── render.yaml
│   └── jest.config.js
│
└── .github/
    └── workflows/
        └── deploy.yml
```

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free M0 cluster)
- Cloudinary account (free)
- Stripe account (test mode)
- Firebase project

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/disk-media.git
cd disk-media
npm run install:all
```

### 2. Environment Variables

**Backend** — copy and fill in `backend/.env`:
```bash
cp backend/.env.example backend/.env
```

**Frontend** — copy and fill in `frontend/.env`:
```bash
cp frontend/.env.example frontend/.env
```

### 3. Start Development Servers

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/health

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable                    | Description                              |
|-----------------------------|------------------------------------------|
| `MONGODB_URI`               | MongoDB Atlas connection string          |
| `JWT_ACCESS_SECRET`         | Random 64-char string for access tokens |
| `JWT_REFRESH_SECRET`        | Random 64-char string for refresh tokens|
| `CLOUDINARY_CLOUD_NAME`     | From Cloudinary dashboard               |
| `CLOUDINARY_API_KEY`        | From Cloudinary dashboard               |
| `CLOUDINARY_API_SECRET`     | From Cloudinary dashboard               |
| `STRIPE_SECRET_KEY`         | `sk_test_...` from Stripe dashboard     |
| `STRIPE_WEBHOOK_SECRET`     | From Stripe webhook settings            |
| `STRIPE_PREMIUM_PRICE_ID`   | `price_...` for Premium plan            |
| `STRIPE_ENTERPRISE_PRICE_ID`| `price_...` for Enterprise plan         |
| `FIREBASE_SERVICE_ACCOUNT`  | JSON string from Firebase service account |
| `FRONTEND_URL`              | Your Vercel URL (for CORS)              |

### Frontend (`frontend/.env`)

| Variable                           | Description                    |
|------------------------------------|--------------------------------|
| `VITE_API_URL`                     | Backend API URL                |
| `VITE_SOCKET_URL`                  | Backend WebSocket URL          |
| `VITE_STRIPE_PUBLIC_KEY`           | `pk_test_...`                  |
| `VITE_FIREBASE_API_KEY`            | Firebase web config            |
| `VITE_FIREBASE_AUTH_DOMAIN`        | Firebase web config            |
| `VITE_FIREBASE_PROJECT_ID`         | Firebase web config            |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`| Firebase web config            |
| `VITE_FIREBASE_APP_ID`             | Firebase web config            |
| `VITE_FIREBASE_VAPID_KEY`          | From Firebase Cloud Messaging  |
| `VITE_CLOUDINARY_CLOUD_NAME`       | For direct client uploads      |

---

## Deployment

### MongoDB Atlas
1. Create free M0 cluster at cloud.mongodb.com
2. Create database user (username + password)
3. Network Access → Add IP `0.0.0.0/0`
4. Get connection string → paste into `MONGODB_URI`
5. Enable **Atlas Search** index on `content` collection (use default config)

### Backend → Render
1. Push code to GitHub
2. render.com → New Web Service → connect repo
3. Root directory: `backend`
4. Build: `npm install` | Start: `node src/server.js`
5. Add all env vars from `backend/.env`
6. Copy the deploy hook URL → GitHub Secret `RENDER_DEPLOY_HOOK_URL`

### Frontend → Vercel
1. vercel.com → Add New Project → import repo
2. Root directory: `frontend`
3. Framework preset: **Vite**
4. Add all `VITE_*` env vars
5. Copy Vercel token, org ID, project ID → GitHub Secrets

### GitHub Secrets Required
```
VITE_API_URL
VITE_SOCKET_URL
VITE_STRIPE_PUBLIC_KEY
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_VAPID_KEY
VITE_CLOUDINARY_CLOUD_NAME
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
RENDER_DEPLOY_HOOK_URL
MONGODB_URI_TEST
```

---

## API Reference

### Auth
| Method | Endpoint                  | Auth     | Description           |
|--------|---------------------------|----------|-----------------------|
| POST   | `/api/auth/register`      | —        | Create account        |
| POST   | `/api/auth/login`         | —        | Login, get tokens     |
| POST   | `/api/auth/google`        | —        | Google OAuth login    |
| POST   | `/api/auth/refresh`       | Cookie   | Refresh access token  |
| POST   | `/api/auth/logout`        | —        | Clear refresh cookie  |
| GET    | `/api/auth/me`            | Bearer   | Get current user      |
| PUT    | `/api/auth/profile`       | Bearer   | Update profile        |
| PUT    | `/api/auth/change-password`| Bearer  | Change password       |
| POST   | `/api/auth/forgot-password`| —       | Send reset email      |
| POST   | `/api/auth/reset-password` | —       | Reset with token      |
| POST   | `/api/auth/avatar`        | Bearer   | Upload avatar         |

### Content
| Method | Endpoint                  | Auth     | Description           |
|--------|---------------------------|----------|-----------------------|
| GET    | `/api/content`            | Optional | List + filter content |
| GET    | `/api/content/trending`   | Optional | Trending items        |
| GET    | `/api/content/breaking`   | Optional | Breaking news         |
| GET    | `/api/content/:slug`      | Optional | Single item + related |
| POST   | `/api/content`            | Editor+  | Create content        |
| PUT    | `/api/content/:id`        | Editor+  | Update content        |
| DELETE | `/api/content/:id`        | Editor+  | Delete content        |
| POST   | `/api/content/:id/like`   | User     | Toggle like           |
| POST   | `/api/content/:id/save`   | User     | Toggle save           |
| POST   | `/api/content/:id/media`  | Editor+  | Upload media file     |

### Other
| Method | Endpoint                  | Auth     | Description           |
|--------|---------------------------|----------|-----------------------|
| GET    | `/api/feed`               | Optional | Personalized feed     |
| GET    | `/api/search?q=`          | Optional | Full-text search      |
| POST   | `/api/behavior`           | User     | Log interaction event |
| GET    | `/api/subscribe/plans`    | —        | Pricing plans         |
| POST   | `/api/subscribe/checkout` | User     | Stripe checkout URL   |
| POST   | `/api/subscribe/webhook`  | Stripe   | Stripe webhook        |
| GET    | `/api/admin/analytics`    | Admin    | Platform stats        |
| GET    | `/api/admin/users`        | Admin    | User management       |

---

## Recommendation Engine

The feed scoring formula:

```
finalScore = (interestScore × 0.40)
           + (trendingScore × 0.25)
           + (freshnessScore × 0.20)
           + (qualityScore × 0.15)
```

- **interestScore** — built from user's behavior history (category affinity, 0–1)
- **trendingScore** — `(views + likes×3) / (ageHours + 2)^1.8`, recomputed every 30 min
- **freshnessScore** — `1 / (hours_since_published + 1)`, decays naturally
- **qualityScore** — average completion rate across all users (0–1)

Cold start: new users see editorial "Best Of" picks + their onboarding interests.

---

## Subscription Plans

| Plan       | Price   | Features                                          |
|------------|---------|---------------------------------------------------|
| Free       | $0/mo   | 5 premium articles, ads, 480p video               |
| Premium    | $9/mo   | Unlimited, ad-free, 1080p HD, all podcasts, live  |
| Enterprise | $29/mo  | Everything + 5 seats, publishing, API access      |

Payments via Stripe. Webhooks handle activation/cancellation automatically.

---

## Testing

```bash
# Backend API tests
cd backend && npm test

# Frontend (if you add Cypress)
cd frontend && npx cypress run
```

---

## Performance Tips

- **Lazy loading**: All pages are `React.lazy()` — only the current page loads
- **Infinite scroll**: `IntersectionObserver`-based, no scroll event listeners
- **Image optimization**: Cloudinary auto-serves WebP/AVIF with `fetch_format: auto`
- **Skeleton loaders**: Shimmer placeholders prevent layout shift
- **Render cold start**: Ping your backend every 14 min via GitHub Actions scheduled job to avoid 30-second wake-up delay on free tier

---

## Security Notes

- Passwords hashed with `bcrypt` (12 salt rounds)
- Access tokens in `sessionStorage` (cleared on tab close)
- Refresh tokens in `httpOnly` cookies (XSS-proof)
- All uploads go through server-signed Cloudinary URLs (API key never exposed)
- Stripe webhook signature verified before processing
- Rate limiting: 200 req/15min globally, 20 req/15min on auth routes
- `helmet.js` security headers on all responses
- Input validated with `Joi` before hitting DB

---

## Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m "feat: add my feature"`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request against `main`

---

## License

MIT — use freely, build something great.
