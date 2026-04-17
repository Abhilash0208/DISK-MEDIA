const jwt  = require('jsonwebtoken')
const User = require('../models/User.model')

// ── Verify access token from Authorization header ──────────────────────────────
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authenticated' })
    }
    const token = header.split(' ')[1]
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
    const user = await User.findById(payload.id).select('+isActive')
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or deactivated' })
    }
    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' })
    }
    return res.status(401).json({ message: 'Invalid token' })
  }
}

// ── Optional auth (attaches user if token present, doesn't fail) ──────────────
const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) return next()
    const token = header.split(' ')[1]
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
    const user = await User.findById(payload.id)
    if (user) req.user = user
  } catch (_) {}
  next()
}

// ── Token factory ─────────────────────────────────────────────────────────────
const signTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  )
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
  )
  return { accessToken, refreshToken }
}

// ── Send refresh token as httpOnly cookie ─────────────────────────────────────
const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   7 * 24 * 60 * 60 * 1000   // 7 days
  })
}

const clearRefreshCookie = (res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  })
}

module.exports = { protect, optionalAuth, signTokens, setRefreshCookie, clearRefreshCookie }
