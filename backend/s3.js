require("dotenv").config();
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const REGION = process.env.AWS_REGION || "us-east-2";
const BUCKET = process.env.S3_BUCKET_NAME;

if (!BUCKET) {
  console.warn(
    "WARNING: S3_BUCKET_NAME is not set in .env — S3 uploads will fail.",
  );
}

const s3 = new S3Client({ region: REGION });

const uploadToS3 = async (buffer, key, contentType) => {
  if (!key) throw new Error("uploadToS3 called with no key");
  if (!BUCKET) throw new Error("S3_BUCKET_NAME is not set in .env");
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );
  return key;
};

const deleteFromS3 = async (key) => {
  if (!key) return;
  if (!BUCKET) throw new Error("S3_BUCKET_NAME is not set in .env");
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (err) {
    console.error("deleteFromS3 failed for key:", key, err);
  }
};

const getSignedPhotoUrl = async (key) => {
  if (!key) return null;
  if (!BUCKET) throw new Error("S3_BUCKET_NAME is not set in .env");
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), {
    expiresIn: 3600,
  });
};

module.exports = { uploadToS3, deleteFromS3, getSignedPhotoUrl };
