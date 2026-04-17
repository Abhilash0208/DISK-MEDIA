const mongoose = require('mongoose')

const behaviorSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true },
  category:  { type: String },    // denormalized for fast aggregation
  type:      { type: String },    // content type: article|video|podcast
  event: {
    type: String,
    enum: ['view', 'read', 'listen', 'watch', 'skip', 'save', 'share', 'like', 'unlike', 'unsave'],
    required: true
  },
  // How long they engaged (seconds)
  duration:       { type: Number, default: 0 },
  // 0.0–1.0: how much of the content was consumed
  completionRate: { type: Number, default: 0, min: 0, max: 1 }
}, {
  timestamps: true
})

// ── Indexes ────────────────────────────────────────────────────────────────────
behaviorSchema.index({ userId: 1, contentId: 1 })
behaviorSchema.index({ userId: 1, createdAt: -1 })
behaviorSchema.index({ contentId: 1, event: 1 })

// ── Event → interest weight mapping ───────────────────────────────────────────
const EVENT_WEIGHTS = {
  view:     1,
  read:     3,
  listen:   3,
  watch:    3,
  save:     5,
  like:     5,
  share:    7,
  skip:    -2,
  unlike:  -3,
  unsave:  -3
}
behaviorSchema.statics.EVENT_WEIGHTS = EVENT_WEIGHTS

// ── Build interest vector for a user ──────────────────────────────────────────
// Returns: { Technology: 42, Sports: 18, ... }
behaviorSchema.statics.buildInterestVector = async function (userId) {
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days

  const rows = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), createdAt: { $gte: cutoff } } },
    {
      $addFields: {
        weight: {
          $switch: {
            branches: Object.entries(EVENT_WEIGHTS).map(([k, v]) => ({
              case: { $eq: ['$event', k] }, then: v
            })),
            default: 0
          }
        },
        completionBonus: { $multiply: ['$completionRate', 3] }
      }
    },
    { $group: { _id: '$category', score: { $sum: { $add: ['$weight', '$completionBonus'] } } } },
    { $sort: { score: -1 } }
  ])

  const vector = {}
  let total = 0
  rows.forEach(r => { if (r._id) { vector[r._id] = Math.max(r.score, 0); total += vector[r._id] } })

  // Normalize 0–100
  if (total > 0) {
    Object.keys(vector).forEach(k => { vector[k] = Math.round((vector[k] / total) * 100) })
  }
  return vector
}

module.exports = mongoose.model('UserBehavior', behaviorSchema)
