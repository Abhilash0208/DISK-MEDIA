// Usage: router.delete('/:id', protect, requireRole('admin'), handler)
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' })
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Access denied. Required role: ${roles.join(' or ')}`
    })
  }
  next()
}

// Require active premium/enterprise plan
const requirePremium = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' })
  if (!['premium', 'enterprise'].includes(req.user.plan)) {
    return res.status(403).json({
      message: 'Premium subscription required',
      upgrade: true
    })
  }
  next()
}

module.exports = { requireRole, requirePremium }
