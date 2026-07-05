import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import crypto from 'crypto';

// Cloudflare R2 (S3-compatible). Required env vars:
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL
export function isStorageConfigured() {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET &&
    process.env.R2_PUBLIC_URL
  );
}

let _client;
function client() {
  if (!_client) {
    _client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return _client;
}

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 80;

// Re-encodes the image (strips EXIF/GPS metadata), resizes to max 1600px,
// uploads to R2, returns the public URL. Throws on invalid/corrupt images.
export async function uploadImage(buffer, { folder = 'listings' } = {}) {
  // sharp.rotate() bakes in EXIF orientation before metadata is stripped
  const processed = await sharp(buffer)
    .rotate()
    .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer();

  const key = `${folder}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.jpg`;

  await client().send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    Body: processed,
    ContentType: 'image/jpeg',
    CacheControl: 'public, max-age=31536000, immutable',
  }));

  return `${process.env.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
}

// Converts a base64 data URL (legacy storage format) to an R2 URL.
export async function migrateDataUrl(dataUrl, opts) {
  const match = dataUrl.match(/^data:image\/[a-z+]+;base64,(.+)$/i);
  if (!match) throw new Error('Not a base64 image data URL');
  return uploadImage(Buffer.from(match[1], 'base64'), opts);
}
