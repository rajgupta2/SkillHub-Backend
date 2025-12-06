import multer from "multer";

// Store files in memory (for S3, Cloudinary, etc.)
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB limit
});
