const admin = require('firebase-admin')

let initialized = false

const initFirebase = () => {
  if (initialized || !process.env.FIREBASE_SERVICE_ACCOUNT) return
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
    initialized = true
    console.log('[Firebase] Admin SDK initialized')
  } catch (err) {
    console.warn('[Firebase] Init failed (notifications disabled):', err.message)
  }
}

const getMessaging = () => {
  if (!initialized) return null
  return admin.messaging()
}

module.exports = { initFirebase, getMessaging }
