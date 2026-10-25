import { InternalServerErrorException } from '@nestjs/common';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { UploadService } from '../upload.service';

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(),
  PutObjectCommand: jest.fn((input: unknown) => ({ type: 'put', input })),
  DeleteObjectCommand: jest.fn((input: unknown) => ({ type: 'delete', input })),
}));

const file = {
  originalname: 'informe.pdf',
  buffer: Buffer.from('pdf'),
  mimetype: 'application/pdf',
  size: 3,
} as Express.Multer.File;

describe('UploadService', () => {
  const originalEnv = process.env;
  let send: jest.Mock;

  const createService = (env: Record<string, string>) => {
    process.env = { ...originalEnv, ...env };
    return new UploadService();
  };

  beforeEach(() => {
    jest.clearAllMocks();
    send = jest.fn().mockResolvedValue({});
    (S3Client as unknown as jest.Mock).mockImplementation(() => ({ send }));
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('uploadFile', () => {
    it('should throw when no file is provided', async () => {
      const service = createService({ S3_BUCKET_NAME: 'bucket' });

      await expect(
        service.uploadFile(undefined as unknown as Express.Multer.File),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should upload to the folder and return the path-style URL', async () => {
      const service = createService({
        S3_BUCKET_NAME: 'bucket',
        S3_ENDPOINT: 'http://localhost:4566',
      });

      const url = await service.uploadFile(file, 'resources');

      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'bucket',
          Key: expect.stringMatching(/^resources\/[\w-]+\.pdf$/),
          ContentType: 'application/pdf',
        }),
      );
      expect(send).toHaveBeenCalledTimes(1);
      expect(url).toMatch(
        /^http:\/\/localhost:4566\/bucket\/resources\/[\w-]+\.pdf$/,
      );
    });

    it('should return the AWS URL when there is no custom endpoint', async () => {
      const service = createService({
        S3_BUCKET_NAME: 'bucket',
        S3_ENDPOINT: '',
        AWS_S3_ENDPOINT: '',
        S3_REGION: 'us-east-2',
      });

      const url = await service.uploadFile(file);

      expect(url).toMatch(
        /^https:\/\/bucket\.s3\.us-east-2\.amazonaws\.com\/uploads\/[\w-]+\.pdf$/,
      );
    });

    it('should throw when S3 fails', async () => {
      const service = createService({ S3_BUCKET_NAME: 'bucket' });
      send.mockRejectedValue(new Error('S3 down'));

      await expect(service.uploadFile(file)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('deleteFile', () => {
    it('should do nothing for an empty URL', async () => {
      const service = createService({ S3_BUCKET_NAME: 'bucket' });

      await service.deleteFile('');

      expect(send).not.toHaveBeenCalled();
    });

    it('should extract the key after the bucket name', async () => {
      const service = createService({ S3_BUCKET_NAME: 'deployapp-s3' });

      await service.deleteFile(
        'http://10.8.0.1:4566/deployapp-s3/resources/abc.pdf',
      );

      expect(DeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: 'deployapp-s3',
        Key: 'resources/abc.pdf',
      });
    });

    it('should not throw when S3 fails', async () => {
      const service = createService({ S3_BUCKET_NAME: 'bucket' });
      send.mockRejectedValue(new Error('S3 down'));

      await expect(
        service.deleteFile('http://host/bucket/file.pdf'),
      ).resolves.toBeUndefined();
    });
  });
});
