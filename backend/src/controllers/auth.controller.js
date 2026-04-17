const crypto = require('crypto')
const jwt    = require('jsonwebtoken')
const User   = require('../models/User.model')
const { signTokens, setRefreshCookie, clearRefreshCookie } = require('../middleware/auth.middleware')
const { sendEmail } = require('../services/email.service')

// ── Helper: send tokens response ──────────────────────────────────────────────
const sendTokens = (res, user, statusCode = 200) => {
  const { accessToken, refreshToken } = signTokens(user._id)
  setRefreshCookie(res, refreshToken)
  res.status(statusCode).json({ accessToken, user })
}

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, interests, language } = req.body

    const exists = await User.findOne({ email })
    if (exists) return res.status(409).json({ message: 'Email already registered' })

    const passwordHash = await User.hashPassword(password)
    const user = await User.create({ name, email, passwordHash, interests, language })

    sendTokens(res, user, 201)
  } catch (err) { next(err) }
}

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email }).select('+passwordHash')
    if (!user) return res.status(401).json({ message: 'Invalid email or password' })
    if (!user.passwordHash) return res.status(401).json({ message: 'Please sign in with Google' })

    const valid = await user.comparePassword(password)
    if (!valid) return res.status(401).json({ message: 'Invalid email or password' })
    if (!user.isActive) return res.status(403).json({ message: 'Account deactivated' })

    user.lastLoginAt = new Date()
    await user.save()

    sendTokens(res, user)
  } catch (err) { next(err) }
}

// POST /api/auth/google
exports.googleLogin = async (req, res, next) => {
  try {
    const { token } = req.body
    // Verify Google ID token
    const { OAuth2Client } = require('google-auth-library')
    const client  = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
    const ticket  = await client.verifyIdToken({ idToken: token })
    const payload = ticket.getPayload()

    let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email: payload.email }] })
    if (!user) {
      user = await User.create({
        name:       payload.name,
        email:      payload.email,
        googleId:   payload.sub,
        avatar:     payload.picture,
        isVerified: payload.email_verified
      })
    } else if (!user.googleId) {
      user.googleId = payload.sub
      if (!user.avatar) user.avatar = payload.picture
      await user.save()
    }

    sendTokens(res, user)
  } catch (err) { next(err) }
}

// POST /api/auth/refresh
exports.refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken
    if (!token) return res.status(401).json({ message: 'No refresh token' })

    let payload
    try {
      payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
    } catch {
      return res.status(401).json({ message: 'Invalid or expired refresh token' })
    }

    const user = await User.findById(payload.id)
    if (!user || !user.isActive) return res.status(401).json({ message: 'User not found' })

    const { accessToken, refreshToken } = signTokens(user._id)
    setRefreshCookie(res, refreshToken)
    res.json({ accessToken })
  } catch (err) { next(err) }
}

// POST /api/auth/logout
exports.logout = (req, res) => {
  clearRefreshCookie(res)
  res.json({ message: 'Logged out' })
}

// GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
    res.json({ user })
  } catch (err) { next(err) }
}

// PUT /api/auth/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'bio', 'website', 'language', 'location', 'interests', 'notifPreferences']
    const updates = {}
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f] })

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
    res.json({ user })
  } catch (err) { next(err) }
}

// PUT /api/auth/change-password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await User.findById(req.user._id).select('+passwordHash')
    if (!user.passwordHash) return res.status(400).json({ message: 'No password set (OAuth account)' })

    const valid = await user.comparePassword(currentPassword)
    if (!valid) return res.status(401).json({ message: 'Current password is incorrect' })

    user.passwordHash = await User.hashPassword(newPassword)
    await user.save()
    res.json({ message: 'Password updated' })
  } catch (err) { next(err) }
}

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ email })
    // Always return success (don't reveal if email exists)
    if (!user) return res.json({ message: 'If that email exists, a reset link was sent.' })

    const token   = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000)  // 1 hour

    await User.findByIdAndUpdate(user._id, {
      resetToken:       token,
      resetTokenExpiry: expires
    })

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`
    await sendEmail({
      to:      user.email,
      subject: 'Disk Media — Reset your password',
      html:    `<p>Hi ${user.name},</p><p>Click below to reset your password (expires in 1 hour):</p><a href="${resetUrl}">${resetUrl}</a>`
    })

    res.json({ message: 'If that email exists, a reset link was sent.' })
  } catch (err) { next(err) }
}

// POST /api/auth/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body
    const user = await User.findOne({
      resetToken:       token,
      resetTokenExpiry: { $gt: new Date() }
    }).select('+resetToken +resetTokenExpiry')

    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' })

    user.passwordHash     = await User.hashPassword(password)
    user.resetToken       = undefined
    user.resetTokenExpiry = undefined
    await user.save()

    sendTokens(res, user)
  } catch (err) { next(err) }
}

// POST /api/auth/avatar  (multipart)
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: req.file.path },
      { new: true }
    )
    res.json({ user, avatarUrl: req.file.path })
  } catch (err) { next(err) }
}
