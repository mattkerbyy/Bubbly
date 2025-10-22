import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const postStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../../uploads/posts"));
  },
  filename: (req, file, cb) => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const year = now.getFullYear();
    const dateStr = `${month}${day}${year}`;
    const randomNum = Math.round(Math.random() * 1e9);
    const originalName = file.originalname;
    const ext = path.extname(originalName);
    const nameWithoutExt = originalName.substring(
      0,
      originalName.length - ext.length
    );
    const finalName = `${nameWithoutExt}-${dateStr}-${randomNum}${ext}`;

    cb(null, finalName);
  },
});

const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../../uploads/profiles"));
  },
  filename: (req, file, cb) => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const year = now.getFullYear();
    const dateStr = `${month}${day}${year}`;
    const randomNum = Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const finalName = `profile-${dateStr}-${randomNum}${ext}`;

    cb(null, finalName);
  },
});

const postFileFilter = (req, file, cb) => {
  const allowedTypes =
    /jpeg|jpg|png|gif|webp|doc|docx|pdf|ppt|pptx|xls|xlsx|txt|wav|mp3|mp4|mov/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );

  const allowedMimetypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/pdf",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "audio/wav",
    "audio/mpeg",
    "video/mp4",
    "video/quicktime",
  ];

  const mimetype = allowedMimetypes.includes(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(
      new Error(
        "File type not supported. Allowed: images, documents (doc, docx, pdf, ppt, pptx, xls, xlsx, txt), audio (wav, mp3), video (mp4, mov)"
      )
    );
  }
};

const imageFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files (jpeg, jpg, png, gif, webp) are allowed!"));
  }
};

export const postUpload = multer({
  storage: postStorage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: postFileFilter,
});

export const profileUpload = multer({
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: imageFileFilter,
});

export const uploadPostImage = postUpload;
export const uploadProfileImage = profileUpload;
