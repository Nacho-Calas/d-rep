
export interface S3EventData {
  eventTime: string;
  userIdentity: string;
  bucketName: string;
  objectSize: number;
}

export interface S3ProcessData {
  url: string;
  key: string;
}