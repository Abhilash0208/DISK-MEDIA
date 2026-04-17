const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name:   { type: String, required: true, trim: true, maxlength: 80 },
  email:  { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, select: false },  // null for OAuth users

  // Role & access
  role:   { type: String, enum: ['user', 'editor', 'admin'], default: 'user' },
  plan:   { type: String, enum: ['free', 'premium', 'enterprise'], default: 'free' },

  // Profile
  avatar:    { type: String },
  bio:       { type: String, maxlength: 300 },
  website:   { type: String },
  language:  { type: String, default: 'en' },
  location:  { type: String },

  // Personalization
  interests:   { type: [String], default: [] },
  following:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  savedItems:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content' }],

  // Monetization
  stripeCustomerId:     { type: String },
  stripeSubscriptionId: { type: String },

  // Notifications
  fcmToken:             { type: String },
  notifPreferences: {
    breaking: { type: Boolean, default: true },
    live:     { type: Boolean, default: true },
    weekly:   { type: Boolean, default: true }
  },

  // Auth
  googleId:        { type: String },
  resetToken:      { type: String, select: false },
  resetTokenExpiry:{ type: Date,   select: false },
  isVerified:      { type: Boolean, default: false },
  lastLoginAt:     { type: Date },
  isActive:        { type: Boolean, default: true }
}, {
  timestamps: true,
  toJSON: {
    transform: (_, obj) => {
      delete obj.passwordHash
      delete obj.resetToken
      delete obj.resetTokenExpiry
      delete obj.__v
      return obj
    }
  }
})

// ── Indexes ────────────────────────────────────────────────────────────────────
userSchema.index({ email: 1 })
userSchema.index({ googleId: 1 }, { sparse: true })
userSchema.index({ stripeCustomerId: 1 }, { sparse: true })

// ── Password helpers ───────────────────────────────────────────────────────────
userSchema.statics.hashPassword = async (plain) =>
  bcrypt.hash(plain, 12)

userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash)
}

// ── Interest vector shorthand ─────────────────────────────────────────────────
userSchema.methods.hasInterest = function (category) {
  return this.interests.includes(category)
}

module.exports = mongoose.model('User', userSchema)
