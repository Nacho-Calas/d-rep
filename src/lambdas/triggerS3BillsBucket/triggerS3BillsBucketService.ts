import { logger } from "../../common/logger";
import { S3EventRecord } from 'aws-lambda';
import { dynamoDBRepository } from "../../common/dynamoDB/dynamoDBRepository";
import { mergeObjects } from "../../common/mergeObjects";
import { billTableDynamoDBRepository } from "../../common/dynamoDB/billTableDynamoDBRepository";
import { billTableVertexDynamoDBRepository } from "../../common/dynamoDB/billTableVertexDynamoDBRepository";
import { BillStatus, BillTableInterface, BillType } from "../../common/dynamoDB/billTableDynamoDBInterface";
import { BillTableVertexInterface } from "../../common/dynamoDB/billTableVertexDynamoDBInterface";

const mainTable = new dynamoDBRepository();
const billTable = new billTableDynamoDBRepository();
const billTableVertex = new billTableVertexDynamoDBRepository();
const videoFormatList = [
  "mp4",
  "mov"
];

export const triggerS3BillsBucketService = async (records: S3EventRecord[]): Promise<any> => {
  try {
    if (process.env.ENV == 'insigths' || process.env.ENV == 'insights-dev') {
      await processBillsForInsights(records);
    } else {
      await processBillsforApp(records);
    };
  } catch (error) {
    logger.error({
      msg:
        "Error in triggerS3BillsBucketService method with message: " +
        error.msg,
      error: error,
    });
    throw error;
  };
};

const processBillsforApp = async (records: S3EventRecord[]) => {
  try {
    for await (const record of records) {
      const ids = record.s3.object.key.split('/');
      const billId = ids[1].split('_')[0];
      const billVertexData: BillTableVertexInterface = await billTableVertex.getBill(billId);
      mergeObjects(billVertexData, {
        bill: {
          s3EventData: {
            eventTime: record.eventTime,
            userIdentity: record.userIdentity.principalId,
            bucketName: record.s3.bucket.name,
            objectSize: record.s3.object.size
          }
        },
      });
      if (billVertexData.type == BillType.VIDEO) {
        mergeObjects(billVertexData, {
          bill: {
            status: BillStatus.COMPRESS,
          },
          status: BillStatus.COMPRESS,
        });
      } else {
        mergeObjects(billVertexData, {
          bill: {
            status: BillStatus.CREATED,
          },
          status: BillStatus.CREATED,
        });
      };
      await billTableVertex.putBill(billVertexData, billId, "triggerS3BillsBucket");
    };
    return;
  } catch (error) {
    logger.error({
      msg:
        "Error in triggerS3BillsBucketService - processBillsForInsights method with message: " +
        error.msg,
      error: error,
    });
    throw error;
  }
};

const processBillsForInsights = async (records: S3EventRecord[]) => {
  try {
    for await (const record of records) {
      const ids = record.s3.object.key.split('/');
      const userId = ids[0];
      const billId = ids[1].split('_')[0];
      const dotList = ids[1].split('.');
      const format = dotList[dotList.length -1];
      const userData = await mainTable.getUser(userId);
      if (userData == null) {
        await mainTable.postUser(userId, {
          isEmailVerified: true,
          email: "",
          isFormCompleted: false,
        })
      };
      const formatVideo = videoFormatList.find((value) => value == format);
      if (formatVideo) {
        // se trata de un video
        const billDataVertex: BillTableVertexInterface = {
          id: billId,
          bill: {
              s3url: `https://${record.s3.bucket.name}.s3.amazonaws.com/${record.s3.object.key}`,
              s3key: record.s3.object.key,
              s3EventData: {
                eventTime: record.eventTime,
                userIdentity: record.userIdentity.principalId,
                bucketName: record.s3.bucket.name,
                objectSize: record.s3.object.size
              },
              status: BillStatus.COMPRESS,
              userId: userId
          },
          status: BillStatus.COMPRESS,
          type: BillType.VIDEO
        };
        await billTableVertex.newBill(billDataVertex, billId, "triggerS3BillsBucket");
      } else {
        const billDataVertex: BillTableVertexInterface = {
          id: billId,
          bill: {
              s3url: `https://${record.s3.bucket.name}.s3.amazonaws.com/${record.s3.object.key}`,
              s3key: record.s3.object.key,
              s3ProcessData: {
                url: `https://${record.s3.bucket.name}.s3.amazonaws.com/${record.s3.object.key}`,
                key: record.s3.object.key
              },
              s3EventData: {
                eventTime: record.eventTime,
                userIdentity: record.userIdentity.principalId,
                bucketName: record.s3.bucket.name,
                objectSize: record.s3.object.size
              },
              status: BillStatus.CREATED,
              userId: userId
          },
          status: BillStatus.CREATED,
          type: BillType.IMAGE
        };
        const billData: BillTableInterface = {
          id: billId,
          bill: {
              S3url: `https://${record.s3.bucket.name}.s3.amazonaws.com/${record.s3.object.key}`,
              s3key: record.s3.object.key,
              status: BillStatus.CREATED,
              userId: userId
          },
          status: BillStatus.CREATED,
          type: BillType.IMAGE
        };
        
        await Promise.all([
          await billTableVertex.newBill(billDataVertex, billId, "triggerS3BillsBucket"),
          await billTable.newBill(billData, billId, "triggerS3BillsBucket")
        ]);

      };
    };
    return;
  } catch (error) {
    logger.error({
      msg:
        "Error in triggerS3BillsBucketService - processBillsForInsights method with message: " +
        error.msg,
      error: error,
    });
    throw error;
  };
};