import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configure storage for post images
const postStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/posts'))
  },
  filename: (req, file, cb) => {
    // Keep original filename and add readable date for uniqueness
    // Format: "filename-MMDDYYYY-random.ext"
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const year = now.getFullYear()
    const dateStr = `${month}${day}${year}` // Example: 10152025
    const randomNum = Math.round(Math.random() * 1E9)
    const originalName = file.originalname
    const ext = path.extname(originalName)
    const nameWithoutExt = originalName.substring(0, originalName.length - ext.length)
    
    // Final format: "filename-10152025-random.ext"
    // This preserves readability while ensuring uniqueness
    const finalName = `${nameWithoutExt}-${dateStr}-${randomNum}${ext}`
    
    cb(null, finalName)
  }
})

// Configure storage for profile images (avatar/cover)
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/profiles'))
  },
  filename: (req, file, cb) => {
    // Format: "profile-MMDDYYYY-random.ext"
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const year = now.getFullYear()
    const dateStr = `${month}${day}${year}` // Example: 10152025
    const randomNum = Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    
    // Final format: "profile-10152025-random.ext"
    const finalName = `profile-${dateStr}-${randomNum}${ext}`
    
    cb(null, finalName)
  }
})

// File filter to accept images and documents
const postFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|doc|docx|pdf|ppt|pptx|xls|xlsx|txt|wav|mp3|mp4|mov/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  
  const allowedMimetypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/pdf',
    'application/vnd.ms-powerpoint', // .ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'text/plain', // .txt
    'audio/wav',
    'audio/mpeg', // .mp3
    'video/mp4',
    'video/quicktime' // .mov
  ]
  
  const mimetype = allowedMimetypes.includes(file.mimetype)

  if (mimetype && extname) {
    return cb(null, true)
  } else {
    cb(new Error('File type not supported. Allowed: images, documents (doc, docx, pdf, ppt, pptx, xls, xlsx, txt), audio (wav, mp3), video (mp4, mov)'))
  }
}

// File filter to accept only images (for profiles)
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = allowedTypes.test(file.mimetype)

  if (mimetype && extname) {
    return cb(null, true)
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed!'))
  }
}

// Create multer instances
export const postUpload = multer({
  storage: postStorage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for posts (to support videos and documents)
  },
  fileFilter: postFileFilter
})

export const profileUpload = multer({
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for profiles (avatar and cover)
  },
  fileFilter: imageFileFilter
})

// Legacy exports for backward compatibility
export const uploadPostImage = postUpload
export const uploadProfileImage = profileUpload
