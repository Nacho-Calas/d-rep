import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export class S3Adapter {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({ region: process.env.REGION });
  }

  public async getSignedUrl(bucketName: string, key: string) {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key
    });
    
    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }
}