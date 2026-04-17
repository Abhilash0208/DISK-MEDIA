const Content = require('../models/Content.model')
const User    = require('../models/User.model')

const PAGE_SIZE = 12

// GET /api/content  — list with filters + pagination
exports.getAll = async (req, res, next) => {
  try {
    const { type, category, status = 'published', tag, author, lang, page = 1, limit = PAGE_SIZE, sort = '-publishedAt' } = req.query

    const filter = { status }
    if (type)     filter.type     = type
    if (category) filter.category = category
    if (tag)      filter.tags     = tag
    if (author)   filter.author   = author
    if (lang)     filter.language = lang

    // Hide premium content body for free users
    const isPremium = req.user && ['premium','enterprise'].includes(req.user.plan)

    const [items, total] = await Promise.all([
      Content.find(filter)
        .sort(sort)
        .skip((page - 1) * PAGE_SIZE)
        .limit(Number(limit))
        .select(isPremium ? '' : '-body')
        .lean(),
      Content.countDocuments(filter)
    ])

    res.json({
      items,
      total,
      page:    Number(page),
      pages:   Math.ceil(total / PAGE_SIZE),
      hasMore: page * PAGE_SIZE < total
    })
  } catch (err) { next(err) }
}

// GET /api/content/trending
exports.getTrending = async (req, res, next) => {
  try {
    const { type, limit = 10 } = req.query
    const filter = { status: 'published' }
    if (type) filter.type = type

    const items = await Content.find(filter)
      .sort({ trendingScore: -1 })
      .limit(Number(limit))
      .lean()
    res.json({ items })
  } catch (err) { next(err) }
}

// GET /api/content/breaking
exports.getBreaking = async (req, res, next) => {
  try {
    const now = new Date()
    const items = await Content.find({
      status: 'breaking',
      $or: [{ breakingUntil: { $gt: now } }, { breakingUntil: null }]
    })
      .sort({ publishedAt: -1 })
      .limit(8)
      .lean()
    res.json({ items })
  } catch (err) { next(err) }
}

// GET /api/content/:slug
exports.getBySlug = async (req, res, next) => {
  try {
    const item = await Content.findOne({ slug: req.params.slug })
    if (!item) return res.status(404).json({ message: 'Content not found' })

    // Enforce premium gate — send body only for premium users or free content
    const isPremiumUser = req.user && ['premium','enterprise'].includes(req.user.plan)
    const canRead = !item.isPremium || isPremiumUser
    const safeItem = item.toObject()
    if (!canRead) {
      safeItem.body    = null
      safeItem.gated   = true
    }

    // Increment views (fire-and-forget)
    Content.findByIdAndUpdate(item._id, { $inc: { views: 1 } }).exec()

    // Related content
    const related = await Content.find({
      _id:      { $ne: item._id },
      category: item.category,
      status:   'published'
    }).sort({ trendingScore: -1 }).limit(5).lean()

    res.json({ item: safeItem, related })
  } catch (err) { next(err) }
}

// POST /api/content
exports.create = async (req, res, next) => {
  try {
    const slug = await Content.generateSlug(req.body.title)
    const item = await Content.create({
      ...req.body,
      slug,
      author:      req.user._id,
      publishedAt: req.body.status === 'published' ? new Date() : undefined
    })

    // If breaking, broadcast via Socket.io
    if (item.status === 'breaking') {
      req.app.get('io')?.emit('breaking:news', item)
    }

    res.status(201).json({ item })
  } catch (err) { next(err) }
}

// PUT /api/content/:id
exports.update = async (req, res, next) => {
  try {
    const item = await Content.findById(req.params.id)
    if (!item) return res.status(404).json({ message: 'Not found' })

    // Editors can only edit their own content; admins can edit all
    if (req.user.role !== 'admin' && !item.author.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    if (req.body.status === 'published' && item.status === 'draft') {
      req.body.publishedAt = new Date()
    }

    Object.assign(item, req.body)
    await item.save()

    if (item.status === 'breaking') {
      req.app.get('io')?.emit('breaking:news', item)
    }

    res.json({ item })
  } catch (err) { next(err) }
}

// DELETE /api/content/:id
exports.remove = async (req, res, next) => {
  try {
    const item = await Content.findById(req.params.id)
    if (!item) return res.status(404).json({ message: 'Not found' })

    if (req.user.role !== 'admin' && !item.author.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    // Delete media from Cloudinary
    const { deleteFile } = require('../config/cloudinary')
    if (item.thumbnailId)   await deleteFile(item.thumbnailId, 'image')
    if (item.mediaPublicId) await deleteFile(item.mediaPublicId, item.type === 'video' ? 'video' : 'raw')

    await item.deleteOne()
    res.json({ message: 'Deleted' })
  } catch (err) { next(err) }
}

// POST /api/content/:id/like
exports.toggleLike = async (req, res, next) => {
  try {
    const item = await Content.findById(req.params.id)
    if (!item) return res.status(404).json({ message: 'Not found' })

    const UserBehavior = require('../models/Behavior.model')
    const existing = await UserBehavior.findOne({
      userId: req.user._id, contentId: item._id, event: 'like'
    })

    let liked
    if (existing) {
      await existing.deleteOne()
      await Content.findByIdAndUpdate(item._id, { $inc: { likes: -1 } })
      liked = false
    } else {
      await UserBehavior.create({
        userId: req.user._id, contentId: item._id,
        category: item.category, type: item.type, event: 'like'
      })
      await Content.findByIdAndUpdate(item._id, { $inc: { likes: 1 } })
      liked = true
    }

    const updated = await Content.findById(item._id)
    res.json({ liked, likes: updated.likes })
  } catch (err) { next(err) }
}

// POST /api/content/:id/save
exports.toggleSave = async (req, res, next) => {
  try {
    const item = await Content.findById(req.params.id)
    if (!item) return res.status(404).json({ message: 'Not found' })

    const user = await User.findById(req.user._id)
    const alreadySaved = user.savedItems.some(id => id.equals(item._id))

    if (alreadySaved) {
      user.savedItems = user.savedItems.filter(id => !id.equals(item._id))
    } else {
      user.savedItems.push(item._id)
    }
    await user.save()

    res.json({ saved: !alreadySaved, totalSaved: user.savedItems.length })
  } catch (err) { next(err) }
}

// POST /api/content/:id/media  (Cloudinary upload)
exports.uploadMedia = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })
    const { id } = req.params
    const item = await Content.findById(id)
    if (!item) return res.status(404).json({ message: 'Not found' })

    const isThumb = req.query.type === 'thumbnail'
    if (isThumb) {
      item.thumbnailUrl = req.file.path
      item.thumbnailId  = req.file.filename
    } else {
      item.mediaUrl      = req.file.path
      item.mediaPublicId = req.file.filename
    }
    await item.save()
    res.json({ item, url: req.file.path })
  } catch (err) { next(err) }
}
