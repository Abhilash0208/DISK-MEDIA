const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type:    { type: String, enum: ['breaking', 'live', 'reply', 'like', 'follow', 'system'], required: true },
  title:   { type: String, required: true },
  body:    { type: String },
  link:    { type: String },
  isRead:  { type: Boolean, default: false, index: true },
  meta:    { type: mongoose.Schema.Types.Mixed }  // extra data (contentId, actorId, etc.)
}, {
  timestamps: true
})

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 })

module.exports = mongoose.model('Notification', notificationSchema)
