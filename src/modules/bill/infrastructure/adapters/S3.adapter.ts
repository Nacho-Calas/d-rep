import S3 from "aws-sdk/clients/s3";

export class S3Adapter {
  private s3Client: S3;

  constructor() {
    this.s3Client = new S3();
  }

  public async getSignedUrl(
    bucketName: string,
    key: string,
    isPublic: boolean
  ): Promise<{ presignedUrl: string; s3Url: string; key: string }> {
    
    // Ejemplo
    const presignedUrl = await this.s3Client.getSignedUrlPromise("putObject", {
      Bucket: bucketName,
      Key: key,
      Expires: 3600,
    });

    const s3Url = `https://${bucketName}.s3.amazonaws.com/${key}`;

    return {
      presignedUrl,
      s3Url,
      key,
    };
  }
}
