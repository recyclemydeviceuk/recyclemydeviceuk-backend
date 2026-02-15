// File validation service
const { UPLOAD_LIMITS } = require('../../config/constants');
const logger = require('../../utils/logger');

/**
 * Validate file type
 * @param {object} file - File object
 * @param {Array} allowedTypes - Allowed MIME types
 * @returns {object} - Validation result
 */
const validateFileType = (file, allowedTypes = null) => {
  const types = allowedTypes || [
    ...UPLOAD_LIMITS.ALLOWED_IMAGE_TYPES,
    ...UPLOAD_LIMITS.ALLOWED_DOCUMENT_TYPES,
  ];

  if (!types.includes(file.mimetype)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${types.join(', ')}`,
    };
  }

  return { valid: true };
};

/**
 * Validate file size
 * @param {object} file - File object
 * @param {number} maxSize - Maximum file size in bytes
 * @returns {object} - Validation result
 */
const validateFileSize = (file, maxSize = null) => {
  const limit = maxSize || UPLOAD_LIMITS.MAX_FILE_SIZE;

  if (file.size > limit) {
    const limitMB = (limit / (1024 * 1024)).toFixed(2);
    const fileMB = (file.size / (1024 * 1024)).toFixed(2);
    
    return {
      valid: false,
      error: `File too large. Maximum size: ${limitMB}MB, received: ${fileMB}MB`,
    };
  }

  return { valid: true };
};

/**
 * Validate image file
 * @param {object} file - File object
 * @returns {object} - Validation result
 */
const validateImage = (file) => {
  const typeValidation = validateFileType(file, UPLOAD_LIMITS.ALLOWED_IMAGE_TYPES);
  if (!typeValidation.valid) {
    return typeValidation;
  }

  const sizeValidation = validateFileSize(file);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  return { valid: true };
};

/**
 * Validate document file
 * @param {object} file - File object
 * @returns {object} - Validation result
 */
const validateDocument = (file) => {
  const typeValidation = validateFileType(file, UPLOAD_LIMITS.ALLOWED_DOCUMENT_TYPES);
  if (!typeValidation.valid) {
    return typeValidation;
  }

  // Allow larger size for documents (10MB)
  const sizeValidation = validateFileSize(file, UPLOAD_LIMITS.MAX_FILE_SIZE * 2);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  return { valid: true };
};

/**
 * Validate multiple files
 * @param {Array} files - Array of file objects
 * @param {object} options - Validation options
 * @returns {object} - Validation result
 */
const validateMultipleFiles = (files, options = {}) => {
  const { maxFiles = UPLOAD_LIMITS.MAX_FILES_PER_UPLOAD, fileType = 'any' } = options;

  // Check file count
  if (files.length > maxFiles) {
    return {
      valid: false,
      error: `Too many files. Maximum: ${maxFiles}, received: ${files.length}`,
    };
  }

  // Validate each file
  const errors = [];
  files.forEach((file, index) => {
    let validation;

    if (fileType === 'image') {
      validation = validateImage(file);
    } else if (fileType === 'document') {
      validation = validateDocument(file);
    } else {
      const typeValidation = validateFileType(file);
      const sizeValidation = validateFileSize(file);
      validation = !typeValidation.valid ? typeValidation : sizeValidation;
    }

    if (!validation.valid) {
      errors.push({
        file: file.originalname,
        index,
        error: validation.error,
      });
    }
  });

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
    };
  }

  return { valid: true };
};

/**
 * Check file extension
 * @param {string} filename - File name
 * @param {Array} allowedExtensions - Allowed extensions
 * @returns {object} - Validation result
 */
const validateFileExtension = (filename, allowedExtensions) => {
  const extension = filename.split('.').pop().toLowerCase();

  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed: ${allowedExtensions.join(', ')}`,
    };
  }

  return { valid: true };
};

/**
 * Sanitize filename
 * @param {string} filename - Original filename
 * @returns {string} - Sanitized filename
 */
const sanitizeFilename = (filename) => {
  // Remove special characters and spaces
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '-')
    .replace(/--+/g, '-')
    .toLowerCase();
};

/**
 * Get file info
 * @param {object} file - File object
 * @returns {object} - File information
 */
const getFileInfo = (file) => {
  const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
  const extension = file.originalname.split('.').pop().toLowerCase();

  return {
    originalName: file.originalname,
    sanitizedName: sanitizeFilename(file.originalname),
    mimetype: file.mimetype,
    size: file.size,
    sizeInMB,
    extension,
    isImage: UPLOAD_LIMITS.ALLOWED_IMAGE_TYPES.includes(file.mimetype),
    isDocument: UPLOAD_LIMITS.ALLOWED_DOCUMENT_TYPES.includes(file.mimetype),
  };
};

/**
 * Validate and sanitize file
 * @param {object} file - File object
 * @param {object} options - Validation options
 * @returns {object} - Validation and sanitization result
 */
const validateAndSanitizeFile = (file, options = {}) => {
  const { fileType = 'any', maxSize = null, allowedTypes = null } = options;

  // Validate based on file type
  let validation;
  if (fileType === 'image') {
    validation = validateImage(file);
  } else if (fileType === 'document') {
    validation = validateDocument(file);
  } else {
    const typeValidation = validateFileType(file, allowedTypes);
    if (!typeValidation.valid) {
      validation = typeValidation;
    } else {
      validation = validateFileSize(file, maxSize);
    }
  }

  if (!validation.valid) {
    logger.warn('File validation failed', {
      filename: file.originalname,
      error: validation.error,
    });
    return validation;
  }

  // Get file info
  const fileInfo = getFileInfo(file);

  logger.info('File validated successfully', {
    filename: fileInfo.sanitizedName,
    size: fileInfo.sizeInMB + 'MB',
  });

  return {
    valid: true,
    fileInfo,
  };
};

/**
 * Check if file is malicious (basic check)
 * @param {object} file - File object
 * @returns {object} - Security check result
 */
const securityCheck = (file) => {
  const dangerousExtensions = ['exe', 'bat', 'cmd', 'sh', 'ps1', 'vbs', 'jar'];
  const extension = file.originalname.split('.').pop().toLowerCase();

  if (dangerousExtensions.includes(extension)) {
    return {
      safe: false,
      reason: 'Potentially dangerous file type',
    };
  }

  // Check for double extensions (e.g., file.pdf.exe)
  const parts = file.originalname.split('.');
  if (parts.length > 2) {
    const secondExt = parts[parts.length - 2].toLowerCase();
    if (dangerousExtensions.includes(secondExt)) {
      return {
        safe: false,
        reason: 'Suspicious double extension detected',
      };
    }
  }

  return { safe: true };
};

module.exports = {
  validateFileType,
  validateFileSize,
  validateImage,
  validateDocument,
  validateMultipleFiles,
  validateFileExtension,
  sanitizeFilename,
  getFileInfo,
  validateAndSanitizeFile,
  securityCheck,
};
