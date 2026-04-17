require('dotenv').config()
const express    = require('express')
const http       = require('http')
const { Server } = require('socket.io')
const helmet     = require('helmet')
const cors       = require('cors')
const rateLimit  = require('express-rate-limit')
const connectDB  = require('./config/db')
const { initFirebase } = require('./config/firebase')
require('./jobs/trendingScore.job')  // start cron

const app    = express()
const server = http.createServer(app)

// ── Socket.io ─────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }
})
app.set('io', io)
io.on('connection', socket => {
  console.log('[Socket] client connected:', socket.id)
  socket.on('disconnect', () => console.log('[Socket] disconnected:', socket.id))
})

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:3000'],
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Cookie parser (manual, no dependency)
app.use((req, _, next) => {
  const raw = req.headers.cookie || ''
  req.cookies = Object.fromEntries(
    raw.split(';').filter(Boolean).map(c => c.trim().split('=').map(decodeURIComponent))
  )
  next()
})

// Global rate limiter
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 min
  max: 200,
  message: { message: 'Too many requests, please try again later.' }
})
)

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many auth attempts, please try again in 15 minutes.' }
})

// ── Routes ─────────────────────────────────────────────────────────────────────
const authRoutes         = require('./routes/auth.routes')
const contentRoutes      = require('./routes/content.routes')
const feedRoutes         = require('./routes/feed.routes')
const searchRoutes       = require('./routes/search.routes')
const subscribeRoutes    = require('./routes/subscribe.routes')
const behaviorRoutes     = require('./routes/behavior.routes')
const notifRoutes        = require('./routes/notification.routes')
const adminRoutes        = require('./routes/admin.routes')

app.use('/api/auth',          authLimiter, authRoutes)
app.use('/api/content',       contentRoutes)
app.use('/api/feed',          feedRoutes)
app.use('/api/search',        searchRoutes)
app.use('/api/subscribe',     subscribeRoutes)
app.use('/api/behavior',      behaviorRoutes)
app.use('/api/notifications', notifRoutes)
app.use('/api/admin',         adminRoutes)

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', ts: Date.now() }))

// 404
app.use((_, res) => res.status(404).json({ message: 'Route not found' }))

// Global error handler
app.use((err, req, res, _) => {
  console.error('[Error]', err.message)
  const status = err.status || err.statusCode || 500
  res.status(status).json({ message: err.message || 'Internal server error' })
})

// ── Boot ───────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000

;(async () => {
  await connectDB()
  initFirebase()
  server.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT} (${process.env.NODE_ENV})`)
  })
})()

module.exports = { app, io }
