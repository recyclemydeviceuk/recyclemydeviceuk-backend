// Custom validation functions

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (international format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 */
const isValidPhone = (phone) => {
  // Accepts formats: +1234567890, 1234567890, (123) 456-7890, etc.
  const phoneRegex = /^[\d\s\+\-\(\)]+$/;
  const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
  return phoneRegex.test(phone) && cleanedPhone.length >= 10 && cleanedPhone.length <= 15;
};

/**
 * Validate UK postcode
 * @param {string} postcode - Postcode to validate
 * @returns {boolean} - True if valid
 */
const isValidPostcode = (postcode) => {
  const postcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
  return postcodeRegex.test(postcode);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - Validation result with details
 */
const validatePasswordStrength = (password) => {
  const result = {
    isValid: true,
    errors: [],
    strength: 'weak',
  };

  if (!password || password.length < 8) {
    result.isValid = false;
    result.errors.push('Password must be at least 8 characters long');
  }

  if (!/[a-z]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    result.errors.push('Password should contain at least one special character (recommended)');
  }

  // Calculate strength
  if (result.isValid) {
    let strengthScore = 0;
    if (password.length >= 12) strengthScore++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strengthScore++;
    if (password.length >= 16) strengthScore++;

    if (strengthScore >= 2) {
      result.strength = 'strong';
    } else if (strengthScore === 1) {
      result.strength = 'medium';
    }
  }

  return result;
};

/**
 * Validate MongoDB ObjectId
 * @param {string} id - ID to validate
 * @returns {boolean} - True if valid
 */
const isValidObjectId = (id) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid
 */
const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} date - Date string to validate
 * @returns {boolean} - True if valid
 */
const isValidDateFormat = (date) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;

  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
};

/**
 * Validate date range
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {boolean} - True if valid range
 */
const isValidDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return !isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end;
};

/**
 * Validate price/amount (positive number with max 2 decimal places)
 * @param {number} amount - Amount to validate
 * @returns {boolean} - True if valid
 */
const isValidPrice = (amount) => {
  if (typeof amount !== 'number' || amount < 0) return false;
  const decimalPlaces = (amount.toString().split('.')[1] || '').length;
  return decimalPlaces <= 2;
};

/**
 * Validate credit card number (Luhn algorithm)
 * @param {string} cardNumber - Card number to validate
 * @returns {boolean} - True if valid
 */
const isValidCreditCard = (cardNumber) => {
  const cleanedNumber = cardNumber.replace(/\s+/g, '');
  if (!/^\d{13,19}$/.test(cleanedNumber)) return false;

  let sum = 0;
  let isEven = false;

  for (let i = cleanedNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanedNumber[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

/**
 * Validate file extension
 * @param {string} filename - Filename to validate
 * @param {Array<string>} allowedExtensions - Allowed extensions
 * @returns {boolean} - True if valid
 */
const isValidFileExtension = (filename, allowedExtensions) => {
  const extension = filename.split('.').pop().toLowerCase();
  return allowedExtensions.includes(extension);
};

/**
 * Validate image file type
 * @param {string} mimetype - File mimetype
 * @returns {boolean} - True if valid image
 */
const isValidImageType = (mimetype) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(mimetype);
};

/**
 * Validate JSON string
 * @param {string} str - String to validate
 * @returns {boolean} - True if valid JSON
 */
const isValidJSON = (str) => {
  try {
    JSON.parse(str);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Validate username (alphanumeric, underscore, hyphen)
 * @param {string} username - Username to validate
 * @returns {boolean} - True if valid
 */
const isValidUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
};

/**
 * Validate hexadecimal color code
 * @param {string} color - Color code to validate
 * @returns {boolean} - True if valid
 */
const isValidHexColor = (color) => {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
};

/**
 * Validate age (must be at least minAge years old)
 * @param {string|Date} birthdate - Date of birth
 * @param {number} minAge - Minimum age required (default: 18)
 * @returns {boolean} - True if valid age
 */
const isValidAge = (birthdate, minAge = 18) => {
  const birth = new Date(birthdate);
  if (isNaN(birth.getTime())) return false;

  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1 >= minAge;
  }

  return age >= minAge;
};

/**
 * Sanitize HTML to prevent XSS
 * @param {string} html - HTML string to sanitize
 * @returns {string} - Sanitized HTML
 */
const sanitizeHTML = (html) => {
  if (!html) return '';
  
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate array contains only unique values
 * @param {Array} array - Array to validate
 * @returns {boolean} - True if all values are unique
 */
const hasUniqueValues = (array) => {
  return new Set(array).size === array.length;
};

/**
 * Validate coordinates (latitude and longitude)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} - True if valid coordinates
 */
const isValidCoordinates = (lat, lng) => {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

module.exports = {
  isValidEmail,
  isValidPhone,
  isValidPostcode,
  validatePasswordStrength,
  isValidObjectId,
  isValidURL,
  isValidDateFormat,
  isValidDateRange,
  isValidPrice,
  isValidCreditCard,
  isValidFileExtension,
  isValidImageType,
  isValidJSON,
  isValidUsername,
  isValidHexColor,
  isValidAge,
  sanitizeHTML,
  hasUniqueValues,
  isValidCoordinates,
};
