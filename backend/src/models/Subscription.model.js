const mongoose = require('mongoose')

const subscriptionSchema = new mongoose.Schema({
  userId:             { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  stripeCustomerId:   { type: String, required: true },
  stripeSubId:        { type: String, required: true, unique: true },
  plan:               { type: String, enum: ['premium', 'enterprise'], required: true },
  status:             { type: String, enum: ['active', 'canceled', 'past_due', 'incomplete', 'trialing'], default: 'active' },
  currentPeriodStart: { type: Date },
  currentPeriodEnd:   { type: Date },
  cancelAtPeriodEnd:  { type: Boolean, default: false },
  canceledAt:         { type: Date }
}, {
  timestamps: true
})

subscriptionSchema.index({ userId: 1 })
subscriptionSchema.index({ stripeSubId: 1 })
subscriptionSchema.index({ status: 1 })

module.exports = mongoose.model('Subscription', subscriptionSchema)
