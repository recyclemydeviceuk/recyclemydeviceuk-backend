// AWS S3 & SES configuration
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

// AWS SDK v3 configuration for SES
const awsConfig = {
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

// S3 Client Configuration (with separate credentials)
const s3 = new S3Client({
  region: process.env.AWS_S3_REGION || process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// SES Client Configuration
const ses = new SESClient(awsConfig);

// S3 Upload Options
const s3UploadOptions = {
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB default
  allowedImageTypes: process.env.ALLOWED_IMAGE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/webp'
  ],
};

// SES Email Configuration
const sesEmailConfig = {
  fromEmail: process.env.AWS_SES_FROM_EMAIL || 'noreply@recyclemydevice.com',
  verifiedEmail: process.env.AWS_SES_VERIFIED_EMAIL || 'admin@recyclemydevice.com',
  charset: 'UTF-8',
};

// Helper function to upload file to S3
const uploadToS3 = async (file, folder = 'uploads') => {
  const key = `${folder}/${Date.now()}-${file.originalname}`;
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read',
  };

  try {
    await s3.send(new PutObjectCommand(params));
    const url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_S3_REGION || process.env.AWS_REGION}.amazonaws.com/${key}`;
    return {
      success: true,
      url: url,
      key: key,
    };
  } catch (error) {
    console.error('S3 Upload Error:', error);
    throw new Error('Failed to upload file to S3');
  }
};

// Helper function to delete file from S3
const deleteFromS3 = async (key) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
  };

  try {
    await s3.send(new DeleteObjectCommand(params));
    return { success: true };
  } catch (error) {
    console.error('S3 Delete Error:', error);
    throw new Error('Failed to delete file from S3');
  }
};

// Helper function to send email via SES
const sendEmail = async ({ to, subject, htmlBody, textBody }) => {
  const params = {
    Source: sesEmailConfig.fromEmail,
    Destination: {
      ToAddresses: Array.isArray(to) ? to : [to],
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: sesEmailConfig.charset,
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: sesEmailConfig.charset,
        },
        Text: {
          Data: textBody || htmlBody.replace(/<[^>]*>/g, ''),
          Charset: sesEmailConfig.charset,
        },
      },
    },
  };

  try {
    const result = await ses.send(new SendEmailCommand(params));
    return {
      success: true,
      messageId: result.MessageId,
    };
  } catch (error) {
    console.error('SES Email Error:', error);
    throw new Error('Failed to send email via SES');
  }
};

module.exports = {
  s3,
  ses,
  s3UploadOptions,
  sesEmailConfig,
  uploadToS3,
  deleteFromS3,
  sendEmail,
};
