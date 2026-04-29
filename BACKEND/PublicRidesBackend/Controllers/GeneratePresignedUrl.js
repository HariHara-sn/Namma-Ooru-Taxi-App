const Minio = require('minio');

let s3 = null;
// Initialize Minio client only if all required environment variables are present
if (
  process.env.E2E_BASE &&
  process.env.E2E_ACCESS_KEY &&
  process.env.E2E_SECRET_KEY &&
  process.env.E2E_BUCKET_NAME
) {
  let endPoint = process.env.E2E_BASE;
  let useSSL = true;
  if (endPoint.startsWith('http://')) {
      useSSL = false;
      endPoint = endPoint.replace('http://', '');
  } else if (endPoint.startsWith('https://')) {
      endPoint = endPoint.replace('https://', '');
  }

  s3 = new Minio.Client({
    endPoint: endPoint,
    useSSL: useSSL,
    accessKey: process.env.E2E_ACCESS_KEY,
    secretKey: process.env.E2E_SECRET_KEY,
  });
} else {
  console.warn('Minio client not initialized: missing E2E_* environment variables');
}

class GeneratePresignedUrl {
  async generatePresignedURL(req, res) {
    const bucket = process.env.E2E_BUCKET_NAME;
    const objectName = req.query.objectName;
    if (!s3) {
      return res.status(500).json({ success: false, message: 'Minio configuration missing' });
    }
    try {
      const url = await s3.presignedGetObject(bucket, objectName, 60 * 60); // 1 hour
      res.json({ success: true, url });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async generatePresignedImg(objectName) {
    const bucket = process.env.E2E_BUCKET_NAME;
    if (!s3) return null;
    try {
      const url = await s3.presignedGetObject(bucket, objectName, 60 * 60); // 1 hour
      return url;
    } catch (err) {
      return null;
    }
  }
}

module.exports = GeneratePresignedUrl;