const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const kycController = require('../controllers/kycController');

// Ensure uploads directory exists with full path logging
const uploadsDir = path.join(__dirname, '../uploads/kyc');
console.log('📁 KYC Uploads Directory:', uploadsDir);

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created KYC uploads directory');
} else {
  console.log('✅ KYC uploads directory exists');
}

// Test write permissions
try {
  const testFile = path.join(uploadsDir, '.test-write');
  fs.writeFileSync(testFile, 'test');
  fs.unlinkSync(testFile);
  console.log('✅ Uploads directory is writable');
} catch (err) {
  console.error('❌ Uploads directory is NOT writable:', err.message);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure directory exists before each upload
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    const fieldName = file.fieldname;
    cb(null, `${fieldName}-${req.user.id.substring(0, 8)}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif'];
  
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    console.error('❌ Invalid file type:', file.mimetype, ext);
    cb(new Error(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 2 // Max 2 files (id_image + selfie_image)
  },
  fileFilter
});

// Multer error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('❌ Multer Error:', err.code, err.message);
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: 'File too large. Maximum size is 10MB per file.',
        code: err.code 
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        message: 'Too many files. Please upload exactly one ID image and one selfie.',
        code: err.code 
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        message: `Unexpected field: ${err.field}. Expected 'id_image' and 'selfie_image'.`,
        code: err.code 
      });
    }
    
    return res.status(400).json({ 
      message: `Upload error: ${err.message}`,
      code: err.code 
    });
  } else if (err) {
    console.error('❌ File Filter Error:', err.message);
    return res.status(400).json({ message: err.message });
  }
  next();
};

// Routes
router.get('/', protect, kycController.getKYCStatus);

router.post('/', 
  protect, 
  (req, res, next) => {
    console.log('📸 KYC Upload Request Received');
    console.log('   User ID:', req.user?.id);
    console.log('   Content-Type:', req.headers['content-type']);
    next();
  },
  upload.fields([
    { name: 'id_image', maxCount: 1 },
    { name: 'selfie_image', maxCount: 1 }
  ]), 
  handleMulterError,
  kycController.submitKYC
);

module.exports = router;
