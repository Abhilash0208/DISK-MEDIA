const mongoose = require('mongoose')

const contentSchema = new mongoose.Schema({
  // Core
  type:   { type: String, enum: ['article', 'video', 'podcast', 'live'], required: true },
  title:  { type: String, required: true, trim: true, maxlength: 200 },
  slug:   { type: String, required: true, unique: true, lowercase: true },

  // Author & taxonomy
  author:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category:  { type: String, required: true },
  tags:      { type: [String], default: [] },

  // Publishing
  status:    { type: String, enum: ['draft', 'published', 'breaking', 'archived'], default: 'draft' },
  isPremium: { type: Boolean, default: false },
  language:  { type: String, default: 'en' },

  // Content body (article HTML, podcast description, video description)
  body:    { type: String },
  excerpt: { type: String, maxlength: 300 },

  // Media
  thumbnailUrl:  { type: String },
  thumbnailId:   { type: String },  // Cloudinary public_id for deletion
  mediaUrl:      { type: String },  // Video/audio Cloudinary URL
  mediaPublicId: { type: String },
  duration:      { type: Number },  // seconds

  // Live stream specific
  streamUrl:    { type: String },
  streamStatus: { type: String, enum: ['scheduled', 'live', 'ended'], default: 'scheduled' },
  scheduledAt:  { type: Date },

  // Engagement
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },

  // Recommendation engine fields
  trendingScore:  { type: Number, default: 0, index: true },
  qualityScore:   { type: Number, default: 0 },  // avg completion rate × 100

  // SEO
  metaTitle:       { type: String },
  metaDescription: { type: String },

  publishedAt: { type: Date },
  breakingUntil: { type: Date }   // auto-expire breaking status
}, {
  timestamps: true,
  toJSON: { virtuals: true, transform: (_, obj) => { delete obj.__v; return obj } }
})

// ── Indexes ────────────────────────────────────────────────────────────────────
contentSchema.index({ status: 1, publishedAt: -1 })
contentSchema.index({ type: 1, status: 1 })
contentSchema.index({ category: 1, status: 1 })
contentSchema.index({ tags: 1 })
contentSchema.index({ trendingScore: -1 })
contentSchema.index({ author: 1 })
contentSchema.index({ slug: 1 }, { unique: true })

// ── Auto-populate author on find ──────────────────────────────────────────────
contentSchema.pre(/^find/, function () {
  this.populate('author', 'name avatar')
})

// ── Auto-expire breaking status ───────────────────────────────────────────────
contentSchema.pre('save', function () {
  if (this.status === 'breaking' && !this.breakingUntil) {
    this.breakingUntil = new Date(Date.now() + 4 * 60 * 60 * 1000)  // 4 hours
  }
})

// ── Static: generate unique slug ─────────────────────────────────────────────
contentSchema.statics.generateSlug = async function (title) {
  const base = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .slice(0, 80)

  let slug = base
  let count = 0
  while (await this.exists({ slug })) {
    count++
    slug = `${base}-${count}`
  }
  return slug
}

module.exports = mongoose.model('Content', contentSchema)
