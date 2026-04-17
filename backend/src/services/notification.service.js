const Notification = require('../models/Notification.model')
const User         = require('../models/User.model')
const { getMessaging } = require('../config/firebase')

/**
 * Create a DB notification + optionally send FCM push
 */
exports.notify = async ({ userId, type, title, body, link, meta, sendPush = true }) => {
  // 1. Persist to DB
  const notif = await Notification.create({ userId, type, title, body, link, meta })

  // 2. Send FCM push if user has a token
  if (sendPush) {
    const user      = await User.findById(userId).select('fcmToken notifPreferences')
    const messaging = getMessaging()

    const prefMap = { breaking: 'breaking', live: 'live' }
    const prefKey = prefMap[type]
    const allowed = !prefKey || user?.notifPreferences?.[prefKey] !== false

    if (messaging && user?.fcmToken && allowed) {
      try {
        await messaging.send({
          token:        user.fcmToken,
          notification: { title, body: body || '' },
          webpush:      link ? { fcmOptions: { link } } : undefined
        })
      } catch (err) {
        // Token invalid — clear it
        if (err.code === 'messaging/registration-token-not-registered') {
          await User.findByIdAndUpdate(userId, { $unset: { fcmToken: 1 } })
        }
        console.warn('[FCM] Push failed:', err.message)
      }
    }
  }

  return notif
}

/**
 * Broadcast a breaking news push to all users who opted in
 */
exports.broadcastBreaking = async (contentItem) => {
  const messaging = getMessaging()
  if (!messaging) return

  try {
    // Send to 'breaking' topic (users subscribe client-side)
    await messaging.send({
      topic: 'breaking',
      notification: {
        title: '🔴 Breaking News',
        body:  contentItem.title
      },
      webpush: {
        fcmOptions: { link: `/content/${contentItem.slug}` }
      }
    })
  } catch (err) {
    console.warn('[FCM] Broadcast failed:', err.message)
  }
}

/**
 * Register FCM token for a user
 */
exports.registerToken = async (userId, token) => {
  await User.findByIdAndUpdate(userId, { fcmToken: token })
}
