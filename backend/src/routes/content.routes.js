const express  = require('express')
const router   = express.Router()
const ctrl     = require('../controllers/content.controller')
const { protect, optionalAuth } = require('../middleware/auth.middleware')
const { requireRole } = require('../middleware/role.middleware')
const { validate, schemas } = require('../middleware/validate.middleware')
const { uploadImage, uploadVideo, uploadAudio } = require('../config/cloudinary')

// Public / optional auth
router.get('/trending',  optionalAuth, ctrl.getTrending)
router.get('/breaking',  optionalAuth, ctrl.getBreaking)
router.get('/',          optionalAuth, ctrl.getAll)
router.get('/:slug',     optionalAuth, ctrl.getBySlug)

// Protected: editors & admins
router.post('/',
  protect,
  requireRole('editor', 'admin'),
  validate(schemas.createContent),
  ctrl.create
)
router.put('/:id',
  protect,
  requireRole('editor', 'admin'),
  validate(schemas.updateContent),
  ctrl.update
)
router.delete('/:id',
  protect,
  requireRole('editor', 'admin'),
  ctrl.remove
)

// Media uploads
router.post('/:id/media',
  protect,
  requireRole('editor', 'admin'),
  (req, res, next) => {
    const { mediaType } = req.query
    if (mediaType === 'video')     uploadVideo.single('media')(req, res, next)
    else if (mediaType === 'audio') uploadAudio.single('media')(req, res, next)
    else                           uploadImage.single('media')(req, res, next)
  },
  ctrl.uploadMedia
)

// Interactions (authenticated users)
router.post('/:id/like', protect, ctrl.toggleLike)
router.post('/:id/save', protect, ctrl.toggleSave)

module.exports = router
