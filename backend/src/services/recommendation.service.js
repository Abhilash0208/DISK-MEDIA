const Content      = require('../models/Content.model')
const UserBehavior = require('../models/Behavior.model')
const mongoose     = require('mongoose')

const PAGE_SIZE = 12

/**
 * Build a personalized feed for a user using a hybrid scoring approach:
 *   finalScore = (interestScore × 0.40) + (trendingScore × 0.25)
 *              + (freshnessScore × 0.20) + (qualityScore × 0.15)
 */
exports.getPersonalizedFeed = async (userId, page = 1) => {
  // 1. Get the user's interest vector (category → weight 0–100)
  const interestVector = userId
    ? await UserBehavior.buildInterestVector(userId)
    : {}

  const hasInterests = Object.keys(interestVector).length > 0

  // 2. Fetch candidate pool (last 30 days, published)
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const candidates = await Content.find({
    status:      'published',
    publishedAt: { $gte: cutoff }
  })
    .select('_id type category title slug thumbnailUrl author publishedAt trendingScore qualityScore views likes isPremium duration')
    .lean()

  // 3. Get IDs already seen by user (last 7 days) to de-duplicate
  let seenIds = new Set()
  if (userId) {
    const seen = await UserBehavior.find({
      userId:    new mongoose.Types.ObjectId(userId),
      event:     { $in: ['view', 'read', 'watch', 'listen'] },
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).select('contentId').lean()
    seenIds = new Set(seen.map(s => s.contentId.toString()))
  }

  // 4. Score each candidate
  const now = Date.now()
  const scored = candidates
    .filter(c => !seenIds.has(c._id.toString()))
    .map(c => {
      const ageHours = (now - new Date(c.publishedAt).getTime()) / 3_600_000

      const interestScore  = hasInterests
        ? (interestVector[c.category] || 0) / 100   // 0–1
        : 0.5                                         // cold start: neutral

      const trendingScore  = Math.min(c.trendingScore / 100, 1)   // normalise
      const freshnessScore = 1 / (ageHours + 1)                    // decay
      const qualityScore   = Math.min(c.qualityScore / 100, 1)

      const finalScore =
        interestScore  * 0.40 +
        trendingScore  * 0.25 +
        freshnessScore * 0.20 +
        qualityScore   * 0.15

      return { ...c, _score: finalScore }
    })

  // 5. Sort descending, paginate
  scored.sort((a, b) => b._score - a._score)

  const start = (page - 1) * PAGE_SIZE
  const items = scored.slice(start, start + PAGE_SIZE)

  return {
    items,
    page:    Number(page),
    hasMore: scored.length > start + PAGE_SIZE,
    total:   scored.length
  }
}

/**
 * Recompute trendingScore for all published content.
 * Called by the cron job every 30 minutes.
 * Formula: (views×1 + likes×3 + shares×5) / (ageHours + 2) ^ 1.8
 */
exports.recomputeTrendingScores = async () => {
  const now  = Date.now()
  const docs  = await Content.find({ status: { $in: ['published', 'breaking'] } })
    .select('_id views likes publishedAt')
    .lean()

  const bulkOps = docs.map(doc => {
    const ageHours = (now - new Date(doc.publishedAt).getTime()) / 3_600_000
    const raw      = (doc.views * 1) + (doc.likes * 3)
    const score    = Math.round(raw / Math.pow(ageHours + 2, 1.8))
    return {
      updateOne: { filter: { _id: doc._id }, update: { $set: { trendingScore: Math.max(score, 0) } } }
    }
  })

  if (bulkOps.length) await Content.bulkWrite(bulkOps)
  console.log(`[Recommendation] Recomputed trending scores for ${bulkOps.length} items`)
}

/**
 * Recompute qualityScore for content based on avg completion rate.
 */
exports.recomputeQualityScores = async () => {
  const rows = await UserBehavior.aggregate([
    { $match: { completionRate: { $gt: 0 } } },
    { $group: { _id: '$contentId', avgCompletion: { $avg: '$completionRate' } } }
  ])

  const bulkOps = rows.map(r => ({
    updateOne: {
      filter: { _id: r._id },
      update: { $set: { qualityScore: Math.round(r.avgCompletion * 100) } }
    }
  }))

  if (bulkOps.length) await Content.bulkWrite(bulkOps)
}
