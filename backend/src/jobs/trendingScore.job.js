const cron = require('node-cron')
const { recomputeTrendingScores, recomputeQualityScores } = require('../services/recommendation.service')

// Every 30 minutes — recompute trending scores
cron.schedule('*/30 * * * *', async () => {
  try {
    console.log('[Cron] Recomputing trending scores...')
    await recomputeTrendingScores()
  } catch (err) {
    console.error('[Cron] trendingScore failed:', err.message)
  }
})

// Every 6 hours — recompute quality scores
cron.schedule('0 */6 * * *', async () => {
  try {
    console.log('[Cron] Recomputing quality scores...')
    await recomputeQualityScores()
  } catch (err) {
    console.error('[Cron] qualityScore failed:', err.message)
  }
})

// Every day at midnight — expire breaking status
cron.schedule('0 0 * * *', async () => {
  try {
    const Content = require('../models/Content.model')
    const result  = await Content.updateMany(
      { status: 'breaking', breakingUntil: { $lt: new Date() } },
      { $set: { status: 'published' } }
    )
    if (result.modifiedCount > 0) {
      console.log(`[Cron] Expired ${result.modifiedCount} breaking items → published`)
    }
  } catch (err) {
    console.error('[Cron] breaking expiry failed:', err.message)
  }
})

console.log('[Cron] Jobs scheduled')
