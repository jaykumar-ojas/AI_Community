const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Accept images, videos, audio, and documents
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/gif',
    'video/mp4', 'video/mpeg',
    'audio/mpeg', 'audio/wav',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files per upload
  }
});

// Middleware to process uploaded files
const processUpload = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next();
  }

  // Format file information
  req.uploadedFiles = req.files.map(file => ({
    fileName: file.filename,
    fileType: file.mimetype,
    fileUrl: `/uploads/${file.filename}`,
    fileSize: file.size
  }));

  next();
};

module.exports = {
  upload,
  processUpload
}; 