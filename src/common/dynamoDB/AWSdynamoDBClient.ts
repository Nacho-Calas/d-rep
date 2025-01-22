import {
  DynamoDBClient,
  PutItemCommand,
  PutItemInput,
  AttributeValue,
  QueryCommand,
  QueryCommandInput,
  BatchGetItemCommand,
  BatchGetItemCommandInput,
  BatchGetItemCommandOutput,
  QueryOutput,
  UpdateItemCommandInput,
  UpdateItemCommand,
  ScanCommand,
  ScanCommandOutput
} from "@aws-sdk/client-dynamodb";
import { GetCommand, GetCommandInput, ScanCommandInput } from "@aws-sdk/lib-dynamodb";
import { GetItemsGSIInput } from './AWSdynamoDBClientInterface';
import { logger } from '../logger'

export class AWSDynamoDBClient {
  TABLE_NAME: string;
  dynamoDbClient: DynamoDBClient;

  constructor() {
    this.TABLE_NAME = process.env.MAIN_TABLE // tabla por defecto
    this.dynamoDbClient = new DynamoDBClient({ region: 'us-east-2' });
  };

  async getItem(id: string, tableName = this.TABLE_NAME, sk?: string) {
    const params: GetCommandInput = {
      TableName: tableName,
      Key: {
        PK: id
      }
    };
    if (sk) {
      params.Key.SK = sk;
    }
    try {
      const { Item } = await this.dynamoDbClient.send(new GetCommand(params));
      return Item === undefined ? null : Item;
    } catch (error) {
      logger.error({
        msg: "Error in AWSDynamoDBClient on getItem method with message: " + error.msg,
        commandParms: params,
        error: error,
      });
      throw error;
    }
  };

  async getItemId(id: string, tableName = this.TABLE_NAME, sk?: string) {
    const params: GetCommandInput = {
      TableName: tableName,
      Key: {
        id: id
      }
    };
    if (sk) {
      params.Key.SK = sk;
    }
    try {
      const { Item } = await this.dynamoDbClient.send(new GetCommand(params));
      return Item === undefined ? null : Item;
    } catch (error) {
      logger.error({
        msg: "Error in AWSDynamoDBClient on getItem method with message: " + error.msg,
        commandParms: params,
        error: error,
      });
      throw error;
    }
  };

  async getItemByQuery(id: string, tableName = this.TABLE_NAME, sk?: string) {
    let params: QueryCommandInput;
    if (sk) {
      params = {
        TableName: tableName,
        KeyConditionExpression: 'PK = :pkValue and SK = :skValue',
        ExpressionAttributeValues: {
          ':pkValue': { S: id }, // S para tipo de dato String, ajusta según tu tipo de datos
          ':skValue': { S: sk } // S para tipo de dato String, ajusta según tu tipo de datos
        }
      };
    } else {
      params = {
        TableName: tableName,
        KeyConditionExpression: 'PK = :pkValue',
        ExpressionAttributeValues: {
          ':pkValue': { S: id } // S para tipo de dato String, ajusta según tu tipo de datos
        }
      }
    }
    try {
      const response: QueryOutput = await this.dynamoDbClient.send(new QueryCommand(params));
      return response === undefined ? null : response.Items;
    } catch (error) {
      logger.error({
        msg: "Error in AWSDynamoDBClient on getItem method with message: " + error.msg,
        commandParms: params,
        error: error,
      });
      throw error;
    }
  };

  async getItems(tableName = this.TABLE_NAME) {
    let params: ScanCommandInput = {
      TableName: tableName,
    };
    try {
      const scanResults = [];
      let items: ScanCommandOutput;
      do {
        items = await this.dynamoDbClient.send(new ScanCommand(params));
        items.Items.forEach((item) => scanResults.push(item));
        params.ExclusiveStartKey = items.LastEvaluatedKey;
      } while (typeof items.LastEvaluatedKey !== 'undefined');

      return scanResults;
    } catch (error) {
      logger.error({
        msg: "Error in AWSDynamoDBClient on getItems method with message: " + error.msg,
        commandParms: params,
        error: error,
      });
      throw error;
    }
  }

  async postItem(item: Record<string, AttributeValue> | undefined, tableName = this.TABLE_NAME) {
    const params: PutItemInput = {
      TableName: tableName,
      Item: item
    }
    try {
      const putItemCommand = new PutItemCommand(params);
      const response = await this.dynamoDbClient.send(putItemCommand);
      if (response.$metadata.httpStatusCode !== 200) {
        logger.error({
          msg: "PutItem operation failed" + response.$metadata.httpStatusCode,
          commandParms: params,
          error: response,
        });
        throw new Error('PutItem operation failed');
      }
      return response;
    } catch (error) {
      logger.error({
        msg: "Error in AWSDynamoDBClient on postItem method with message: " + error.msg,
        commandParms: params,
        error: error,
      });
      throw error;
    }
  }

  async getItemsGSI(data: GetItemsGSIInput, tableName = this.TABLE_NAME): Promise<QueryOutput>{
    let params: QueryCommandInput = {
      TableName: tableName,
      KeyConditionExpression: data.keyConditionExpression,
      ExpressionAttributeValues: data.expressionAttributeValues,
    };
    if (data.indexName != undefined) params.IndexName = data.indexName;
    if (data.expressionAttributeNames != undefined) params.ExpressionAttributeNames = data.expressionAttributeNames;
    if (data.filterExpression != undefined) params.FilterExpression = data.filterExpression;
    let allItems: any[] = [];
    let count = 0;
    let lastEvaluatedKey: Record<string, AttributeValue> | undefined;

    do {
      if (lastEvaluatedKey) {
        params.ExclusiveStartKey = lastEvaluatedKey;
      }

      try {
        const response: QueryOutput = await this.dynamoDbClient.send(new QueryCommand(params));
        if (response.Items) {
          allItems = allItems.concat(response.Items);
        } else {
          return {
            Count: count,
            Items: [],
            ScannedCount: count
          }
        }
        if (response.Count) {
          count += response.Count;
        }
        lastEvaluatedKey = response.LastEvaluatedKey;
      } catch (error) {
        logger.error({
          msg: "Error in AWSDynamoDBClient on getItemsGSI method with message: " + error.message,
          commandParms: params,
          error: error,
        });
        return null;
      }
    } while (lastEvaluatedKey);

    return {
      Count: count,
      Items: allItems,
      ScannedCount: count
    }
  };

  async getItemsPaginatedGSI(data: GetItemsGSIInput, tableName = this.TABLE_NAME): Promise<QueryOutput>{
    let params: QueryCommandInput = {
      TableName: tableName,
      KeyConditionExpression: data.keyConditionExpression,
      ExpressionAttributeValues: data.expressionAttributeValues,
    };
    if (data.indexName != undefined) params.IndexName = data.indexName;
    if (data.expressionAttributeNames != undefined) params.ExpressionAttributeNames = data.expressionAttributeNames;
    if (data.filterExpression != undefined) params.FilterExpression = data.filterExpression;
    if (data.exclusiveStartKey != undefined) params.ExclusiveStartKey = data.exclusiveStartKey;
    if (data.limit != undefined) params.Limit = data.limit;
    try {
      const response: QueryOutput = await this.dynamoDbClient.send(new QueryCommand(params));
      return response;
    } catch (error) {
      logger.error({
        msg: "Error in AWSDynamoDBClient on getItemsGSI method with message: " + error.msg,
        commandParms: params,
        error: error,
      });
      return null;
  }
  };

  async searchByKeys(keyList: Record<string, AttributeValue>[], tableName = this.TABLE_NAME): Promise<BatchGetItemCommandOutput> {
    const params: BatchGetItemCommandInput = {
      RequestItems: {
        [tableName]: {
          Keys: keyList
        }
      }
    };
    try {
      const response = await this.dynamoDbClient.send(new BatchGetItemCommand(params));
      return response;
    } catch (error) {
      logger.error({
        msg: "Error in AWSDynamoDBClient on searchByKeys method with message: " + error.msg,
        commandParms: params,
        error: error,
      });
      throw error;
    }
  }

  async updateItem(params: UpdateItemCommandInput): Promise<any> {
    try {
      const response = await this.dynamoDbClient.send(new UpdateItemCommand(params));
      return response;
    } catch (error) {
      logger.error({
        msg: "Error in AWSDynamoDBClient on updateItem method with message: " + error.msg,
        commandParms: params,
        error: error,
      });
      throw error;
    }
  }
};

export const awsDynamoDBClientInstance = new AWSDynamoDBClient();
