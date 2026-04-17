const mongoose = require('mongoose')

let isConnected = false

const connectDB = async () => {
  if (isConnected) return

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'diskmedia'
    })
    isConnected = true
    console.log(`[MongoDB] Connected: ${conn.connection.host}`)

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Disconnected — attempting reconnect...')
      isConnected = false
    })
    mongoose.connection.on('reconnected', () => {
      console.log('[MongoDB] Reconnected')
      isConnected = true
    })
  } catch (err) {
    console.error('[MongoDB] Connection failed:', err.message)
    process.exit(1)
  }
}

module.exports = connectDB
