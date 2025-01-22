import { S3Client, PutObjectCommand, ObjectCannedACL, GetObjectCommand, GetObjectCommandInput, GetObjectCommandOutput } from "@aws-sdk/client-s3";
import { mergeObjects } from './mergeObjects';
import { Readable } from 'stream';
import { logger } from './logger';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
export class S3Repository {
    client: S3Client;

    constructor() {
        this.client = new S3Client({ region: 'us-east-2' });
    }

    async getSignedUrl(key: string, bucketName: string, ACL: boolean, contentType: string = "application/octet-stream") {
        try {
            const params: any = new PutObjectCommand ({
                Bucket: bucketName,
                Key: key,
                ContentType: contentType,
            });
            if (ACL) {
                mergeObjects(params, { ACL: ObjectCannedACL.public_read })
            }
            const url = await getSignedUrl(this.client, params, { expiresIn: 60*10 });

            return {
                presignedUrl: url,
                s3Url: `https://${bucketName}.s3.amazonaws.com/${key}`,
                key: key
            }
        } catch (error) {
            logger.error({
                msg: "Error in S3repository - getSignedUrl with message: " + error,
                error: error,
            });
            throw error;
        }
    }

    async uploadFileToS3(content: any, key: string, bucketName: string, ACL: boolean = false) {
        try {
            const input = {
                Body: content,
                Bucket: bucketName,
                Key: key
            };

            if (ACL) {
                // en caso de bucket publicos
                mergeObjects(input, { ACL: ObjectCannedACL.public_read })
            }

            const command = new PutObjectCommand(input);
            const responseS3 = await this.client.send(command);
            return { url: `https://${bucketName}.s3.amazonaws.com/${key}`, key: key };
        } catch (error) {
            logger.error({
                msg: "Error in uploadImage with message: " + JSON.stringify(error),
                error: error,
            });
            throw error;
        }

    }

    async getFile(url: string, bucketName: string) {
        try {
            const s3Params: GetObjectCommandInput = {
                Bucket: bucketName,
                Key: url
            };
            const { Body } = await this.client.send(new GetObjectCommand(s3Params));
            return new Promise<Buffer>((resolve, reject) => {
                const chunks: Uint8Array[] = [];
                (Body as Readable).on('data', chunk => chunks.push(chunk));
                (Body as Readable).on('end', () => resolve(Buffer.concat(chunks)));
                (Body as Readable).on('error', reject);
              });
        } catch (error) {
            logger.error({
                msg:
                    "Error in S3repository - getFile with message: " +
                    error,
                error: error,
            });
            throw error;
        }

    };

    async getObject(url: string, bucketName: string) {
        try {
            const s3Params: GetObjectCommandInput = {
                Bucket: bucketName,
                Key: url
            };
            const response = await this.client.send(new GetObjectCommand(s3Params));
            return response;
        } catch (error) {
            logger.error({
                msg:
                    "Error in S3repository - getObject with message: " +
                    error,
                error: error,
            });
            throw error;
        }

    }
};

export const S3RepositoryInstance = new S3Repository();
