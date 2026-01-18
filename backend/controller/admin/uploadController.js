import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

/**
 * @desc    Generate presigned URL for S3 upload
 * @route   POST /api/v1/upload-url
 * @access  Private (Authenticated users)
 */
export const generateUploadUrl = async (req, res) => {
  try {
    const { fileName, fileType, folder } = req.body;

    // Validate required fields
    if (!fileName || !fileType || !folder) {
      return res.status(400).json({
        success: false,
        message: "fileName, fileType, and folder are required",
      });
    }

    // Validate file type
    if (!fileType.startsWith("image/")) {
      return res.status(400).json({
        success: false,
        message: "Only image files are allowed",
      });
    }

    // Get bucket name from environment variable
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    if (!bucketName) {
      return res.status(500).json({
        success: false,
        message: "AWS S3 bucket name is not configured",
      });
    }

    // Generate unique key with timestamp to avoid conflicts
    const key = `${folder}/${Date.now()}-${fileName}`;

    // Create PutObject command
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: fileType,
    });

    // Generate presigned URL (expires in 60 seconds)
    const uploadUrl = await getSignedUrl(s3, command, {
      expiresIn: 60, // 1 minute
    });

    // Generate file URL (CDN URL or S3 URL)
    const cdnUrl =
      process.env.AWS_S3_CDN_URL ||
      `https://${bucketName}.s3.${process.env.AWS_REGION || "ap-south-1"}.amazonaws.com`;
    const fileUrl = `${cdnUrl}/${key}`;

    res.json({
      success: true,
      uploadUrl,
      fileUrl,
    });
  } catch (error) {
    console.error("Error generating upload URL:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate upload URL",
      error: error.message,
    });
  }
};
