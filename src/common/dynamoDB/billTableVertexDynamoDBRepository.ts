import {
  AWSDynamoDBClient,
  awsDynamoDBClientInstance,
} from './AWSdynamoDBClient';
import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { BillTableVertexInterface } from './billTableVertexDynamoDBInterface';
import { GetItemsGSIInput } from './AWSdynamoDBClientInterface';
import { convertToDynamoDBFormat } from '../convertToDynamoDBFormat';
import { convertDynamoDBtoJSON } from '../convertDynamoDBtoJSON';
import { mergeObjects } from '../mergeObjects';
import { logger } from '../logger';

export class billTableVertexDynamoDBRepository {
  dynamoDbClient: AWSDynamoDBClient;

  constructor() {
    this.dynamoDbClient = awsDynamoDBClientInstance;
  }

  async newBill(
    billData: BillTableVertexInterface,
    billId: string,
    functionName: string
  ): Promise<any> {
    // const currentDate = new Date().toISOString().substring(0, 10);
    const currentDate = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate(), new Date().getUTCHours(), new Date().getUTCMinutes(), new Date().getUTCSeconds())).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'America/Argentina/Buenos_Aires'
    });

    const formattedDate = new Date(
      currentDate.replace(
        /(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})/,
        "$3-$2-$1T$4:$5:$6"
      )
    ).toISOString();
    const changeHistory = [
      {
        timestamp: formattedDate,
        event: billData.bill.status,
        user: billData.bill.userId,
        functionName: functionName,
      },
    ];
    let params: Record<string, AttributeValue>;
    try {
      params = {
        id: { S: billId },
        type: { S: billData.type },
        status: { S: billData.status },
        bill: {
          M: {
            creationDate: { S: formattedDate },
            status: { S: billData.bill.status },
            userId: { S: billData.bill.userId },
            s3url: { S: billData.bill.s3url },
            s3key: { S: billData.bill.s3key },
            changeHistory: {
              L: changeHistory.map((change) => ({
                M: {
                  timestamp: { S: change.timestamp },
                  event: { S: change.event },
                  user: { S: change.user },
                  functionName: { S: change.functionName },
                },
              })),
            },
          },
        },
        GSI1PK: { S: 'user' },
        GSI1SK: { S: billData.bill.userId },
      };

      if (billData.bill.S3urlVideo) mergeObjects(params, { bill: { M: { S3urlVideo: { S: billData.bill.S3urlVideo } } } });
      if (billData.bill.s3EventData) mergeObjects(params, {bill: {M: {s3EventData: {
        M: {
          eventTime: {
            S: billData.bill.s3EventData.eventTime
          },
          userIdentity: {
            S: billData.bill.s3EventData.userIdentity
          },
          bucketName: {
            S: billData.bill.s3EventData.bucketName
          },
          objectSize: {
            S: JSON.stringify(billData.bill.s3EventData.objectSize)
          }
        }
      }} }})
      if (billData.bill.s3ProcessData) mergeObjects(params, {bill: {M: {s3ProcessData: {
        M: {
          url: {
            S: billData.bill.s3ProcessData.url
          },
          key: {
            S: billData.bill.s3ProcessData.key
          }
        }
      }} }});
      if (billData.bill.s3keyVideo) mergeObjects(params, { bill: { M: { S3urlVideo: { S: billData.bill.s3keyVideo } } } });

      const response = await this.dynamoDbClient.postItem(
        params,
        process.env.BILLS_TABLE_VERTEX
      );
      return response;
    } catch (error) {
      logger.error({
        msg:
          'Error in billTableDynamoDBRepository on newBill method with message: ' +
          error.msg,
        paramsToPost: params,
        error: error,
      });
      throw error;
    }
  }

  async getBill(billId: string) {
    return await this.dynamoDbClient
      .getItemId(billId, process.env.BILLS_TABLE_VERTEX)
      .then((response: Record<string, any>) => {
        return response;
      })
      .catch((error) => {
        logger.error({
          msg:
            'Error in billTableDynamoDBRepository on getBill method with message: ' +
            error.msg,
          error: error,
        });
        throw error;
      });
  }

  async putBill(
    billData: BillTableVertexInterface,
    billId: string,
    functionName: string
  ): Promise<void> {
    try {
      const currentDate = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate(), new Date().getUTCHours(), new Date().getUTCMinutes(), new Date().getUTCSeconds())).toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'America/Argentina/Buenos_Aires'
      });

      const formattedDate = new Date(
        currentDate.replace(
          /(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})/,
          "$3-$2-$1T$4:$5:$6"
        )
      ).toISOString();

      const changeHistory = {
        timestamp: formattedDate,
        event: billData.bill.status,
        user: billData.bill.userId,
        functionName: functionName,
      };
      billData.bill.changeHistory.push(changeHistory);
      const params = convertToDynamoDBFormat(billData);
      const response = await this.dynamoDbClient.postItem(
        params,
        process.env.BILLS_TABLE_VERTEX
      );
      return;
    } catch (error) {
      logger.error({
        msg:
          'Error in billTableDynamoDBRepository on putBill method with message: ' +
          error.msg,
        paramsToPost: billData,
        error: error,
      });
      throw error;
    }
  }

  async getHashWithGSI(hash: string) {
    const params: GetItemsGSIInput = {
      indexName: 'GSI2',
      keyConditionExpression: 'GSI2PK = :prop AND GSI2SK = :code',
      expressionAttributeValues: {
        ':prop': { S: 'hash' },
        ':code': { S: hash },
      },
    };
    try {
      const response = await this.dynamoDbClient.getItemsGSI(
        params,
        process.env.BILLS_TABLE_VERTEX
      );
      if (response == null) return [];
      if (response.Count == 0) return [];
      const result = response.Items.map((item) => {
        return convertDynamoDBtoJSON(item);
      });
      return result;
    } catch (error) {
      logger.error({
        msg:
          'Error in billTableDynamoDBRepository on getHashWithGSI method with message: ' +
          error.msg,
        paramsToPost: params,
        error: error,
      });
      throw error;
    }
  }

  async getNumberOfBillsUploadedByUserBySameDayAndSameCUIT(userId: string, date: string, cuit: string) {
    const params: GetItemsGSIInput = {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :prop AND GSI1SK = :code',
      filterExpression: 'bill.creationDate = :date AND bill.header.cuit = :cuit',
      expressionAttributeValues: {
        ':prop': { S: 'user' },
        ':code': { S: userId },
        ':date': { S: date },
        ':cuit': { S: cuit },
      },
    };
    try {
      const response = await this.dynamoDbClient.getItemsGSI(
        params,
        process.env.BILLS_TABLE_VERTEX
      );
      if (response == null) return [];
      if (response.Count == 0) return [];
      const result = response.Items.map((item) => {
        return convertDynamoDBtoJSON(item);
      });
      return result;
    } catch (error) {
      logger.error({
        msg:
          'Error in billTableDynamoDBRepository on getNumberOfBillsUploadedByUserBySameDay method with message: ' +
          error.msg,
        paramsToPost: params,
        error: error,
      });
      throw error;
    }
  }

  async getAllBillsUploadedByUser(userId: string, cuit: string) {
    const params: GetItemsGSIInput = {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :prop AND GSI1SK = :code',
      filterExpression: 'bill.header.cuit = :cuit',
      expressionAttributeValues: {
        ':prop': { S: 'user' },
        ':code': { S: userId },
        ':cuit': { S: cuit },
      },
    };
    try {
      const response = await this.dynamoDbClient.getItemsGSI(
        params,
        process.env.BILLS_TABLE_VERTEX
      );
      if (response == null) return [];
      if (response.Count == 0) return [];
      const result = response.Items.map((item) => {
        return convertDynamoDBtoJSON(item);
      });
      return result;
    } catch (error) {
      logger.error({
        msg:
          'Error in billTableDynamoDBRepository on getAllBillsUploadedByUser method with message: ' +
          error.msg,
        paramsToPost: params,
        error: error,
      });
      throw error;
    }
  }
}
