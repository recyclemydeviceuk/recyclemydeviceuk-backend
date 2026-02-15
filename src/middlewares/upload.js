// File upload middleware with Multer
const multer = require('multer');
const path = require('path');
const { UPLOAD_LIMITS, HTTP_STATUS } = require('../config/constants');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Organize uploads by type
    let uploadPath = 'uploads/';
    
    if (file.fieldname === 'profileImage') {
      uploadPath += 'profiles/';
    } else if (file.fieldname === 'deviceImages') {
      uploadPath += 'devices/';
    } else if (file.fieldname === 'documents') {
      uploadPath += 'documents/';
    } else if (file.fieldname === 'certificates') {
      uploadPath += 'certificates/';
    } else {
      uploadPath += 'misc/';
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  },
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = [
    ...UPLOAD_LIMITS.ALLOWED_IMAGE_TYPES,
    ...UPLOAD_LIMITS.ALLOWED_DOCUMENT_TYPES,
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, PDF, and DOC files are allowed.'), false);
  }
};

// Image-only filter
const imageFilter = (req, file, cb) => {
  if (UPLOAD_LIMITS.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only image files (JPEG, PNG, WebP) are allowed.'), false);
  }
};

// Document-only filter
const documentFilter = (req, file, cb) => {
  if (UPLOAD_LIMITS.ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and DOC files are allowed.'), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: UPLOAD_LIMITS.MAX_FILE_SIZE,
    files: UPLOAD_LIMITS.MAX_FILES_PER_UPLOAD,
  },
  fileFilter: fileFilter,
});

// Image upload configuration
const imageUpload = multer({
  storage: storage,
  limits: {
    fileSize: UPLOAD_LIMITS.MAX_FILE_SIZE,
    files: UPLOAD_LIMITS.MAX_FILES_PER_UPLOAD,
  },
  fileFilter: imageFilter,
});

// Document upload configuration
const documentUpload = multer({
  storage: storage,
  limits: {
    fileSize: UPLOAD_LIMITS.MAX_FILE_SIZE * 2, // Allow larger documents (10MB)
    files: 5,
  },
  fileFilter: documentFilter,
});

// Error handler for multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `File too large. Maximum size is ${UPLOAD_LIMITS.MAX_FILE_SIZE / (1024 * 1024)}MB`,
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Too many files. Maximum is ${UPLOAD_LIMITS.MAX_FILES_PER_UPLOAD} files`,
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Unexpected file field',
      });
    }
  }
  
  if (err) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: err.message || 'File upload error',
    });
  }
  
  next();
};

// Specific upload configurations
const uploadSingle = (fieldName) => upload.single(fieldName);
const uploadMultiple = (fieldName, maxCount = 5) => upload.array(fieldName, maxCount);
const uploadFields = (fields) => upload.fields(fields);

// Profile image upload (single image)
const uploadProfileImage = imageUpload.single('profileImage');

// Device images upload (multiple images)
const uploadDeviceImages = imageUpload.array('deviceImages', 5);

// Document upload (single document)
const uploadDocument = documentUpload.single('document');

// Certificate upload (multiple documents)
const uploadCertificates = documentUpload.array('certificates', 3);

module.exports = {
  upload,
  imageUpload,
  documentUpload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  uploadProfileImage,
  uploadDeviceImages,
  uploadDocument,
  uploadCertificates,
  handleMulterError,
};
