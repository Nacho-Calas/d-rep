import { logger } from "../../common/logger";
import { S3EventRecord } from 'aws-lambda';
import { billTableVertexDynamoDBRepository } from "../../common/dynamoDB/billTableVertexDynamoDBRepository";
import { BillStatus } from "../../common/dynamoDB/billTableDynamoDBInterface";
import { BillTableVertexInterface } from "../../common/dynamoDB/billTableVertexDynamoDBInterface";
import { mergeObjects } from "../../common/mergeObjects";


const billTableVertex = new billTableVertexDynamoDBRepository();

export const triggerTemporaryBucketS3Service = async (records: S3EventRecord[]): Promise<any> => {
  try {
    for await (const record of records) {
      const ids = record.s3.object.key.split('_');
      const billId = ids[0];
      const billData = await billTableVertex.getBill(billId);
      const billDataVertex: BillTableVertexInterface = {
        id: billId,
        status: BillStatus.CREATED,
        bill: {
            s3ProcessData: {
              url: `https://${record.s3.bucket.name}.s3.amazonaws.com/${record.s3.object.key}`,
              key: record.s3.object.key
            },
            status: BillStatus.CREATED
        }
      };
      mergeObjects(billData, billDataVertex);
      await billTableVertex.putBill(billData, billId, "triggerTemporaryBucketS3")
    };
    return;
  } catch (error) {
    logger.error({
      msg:
        "Error in triggerTemporaryBucketS3Service method with message: " +
        error.msg,
      error: error,
    });
    throw error;
  }
};