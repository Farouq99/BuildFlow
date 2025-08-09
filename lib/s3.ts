import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand,
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.S3_BUCKET) {
  throw new Error('AWS credentials and S3 bucket must be configured');
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const S3_BUCKET = process.env.S3_BUCKET!;

// Generate a unique S3 key for uploaded files
export function generateS3Key(projectId: string, filename: string, userId: string): string {
  const timestamp = Date.now();
  const hash = crypto.randomBytes(8).toString('hex');
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `projects/${projectId}/documents/${timestamp}-${hash}-${sanitizedFilename}`;
}

// Upload file to S3
export async function uploadFileToS3(
  key: string, 
  buffer: Buffer, 
  contentType: string,
  metadata?: Record<string, string>
): Promise<string> {
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      Metadata: metadata,
    },
  });

  await upload.done();
  return `https://${S3_BUCKET}.s3.amazonaws.com/${key}`;
}

// Get presigned URL for direct upload
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

// Get presigned URL for download
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

// Delete file from S3
export async function deleteFileFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  await s3Client.send(command);
}

// Multipart upload for large files
export class MultipartUploadManager {
  private uploadId: string | undefined;
  private parts: Array<{ ETag: string; PartNumber: number }> = [];

  constructor(
    private key: string,
    private contentType: string
  ) {}

  async initiate(): Promise<string> {
    const command = new CreateMultipartUploadCommand({
      Bucket: S3_BUCKET,
      Key: this.key,
      ContentType: this.contentType,
    });

    const result = await s3Client.send(command);
    this.uploadId = result.UploadId!;
    return this.uploadId;
  }

  async uploadPart(partNumber: number, body: Buffer): Promise<string> {
    if (!this.uploadId) {
      throw new Error('Multipart upload not initiated');
    }

    const command = new UploadPartCommand({
      Bucket: S3_BUCKET,
      Key: this.key,
      PartNumber: partNumber,
      UploadId: this.uploadId,
      Body: body,
    });

    const result = await s3Client.send(command);
    const etag = result.ETag!;
    
    this.parts.push({ ETag: etag, PartNumber: partNumber });
    return etag;
  }

  async complete(): Promise<string> {
    if (!this.uploadId) {
      throw new Error('Multipart upload not initiated');
    }

    // Sort parts by part number
    this.parts.sort((a, b) => a.PartNumber - b.PartNumber);

    const command = new CompleteMultipartUploadCommand({
      Bucket: S3_BUCKET,
      Key: this.key,
      UploadId: this.uploadId,
      MultipartUpload: {
        Parts: this.parts,
      },
    });

    const result = await s3Client.send(command);
    return result.Location!;
  }

  async abort(): Promise<void> {
    if (!this.uploadId) {
      throw new Error('Multipart upload not initiated');
    }

    const command = new AbortMultipartUploadCommand({
      Bucket: S3_BUCKET,
      Key: this.key,
      UploadId: this.uploadId,
    });

    await s3Client.send(command);
  }
}

// Generate thumbnail for images
export function generateThumbnailKey(originalKey: string): string {
  const parts = originalKey.split('/');
  const filename = parts.pop()!;
  const path = parts.join('/');
  return `${path}/thumbnails/thumb_${filename}`;
}

// CAD preview URL generation (for Autodesk Forge integration)
export function generateCADPreviewUrl(s3Key: string, forgeViewerToken?: string): string | null {
  if (!forgeViewerToken || !process.env.FORGE_CLIENT_ID) {
    return null;
  }
  
  // Generate Forge viewer URL - this would integrate with Autodesk Forge API
  const encodedUrn = Buffer.from(s3Key).toString('base64').replace(/=/g, '');
  return `https://developer.api.autodesk.com/modelderivative/v2/viewers/urn:${encodedUrn}`;
}

export { s3Client };