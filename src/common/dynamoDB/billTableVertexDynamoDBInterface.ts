import { BillStatus, BillType } from './billTableDynamoDBInterface';
export interface BillTableVertexInterface {
    id?: string,
    status?: BillStatus,
    s3url?: string,
    bill?: {
        creationDate?: Date|string,
        status: BillStatus,
        userId?: string,
        S3urlVideo?: string,
        s3keyVideo?: string,
        s3url?: string,
        s3key?: string,
        s3EventData?: {
            eventTime: string,
            userIdentity: string,
            bucketName: string,
            objectSize: number
        },
        s3ProcessData?: {
            url: string,
            key: string
        }, 
        textractData?: any,
        changeHistory?: BillChange[]
    },
    type?: BillType
}

interface BillChange {
    timestamp?: Date|string,
    event: string,
    user: string,
    functionName: string
}