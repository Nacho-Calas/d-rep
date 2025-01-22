import { v4 as uuidv4 } from 'uuid';
import { S3RepositoryInstance } from "../../common/s3Repository";
import { StatusCodes } from "http-status-codes";
import { PresignedVideoUrlServiceReqDTO} from './presignedVideoUrlServiceReqDTO';
import { BillTableVertexInterface } from "../../common/dynamoDB/billTableVertexDynamoDBInterface";
import { billTableVertexDynamoDBRepository } from "../../common/dynamoDB/billTableVertexDynamoDBRepository";
import { billTableDynamoDBRepository } from "../../common/dynamoDB/billTableDynamoDBRepository";
import { BillStatus, BillType, BillTableInterface } from "../../common/dynamoDB/billTableDynamoDBInterface";
import { logger } from '../../common/logger';

const billTableVertex = new billTableVertexDynamoDBRepository();
const billTable = new billTableDynamoDBRepository();

export const getPresignedVideoUrlService = async (userId: string, payload: PresignedVideoUrlServiceReqDTO ) => {
    try {
        const billId = uuidv4();
        const s3FileName = `${userId}/${billId}_${Date.now()}.${payload.contentType.split('/')[1]}`;
        const url = await S3RepositoryInstance.getSignedUrl(s3FileName, process.env.BUCKET_BILLS, true, payload.contentType);
        const billDataVertex: BillTableVertexInterface = {
            id: billId,
            bill: {
                s3url: url.s3Url,
                s3key: url.key,
                status: BillStatus.BILLUPLOAD,
                userId: userId
            },
            type: BillType.VIDEO,
            status: BillStatus.BILLUPLOAD,
          };
        const billData: BillTableInterface = {
            id: billId,
            status: BillStatus.BILLUPLOAD,
            type: BillType.IMAGE,
            S3url: url.s3Url,
            bill: {
                S3url: url.s3Url,
                s3key: url.key,
                status: BillStatus.BILLUPLOAD,
                userId: userId
            }
          };
        await Promise.all([
            await billTable.newBill(billData, billId, "getPresignedVideoUrlService"),
            await billTableVertex.newBill(billDataVertex, billId, "getPresignedVideoUrlService")
        ])
        return {
            statusCode: StatusCodes.OK,
            body: {
                url: url.presignedUrl,
                id: billId,
            },
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        };
    } catch (err) {
        logger.error("Error in getPresignedVideoUrlService", err);
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: {
                error: "Error trying to get presigned url.",
            },
        }
    }
};