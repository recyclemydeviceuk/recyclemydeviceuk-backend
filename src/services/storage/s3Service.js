// AWS S3 storage service
const { s3 } = require('../../config/aws');
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const logger = require('../../utils/logger');
const path = require('path');

/**
 * Upload file to S3
 * @param {object} file - File object (from multer)
 * @param {string} folder - S3 folder path
 * @returns {Promise<object>} - Upload result
 */
const uploadFile = async (file, folder = 'uploads') => {
  try {
    const fileExtension = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
    const key = `${folder}/${fileName}`;

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      // ACL removed - bucket uses bucket policy for public access
    };

    await s3.send(new PutObjectCommand(params));

    // Construct the public URL
    const region = process.env.AWS_S3_REGION || process.env.AWS_REGION || 'ap-south-1';
    const url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;

    logger.info('File uploaded to S3', {
      key: key,
      size: file.size,
      mimetype: file.mimetype,
    });

    return {
      success: true,
      url: url,
      key: key,
      bucket: process.env.AWS_S3_BUCKET_NAME,
      size: file.size,
      mimetype: file.mimetype,
    };
  } catch (error) {
    logger.logError(error, { context: 'S3 uploadFile' });
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

/**
 * Upload multiple files to S3
 * @param {Array} files - Array of file objects
 * @param {string} folder - S3 folder path
 * @returns {Promise<Array>} - Upload results
 */
const uploadMultipleFiles = async (files, folder = 'uploads') => {
  try {
    const uploadPromises = files.map(file => uploadFile(file, folder));
    const results = await Promise.all(uploadPromises);

    logger.info('Multiple files uploaded to S3', {
      count: results.length,
      folder,
    });

    return {
      success: true,
      files: results,
    };
  } catch (error) {
    logger.logError(error, { context: 'S3 uploadMultipleFiles' });
    throw new Error(`Failed to upload files: ${error.message}`);
  }
};

/**
 * Delete file from S3
 * @param {string} key - S3 object key
 * @returns {Promise<object>} - Delete result
 */
const deleteFile = async (key) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
    };

    await s3.send(new DeleteObjectCommand(params));

    logger.info('File deleted from S3', { key });

    return {
      success: true,
      message: 'File deleted successfully',
    };
  } catch (error) {
    logger.logError(error, { context: 'S3 deleteFile', key });
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

/**
 * Delete multiple files from S3
 * @param {Array} keys - Array of S3 object keys
 * @returns {Promise<object>} - Delete result
 */
const deleteMultipleFiles = async (keys) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Delete: {
        Objects: keys.map(key => ({ Key: key })),
        Quiet: false,
      },
    };

    const result = await s3.deleteObjects(params).promise();

    logger.info('Multiple files deleted from S3', {
      count: result.Deleted.length,
    });

    return {
      success: true,
      deleted: result.Deleted,
      errors: result.Errors || [],
    };
  } catch (error) {
    logger.logError(error, { context: 'S3 deleteMultipleFiles' });
    throw new Error(`Failed to delete files: ${error.message}`);
  }
};

/**
 * Get file from S3
 * @param {string} key - S3 object key
 * @returns {Promise<object>} - File data
 */
const getFile = async (key) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
    };

    const result = await s3.getObject(params).promise();

    return {
      success: true,
      data: result.Body,
      contentType: result.ContentType,
      size: result.ContentLength,
    };
  } catch (error) {
    logger.logError(error, { context: 'S3 getFile', key });
    throw new Error(`Failed to get file: ${error.message}`);
  }
};

/**
 * Get signed URL for private file access
 * @param {string} key - S3 object key
 * @param {number} expiresIn - URL expiration in seconds (default: 1 hour)
 * @returns {Promise<string>} - Signed URL
 */
const getSignedUrl = async (key, expiresIn = 3600) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      Expires: expiresIn,
    };

    const url = await s3.getSignedUrlPromise('getObject', params);

    logger.info('Signed URL generated', { key, expiresIn });

    return {
      success: true,
      url,
      expiresIn,
    };
  } catch (error) {
    logger.logError(error, { context: 'S3 getSignedUrl', key });
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
};

/**
 * Check if file exists in S3
 * @param {string} key - S3 object key
 * @returns {Promise<boolean>} - File exists status
 */
const fileExists = async (key) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
    };

    await s3.headObject(params).promise();
    return true;
  } catch (error) {
    if (error.code === 'NotFound') {
      return false;
    }
    throw error;
  }
};

/**
 * List files in S3 folder
 * @param {string} folder - S3 folder path
 * @param {number} maxKeys - Maximum number of keys to return
 * @returns {Promise<object>} - List result
 */
const listFiles = async (folder = '', maxKeys = 1000) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Prefix: folder,
      MaxKeys: maxKeys,
    };

    const result = await s3.listObjectsV2(params).promise();

    return {
      success: true,
      files: result.Contents.map(item => ({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified,
        etag: item.ETag,
      })),
      count: result.KeyCount,
      isTruncated: result.IsTruncated,
    };
  } catch (error) {
    logger.logError(error, { context: 'S3 listFiles', folder });
    throw new Error(`Failed to list files: ${error.message}`);
  }
};

/**
 * Copy file within S3
 * @param {string} sourceKey - Source S3 object key
 * @param {string} destinationKey - Destination S3 object key
 * @returns {Promise<object>} - Copy result
 */
const copyFile = async (sourceKey, destinationKey) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      CopySource: `${process.env.AWS_S3_BUCKET_NAME}/${sourceKey}`,
      Key: destinationKey,
    };

    const result = await s3.copyObject(params).promise();

    logger.info('File copied in S3', {
      source: sourceKey,
      destination: destinationKey,
    });

    return {
      success: true,
      copyResult: result,
    };
  } catch (error) {
    logger.logError(error, { context: 'S3 copyFile' });
    throw new Error(`Failed to copy file: ${error.message}`);
  }
};

/**
 * Get file metadata
 * @param {string} key - S3 object key
 * @returns {Promise<object>} - File metadata
 */
const getFileMetadata = async (key) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
    };

    const result = await s3.headObject(params).promise();

    return {
      success: true,
      metadata: {
        contentType: result.ContentType,
        contentLength: result.ContentLength,
        lastModified: result.LastModified,
        etag: result.ETag,
        metadata: result.Metadata,
      },
    };
  } catch (error) {
    logger.logError(error, { context: 'S3 getFileMetadata', key });
    throw new Error(`Failed to get file metadata: ${error.message}`);
  }
};

module.exports = {
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
  deleteMultipleFiles,
  getFile,
  getSignedUrl,
  fileExists,
  listFiles,
  copyFile,
  getFileMetadata,
};
