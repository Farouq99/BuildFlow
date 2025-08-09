import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { db } from './db';
import { documents, auditLogs } from './schema';
import { eq } from 'drizzle-orm';
import { generateThumbnailKey, s3Client, S3_BUCKET } from './s3';
import { scanFileForVirus } from './antivirus';
import { generateThumbnail } from './image-processing';
import { logAuditEvent } from './auth';

// Redis connection
const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
});

// Job types
export interface VirusScanJobData {
  documentId: string;
  s3Key: string;
  userId: string;
}

export interface ThumbnailJobData {
  documentId: string;
  s3Key: string;
  contentType: string;
}

export interface CADProcessingJobData {
  documentId: string;
  s3Key: string;
  fileType: string;
  userId: string;
}

export interface AuditLogJobData {
  userId: string | null;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

// Queue definitions
export const virusScanQueue = new Queue<VirusScanJobData>('virus-scan', { 
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export const thumbnailQueue = new Queue<ThumbnailJobData>('thumbnail-generation', { 
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

export const cadProcessingQueue = new Queue<CADProcessingJobData>('cad-processing', { 
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 25,
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 5000,
    },
  },
});

export const auditLogQueue = new Queue<AuditLogJobData>('audit-log', { 
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 1000,
    removeOnFail: 100,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

// Job processors
export function setupWorkers() {
  // Virus scan worker
  const virusScanWorker = new Worker<VirusScanJobData>(
    'virus-scan',
    async (job: Job<VirusScanJobData>) => {
      const { documentId, s3Key, userId } = job.data;
      
      try {
        // Download file from S3 for scanning
        const { Body } = await s3Client.send({
          Bucket: S3_BUCKET,
          Key: s3Key,
        });
        
        if (!Body) {
          throw new Error('Failed to download file from S3');
        }
        
        // Convert stream to buffer
        const chunks: Uint8Array[] = [];
        for await (const chunk of Body as any) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        
        // Scan for virus
        const scanResult = await scanFileForVirus(buffer);
        
        // Update document with scan results
        await db
          .update(documents)
          .set({
            virusScanStatus: scanResult.isClean ? 'clean' : 'infected',
            virusScanResult: JSON.stringify(scanResult),
          })
          .where(eq(documents.id, documentId));
        
        // Log audit event
        await auditLogQueue.add('audit-log', {
          userId,
          action: 'SCAN',
          resource: 'document',
          resourceId: documentId,
          details: { scanResult },
        });
        
        return { success: true, scanResult };
      } catch (error) {
        // Mark as scan failed
        await db
          .update(documents)
          .set({
            virusScanStatus: 'failed',
            virusScanResult: JSON.stringify({ error: error.message }),
          })
          .where(eq(documents.id, documentId));
        
        throw error;
      }
    },
    { connection: redis, concurrency: 3 }
  );

  // Thumbnail generation worker
  const thumbnailWorker = new Worker<ThumbnailJobData>(
    'thumbnail-generation',
    async (job: Job<ThumbnailJobData>) => {
      const { documentId, s3Key, contentType } = job.data;
      
      if (!contentType.startsWith('image/')) {
        return { success: true, message: 'Not an image file' };
      }
      
      try {
        // Download original image
        const { Body } = await s3Client.send({
          Bucket: S3_BUCKET,
          Key: s3Key,
        });
        
        if (!Body) {
          throw new Error('Failed to download file from S3');
        }
        
        const chunks: Uint8Array[] = [];
        for await (const chunk of Body as any) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        
        // Generate thumbnail
        const thumbnailBuffer = await generateThumbnail(buffer);
        const thumbnailKey = generateThumbnailKey(s3Key);
        
        // Upload thumbnail to S3
        await s3Client.send({
          Bucket: S3_BUCKET,
          Key: thumbnailKey,
          Body: thumbnailBuffer,
          ContentType: 'image/jpeg',
        });
        
        // Update document with thumbnail URL
        const thumbnailUrl = `https://${S3_BUCKET}.s3.amazonaws.com/${thumbnailKey}`;
        await db
          .update(documents)
          .set({ thumbnailUrl })
          .where(eq(documents.id, documentId));
        
        return { success: true, thumbnailUrl };
      } catch (error) {
        console.error('Thumbnail generation failed:', error);
        throw error;
      }
    },
    { connection: redis, concurrency: 2 }
  );

  // CAD processing worker
  const cadProcessingWorker = new Worker<CADProcessingJobData>(
    'cad-processing',
    async (job: Job<CADProcessingJobData>) => {
      const { documentId, s3Key, fileType, userId } = job.data;
      
      try {
        let previewUrl: string | null = null;
        
        // If Forge API key is available, process with Autodesk Forge
        if (process.env.FORGE_CLIENT_ID && process.env.FORGE_CLIENT_SECRET) {
          // This would integrate with Autodesk Forge API for CAD preview
          // For now, we'll create a placeholder preview
          previewUrl = `https://forge.autodesk.com/preview/${Buffer.from(s3Key).toString('base64')}`;
        } else {
          // Generate basic CAD file icon/preview
          previewUrl = `/api/cad-preview/${documentId}`;
        }
        
        // Update document with preview URL
        await db
          .update(documents)
          .set({ previewUrl })
          .where(eq(documents.id, documentId));
        
        // Log processing completion
        await auditLogQueue.add('audit-log', {
          userId,
          action: 'PROCESS',
          resource: 'document',
          resourceId: documentId,
          details: { fileType, previewGenerated: !!previewUrl },
        });
        
        return { success: true, previewUrl };
      } catch (error) {
        console.error('CAD processing failed:', error);
        throw error;
      }
    },
    { connection: redis, concurrency: 1 }
  );

  // Audit log worker
  const auditLogWorker = new Worker<AuditLogJobData>(
    'audit-log',
    async (job: Job<AuditLogJobData>) => {
      const { userId, action, resource, resourceId, details, ipAddress, userAgent } = job.data;
      
      await db.insert(auditLogs).values({
        userId,
        action: action as any,
        resource,
        resourceId,
        details,
        ipAddress,
        userAgent,
      });
      
      return { success: true };
    },
    { connection: redis, concurrency: 5 }
  );

  // Error handling
  [virusScanWorker, thumbnailWorker, cadProcessingWorker, auditLogWorker].forEach(worker => {
    worker.on('failed', (job, err) => {
      console.error(`Job ${job?.id} failed:`, err);
    });
    
    worker.on('error', (err) => {
      console.error('Worker error:', err);
    });
  });

  return {
    virusScanWorker,
    thumbnailWorker,
    cadProcessingWorker,
    auditLogWorker,
  };
}

// Helper functions to add jobs
export async function addVirusScanJob(data: VirusScanJobData, priority?: number) {
  return virusScanQueue.add('scan', data, { priority });
}

export async function addThumbnailJob(data: ThumbnailJobData, priority?: number) {
  return thumbnailQueue.add('generate', data, { priority });
}

export async function addCADProcessingJob(data: CADProcessingJobData, priority?: number) {
  return cadProcessingQueue.add('process', data, { priority });
}

export async function addAuditLogJob(data: AuditLogJobData) {
  return auditLogQueue.add('log', data, { priority: 1 });
}

export { redis };