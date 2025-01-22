import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { convertDynamoDBtoJSON } from "../convertDynamoDBtoJSON";
import { convertToDynamoDBFormat } from "../convertToDynamoDBFormat";
import { logger } from "../logger";
import { mergeObjects } from "../mergeObjects";
import {
  AWSDynamoDBClient,
  awsDynamoDBClientInstance,
} from "./AWSdynamoDBClient";
import { GetItemsGSIInput } from "./AWSdynamoDBClientInterface";
import { BillStatus, BillTableInterface } from "./billTableDynamoDBInterface";
import {
  BillResponseDTO,
  lastEvaluatedKeyDTO,
} from "../../lambdas/getUserBills/getUserBillsDTO";

export class billTableDynamoDBRepository {
  dynamoDbClient: AWSDynamoDBClient;

  constructor() {
    this.dynamoDbClient = awsDynamoDBClientInstance;
  }

  async newBill(
    billData: BillTableInterface,
    billId: string,
    functionName: string
  ): Promise<any> {
    // const currentDate = new Date().toISOString().substring(0, 10);
    const currentDate = new Date(
      Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate(),
        new Date().getUTCHours(),
        new Date().getUTCMinutes(),
        new Date().getUTCSeconds()
      )
    ).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "America/Argentina/Buenos_Aires",
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
        creationDate: { S: formattedDate },
        s3url: { S: billData.bill.S3url ? billData.bill.S3url : billData.bill.s3url },
        status: { S: billData.bill.status },
        bill: {
          M: {
            creationDate: { S: formattedDate },
            status: { S: billData.bill.status },
            userId: { S: billData.bill.userId },
            s3url: { S: billData.bill.S3url ? billData.bill.S3url : billData.bill.s3url },
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
        type: { S: billData.type },
        GSI1PK: { S: "user" },
        GSI1SK: { S: billData.bill.userId },
      };

      if (billData.bill.S3urlVideo)
        mergeObjects(params, {
          bill: { M: { S3urlVideo: { S: billData.bill.S3urlVideo } } },
        });
      if (billData.bill.s3keyVideo)
        mergeObjects(params, {
          bill: { M: { S3urlVideo: { S: billData.bill.s3keyVideo } } },
        });
      if (billData.bill.textractData)
        mergeObjects(params, {
          bill: { M: { textractData: { S: billData.bill.textractData } } },
        });
      if (billData.bill.textractMappedToVertexFormat)
        mergeObjects(params, {
          bill: {
            M: {
              textractMappedToVertexFormat: {
                S: billData.bill.textractMappedToVertexFormat,
              },
            },
          },
        });
      const response = await this.dynamoDbClient.postItem(
        params,
        process.env.BILLS_TABLE
      );
      return response;
    } catch (error) {
      logger.error({
        msg:
          "Error in billTableDynamoDBRepository on newBill method with message: " +
          error.msg,
        paramsToPost: params,
        error: error,
      });
      throw error;
    }
  }

  async getBill(billId: string) {
    return await this.dynamoDbClient
      .getItemId(billId, process.env.BILLS_TABLE)
      .then((response: Record<string, any>) => {
        return response;
      })
      .catch((error) => {
        logger.error({
          msg:
            "Error in billTableDynamoDBRepository on getBill method with message: " +
            error.msg,
          error: error,
        });
        throw error;
      });
  }

  async putBill(
    billData: BillTableInterface,
    billId: string,
    functionName: string
  ): Promise<void> {
    try {
      const currentDate = new Date(
        Date.UTC(
          new Date().getUTCFullYear(),
          new Date().getUTCMonth(),
          new Date().getUTCDate(),
          new Date().getUTCHours(),
          new Date().getUTCMinutes(),
          new Date().getUTCSeconds()
        )
      ).toLocaleString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "America/Argentina/Buenos_Aires",
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
        process.env.BILLS_TABLE
      );
      return;
    } catch (error) {
      logger.error({
        msg:
          "Error in billTableDynamoDBRepository on putBill method with message: " +
          error.msg,
        paramsToPost: billData,
        error: error,
      });
      throw error;
    }
  }

  async getHashWithGSI(hash: string) {
    const params: GetItemsGSIInput = {
      indexName: "GSI2",
      keyConditionExpression: "GSI2PK = :prop AND GSI2SK = :code",
      expressionAttributeValues: {
        ":prop": { S: "hash" },
        ":code": { S: hash },
      },
    };
    try {
      const response = await this.dynamoDbClient.getItemsGSI(
        params,
        process.env.BILLS_TABLE
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
          "Error in billTableDynamoDBRepository on getHashWithGSI method with message: " +
          error.msg,
        paramsToPost: params,
        error: error,
      });
      throw error;
    }
  }

  async getNumberOfBillsUploadedByUserBySameDayAndSameCUIT(
    userId: string,
    date: string,
    cuit: string
  ) {
    const params: GetItemsGSIInput = {
      indexName: "GSI1",
      keyConditionExpression: "GSI1PK = :prop AND GSI1SK = :code",
      filterExpression:
        "bill.creationDate = :date AND bill.header.cuit = :cuit",
      expressionAttributeValues: {
        ":prop": { S: "user" },
        ":code": { S: userId },
        ":date": { S: date },
        ":cuit": { S: cuit },
      },
    };
    try {
      const response = await this.dynamoDbClient.getItemsGSI(
        params,
        process.env.BILLS_TABLE
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
          "Error in billTableDynamoDBRepository on getNumberOfBillsUploadedByUserBySameDay method with message: " +
          error.msg,
        paramsToPost: params,
        error: error,
      });
      throw error;
    }
  }

  async getAllBillsUploadedByUser(userId: string, cuit: string) {
    const params: GetItemsGSIInput = {
      indexName: "GSI1",
      keyConditionExpression: "GSI1PK = :prop AND GSI1SK = :code",
      filterExpression: "bill.header.cuit = :cuit",
      expressionAttributeValues: {
        ":prop": { S: "user" },
        ":code": { S: userId },
        ":cuit": { S: cuit },
      },
    };
    try {
      const response = await this.dynamoDbClient.getItemsGSI(
        params,
        process.env.BILLS_TABLE
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
          "Error in billTableDynamoDBRepository on getAllBillsUploadedByUser method with message: " +
          error.msg,
        paramsToPost: params,
        error: error,
      });
      throw error;
    }
  }

  async getUserBillsById(
    userId: string,
    lastEvaluatedKeyId: lastEvaluatedKeyDTO | null,
    limit: number | undefined,
    status: string
  ): Promise<BillResponseDTO> {
    const mapBillStatusToGroup = (status: BillStatus): string => {
      switch (status) {
        case BillStatus.CREATED:
        case BillStatus.COMPRESS:
        case BillStatus.COMPRESS_IN_PROGRESS:
        case BillStatus.PROMOTIONS_FOUND:
        case BillStatus.TEXTRACT_DATA_PREPROCESSED:
        case BillStatus.SIMPLE_HEADER_OCR:
        case BillStatus.INTELLIGENT_HEADER_OCR:
        case BillStatus.SEEK_RELATIONSHIPS:
        case BillStatus.CHECK_DICTIONARY:
        case BillStatus.ADD_DICTIONARY:
        case BillStatus.BILLUPLOAD:
          return "Pendiente";

        case BillStatus.PROMOTION_AMOUNT_APPLIED:
        case BillStatus.PRODUCT_FIELDS_IDENTIFIED:
        case BillStatus.TEXTRACT_COMPLETED:
        case BillStatus.TEXTRACT_RESPONSE_ANALYZED:
        case BillStatus.CASHBACK_APPLIED:
        case BillStatus.BILL_WITHOUT_IDENTIFIED_PRODUCTS:
        case BillStatus.BILL_WITHOUT_CASHBACK:
        case BillStatus.BILL_LIMIT_24H_REACHED:
        case BillStatus.BILL_LIMIT_DAY_REACHED:
        case BillStatus.BILL_LIMIT_WEEK_REACHED:
        case BillStatus.BILL_LIMIT_MONTH_REACHED:
        case BillStatus.PROMOTIONS_FOUND:
          return "Completado";

        case BillStatus.TEXTRACT_PROCESSING_FAILED:
        case BillStatus.ANALYSIS_FAILED:
        case BillStatus.IDENTIFICATION_FAILED:
        case BillStatus.SEARCH_FAILED:
        case BillStatus.APPLICATION_FAILED:
        case BillStatus.BILL_DUPLICATED:
        case BillStatus.UPLOAD_ERROR:
        case BillStatus.BILL_SCAN_UNSUCCESSFUL:
          return "Fallido";

        default:
          return "Desconocido";
      }
    };

    const params: GetItemsGSIInput = {
      indexName: "GSI3",
      keyConditionExpression: "GSI1SK = :code",
      expressionAttributeValues: {
        ":code": { S: userId },
      },
      limit: limit || undefined,
      exclusiveStartKey: lastEvaluatedKeyId
        ? {
            GSI1SK: { S: lastEvaluatedKeyId.GSI1SK },
            id: { S: lastEvaluatedKeyId.id },
            creationDate: { S: lastEvaluatedKeyId.creationDate },
          }
        : undefined,
      scanIndexForward: false,
    };

    try {
      const response = await this.dynamoDbClient.getItemsPaginatedGSI(
        params,
        process.env.BILLS_TABLE
      );

      let result = response.Items?.map((item) => {
        const billId = item.id?.S;
        const billStatus = item.status?.S as BillStatus;
        const statusGroup = mapBillStatusToGroup(billStatus);

        return {
          billId: billId,
          status: statusGroup,
          creationDate: item.creationDate?.S,
        };
      });

      let lastEvaluatedKeyNew: lastEvaluatedKeyDTO = response.LastEvaluatedKey
        ? {
            GSI1SK: response.LastEvaluatedKey?.GSI1SK?.S,
            id: response.LastEvaluatedKey?.id?.S,
            creationDate: response.LastEvaluatedKey?.creationDate?.S,
          }
        : null;

      if (status) {
        result = result.filter((bill) => bill.status === status);
        lastEvaluatedKeyNew = lastEvaluatedKeyNew
          ? {
              GSI1SK: result[result.length - 1].billId,
              id: userId,
              creationDate: result[result.length - 1].creationDate,
            }
          : null;
      }

      return {
        bills: result,
        lastEvaluatedKey: lastEvaluatedKeyNew,
      };
    } catch (error) {
      logger.error({
        msg:
          "Error in billTableDynamoDBRepository on getUserBillsById method with message: " +
          error.message,
        error: error,
      });
      throw error;
    }
  }
}
