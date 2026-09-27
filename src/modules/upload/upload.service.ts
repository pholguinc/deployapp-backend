import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';

@Injectable()
export class UploadService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly endpoint: string;

  constructor() {
    this.bucketName =
      process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || '';
    this.endpoint =
      process.env.S3_ENDPOINT || process.env.AWS_S3_ENDPOINT || '';

    this.s3Client = new S3Client({
      region: process.env.S3_REGION || process.env.AWS_S3_REGION || 'us-east-1',
      endpoint: this.endpoint ? this.endpoint : undefined,
      credentials: {
        accessKeyId:
          process.env.S3_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey:
          process.env.S3_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY || '',
      },
      // Path style es requerido por la mayoría de servicios compatibles con S3 (Minio, R2, etc.)
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true' || true,
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
  ): Promise<string> {
    if (!file) {
      throw new InternalServerErrorException('No file provided');
    }

    const fileExt = extname(file.originalname);
    const fileName = `${folder}/${randomUUID()}${fileExt}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read',
        }),
      );

      // Retorna la URL pública de la imagen
      if (this.endpoint) {
        return `${this.endpoint}/${this.bucketName}/${fileName}`;
      } else {
        return `https://${this.bucketName}.s3.${process.env.S3_REGION}.amazonaws.com/${fileName}`;
      }
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl) return;
    try {
      // Extract the key from the URL
      // Example URL: http://10.8.0.1:4566/deployapp-s3/resources/uuid.pdf
      const urlParts = fileUrl.split('/');
      // If it's path style (like localstack), bucket name is in the path
      // Find where the bucket name is and get everything after it
      let key = '';
      const bucketIndex = urlParts.indexOf(this.bucketName);

      if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
        key = urlParts.slice(bucketIndex + 1).join('/');
      } else {
        // Fallback: try to just get the last part if not found
        // or parse from standard AWS url
        const urlObj = new URL(fileUrl);
        key = urlObj.pathname.replace(`/${this.bucketName}/`, '').substring(1); // remove leading slash
      }

      if (!key) {
        console.warn('Could not extract S3 key from URL:', fileUrl);
        return;
      }

      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      // We don't throw here to avoid failing the whole transaction if delete fails
    }
  }
}
