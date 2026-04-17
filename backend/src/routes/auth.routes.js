// ═══════════════════════════════════════════════════════════════════════════════
// auth.routes.js
// ═══════════════════════════════════════════════════════════════════════════════
const express     = require('express')
const router      = express.Router()
const ctrl        = require('../controllers/auth.controller')
const { protect } = require('../middleware/auth.middleware')
const { validate, schemas } = require('../middleware/validate.middleware')
const { uploadAvatar } = require('../config/cloudinary')

router.post('/register',         validate(schemas.register),         ctrl.register)
router.post('/login',            validate(schemas.login),            ctrl.login)
router.post('/google',                                               ctrl.googleLogin)
router.post('/refresh',                                              ctrl.refresh)
router.post('/logout',                                               ctrl.logout)
router.post('/forgot-password',  validate(schemas.forgotPassword),   ctrl.forgotPassword)
router.post('/reset-password',   validate(schemas.resetPassword),    ctrl.resetPassword)
router.get('/me',                protect,                            ctrl.getMe)
router.put('/profile',           protect, validate(schemas.updateProfile), ctrl.updateProfile)
router.put('/change-password',   protect,                            ctrl.changePassword)
router.post('/avatar',           protect, uploadAvatar.single('avatar'), ctrl.uploadAvatar)

module.exports = router
