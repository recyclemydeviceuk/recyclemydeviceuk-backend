// URL slug generator utility

/**
 * Generate URL-friendly slug from text
 * @param {string} text - Text to slugify
 * @param {object} options - Slugify options
 * @returns {string} - Slugified text
 */
const slugify = (text, options = {}) => {
  const defaults = {
    lowercase: true,
    separator: '-',
    maxLength: 100,
    removeSpecialChars: true,
  };

  const config = { ...defaults, ...options };

  if (!text || typeof text !== 'string') {
    return '';
  }

  let slug = text.trim();

  // Convert to lowercase
  if (config.lowercase) {
    slug = slug.toLowerCase();
  }

  // Replace spaces with separator
  slug = slug.replace(/\s+/g, config.separator);

  // Remove special characters
  if (config.removeSpecialChars) {
    slug = slug.replace(/[^\w\-]+/g, '');
  }

  // Replace multiple separators with single separator
  const separatorRegex = new RegExp(`${config.separator}+`, 'g');
  slug = slug.replace(separatorRegex, config.separator);

  // Remove separator from start and end
  const trimRegex = new RegExp(`^${config.separator}+|${config.separator}+$`, 'g');
  slug = slug.replace(trimRegex, '');

  // Limit length
  if (config.maxLength && slug.length > config.maxLength) {
    slug = slug.substring(0, config.maxLength);
    // Remove trailing separator after truncation
    slug = slug.replace(new RegExp(`${config.separator}+$`), '');
  }

  return slug;
};

/**
 * Generate unique slug by appending number if slug exists
 * @param {string} baseSlug - Base slug
 * @param {Function} checkExists - Function to check if slug exists
 * @returns {Promise<string>} - Unique slug
 */
const generateUniqueSlug = async (baseSlug, checkExists) => {
  let slug = baseSlug;
  let counter = 1;

  while (await checkExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

/**
 * Create slug from title with date
 * @param {string} title - Title text
 * @param {Date} date - Date object (optional)
 * @returns {string} - Slug with date
 */
const slugifyWithDate = (title, date = new Date()) => {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const titleSlug = slugify(title);
  return `${dateStr}-${titleSlug}`;
};

/**
 * Create slug from multiple parts
 * @param {Array<string>} parts - Array of parts to join
 * @param {string} separator - Separator (default: '-')
 * @returns {string} - Combined slug
 */
const combineSlugParts = (parts, separator = '-') => {
  return parts
    .map((part) => slugify(part, { separator }))
    .filter(Boolean)
    .join(separator);
};

/**
 * Extract text from slug
 * @param {string} slug - Slug to decode
 * @param {string} separator - Separator used in slug (default: '-')
 * @returns {string} - Decoded text
 */
const unslugify = (slug, separator = '-') => {
  if (!slug) return '';
  
  return slug
    .split(separator)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Generate slug for blog post with category
 * @param {string} category - Category name
 * @param {string} title - Post title
 * @returns {string} - Categorized slug
 */
const categorizedSlug = (category, title) => {
  const categorySlug = slugify(category);
  const titleSlug = slugify(title);
  return `${categorySlug}/${titleSlug}`;
};

/**
 * Sanitize filename for storage
 * @param {string} filename - Original filename
 * @param {string} separator - Separator (default: '-')
 * @returns {string} - Sanitized filename
 */
const sanitizeFilename = (filename, separator = '-') => {
  const parts = filename.split('.');
  const extension = parts.pop();
  const name = parts.join('.');
  
  const sanitizedName = slugify(name, { separator });
  return `${sanitizedName}.${extension.toLowerCase()}`;
};

/**
 * Generate SEO-friendly URL path
 * @param {string} text - Text to convert
 * @param {object} options - Additional options
 * @returns {string} - SEO-friendly path
 */
const generateSEOPath = (text, options = {}) => {
  const slug = slugify(text, {
    lowercase: true,
    separator: '-',
    maxLength: 60, // SEO best practice
    removeSpecialChars: true,
    ...options,
  });

  return slug;
};

/**
 * Create slug with random suffix for uniqueness
 * @param {string} text - Text to slugify
 * @param {number} suffixLength - Length of random suffix (default: 6)
 * @returns {string} - Slug with random suffix
 */
const slugifyWithRandomSuffix = (text, suffixLength = 6) => {
  const baseSlug = slugify(text);
  const randomSuffix = Math.random()
    .toString(36)
    .substring(2, 2 + suffixLength);
  return `${baseSlug}-${randomSuffix}`;
};

module.exports = {
  slugify,
  generateUniqueSlug,
  slugifyWithDate,
  combineSlugParts,
  unslugify,
  categorizedSlug,
  sanitizeFilename,
  generateSEOPath,
  slugifyWithRandomSuffix,
};
