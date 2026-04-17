const cloudinary = require('cloudinary').v2
const multer     = require('multer')
const { CloudinaryStorage } = require('multer-storage-cloudinary')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// ── Storage presets ────────────────────────────────────────────────────────────
const makeStorage = (folder, resourceType = 'auto', transforms = []) =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder:        `diskmedia/${folder}`,
      resource_type: resourceType,
      transformation: transforms,
      allowed_formats: resourceType === 'image'
        ? ['jpg', 'jpeg', 'png', 'webp', 'avif']
        : resourceType === 'video'
          ? ['mp4', 'webm', 'mov']
          : ['mp3', 'wav', 'm4a', 'ogg']
    }
  })

// Thumbnail / avatar image uploads — auto-compressed
const imageStorage = makeStorage('images', 'image', [
  { width: 1200, height: 675, crop: 'fill', quality: 'auto', fetch_format: 'auto' }
])

// Avatar — square, small
const avatarStorage = makeStorage('avatars', 'image', [
  { width: 300, height: 300, crop: 'fill', gravity: 'face', quality: 'auto' }
])

// Video uploads
const videoStorage = makeStorage('videos', 'video')

// Audio uploads
const audioStorage = makeStorage('audio', 'raw')

// ── Multer instances ───────────────────────────────────────────────────────────
const fileSizeLimits = {
  image: 8  * 1024 * 1024,   //  8 MB
  avatar: 4 * 1024 * 1024,   //  4 MB
  video: 500 * 1024 * 1024,  // 500 MB
  audio: 200 * 1024 * 1024   // 200 MB
}

exports.uploadImage  = multer({ storage: imageStorage,  limits: { fileSize: fileSizeLimits.image  } })
exports.uploadAvatar = multer({ storage: avatarStorage, limits: { fileSize: fileSizeLimits.avatar } })
exports.uploadVideo  = multer({ storage: videoStorage,  limits: { fileSize: fileSizeLimits.video  } })
exports.uploadAudio  = multer({ storage: audioStorage,  limits: { fileSize: fileSizeLimits.audio  } })

// ── Delete from Cloudinary ────────────────────────────────────────────────────
exports.deleteFile = async (publicId, resourceType = 'image') => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
  } catch (err) {
    console.warn('[Cloudinary] Delete failed:', err.message)
  }
}

exports.cloudinary = cloudinary
