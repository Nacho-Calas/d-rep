import { v4 as uuidv4 } from 'uuid';
import { S3RepositoryInstance } from "../../common/s3Repository";
import { StatusCodes } from "http-status-codes";
import { BillTableVertexInterface } from "../../common/dynamoDB/billTableVertexDynamoDBInterface";
import { billTableVertexDynamoDBRepository } from "../../common/dynamoDB/billTableVertexDynamoDBRepository";
import { billTableDynamoDBRepository } from "../../common/dynamoDB/billTableDynamoDBRepository";
import { BillStatus, BillType, BillTableInterface } from "../../common/dynamoDB/billTableDynamoDBInterface";

const billTableVertex = new billTableVertexDynamoDBRepository();
const billTable = new billTableDynamoDBRepository();

export const getPresignedUrlService = async (userId: string) => {
    try {
        const billId = uuidv4();
        const s3FileName = `${userId}/${billId}_${Date.now()}.jpg`;
        const url = await S3RepositoryInstance.getSignedUrl(s3FileName, process.env.BUCKET_BILLS, true);
        // se crea ticket en vertex
        const billDataVertex: BillTableVertexInterface = {
            id: billId,
            bill: {
                s3url: url.s3Url,
                s3key: url.key,
                s3ProcessData: {
                  url: url.s3Url,
                  key: url.key
                },
                status: BillStatus.BILLUPLOAD,
                userId: userId
            },
            status: BillStatus.BILLUPLOAD,
            type: BillType.IMAGE
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
            await billTable.newBill(billData, billId, "getPresignedUrlService"),
            await billTableVertex.newBill(billDataVertex, billId, "getPresignedUrlService")
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
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: {
                error: "Error trying to get presigned url.",
            },
        }
    }
};