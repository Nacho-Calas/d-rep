import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { AWSDynamoDBClient, awsDynamoDBClientInstance } from "./AWSdynamoDBClient";
import { HeaderTableInterface } from "./headersTableDynamoDBInterface";
import { logger } from "../logger";
import { GetItemsGSIInput } from "./AWSdynamoDBClientInterface";
import { convertDynamoDBtoJSON } from "../convertDynamoDBtoJSON";
import { convertToDynamoDBFormat } from "../convertToDynamoDBFormat";
import { mergeObjects } from "../mergeObjects";


export class headersTableDynamoDBRepository {
    dynamoDbClient: AWSDynamoDBClient;

    constructor() {
        this.dynamoDbClient = awsDynamoDBClientInstance;
    };

    async newHeaderData(
        headerData: HeaderTableInterface,
        headerId: string
    ): Promise<any> {
        let params: Record<string, AttributeValue>;

        try {
            params = {
                id: { S: headerId },
                GSI1PK: { S: 'name' },
                GSI1SK: { S: headerData.name ?headerData.name : ""},
                GSI2PK: { S: 'cuit' },
                GSI2SK: { S: headerData.cuit ?headerData.cuit :"" },
                address: { L: headerData.address.map((item) => ({
                    S: item
                  })), }
            };

            const response = await this.dynamoDbClient.postItem(params, process.env.HEADERS_TABLE);
            return response;
        } catch (error) {
            logger.error({
                msg: 'Error in headersTableDynamoDBRepository on newHeaderData method with message: ' + error.msg,
                paramsToPost: params,
                error: error
            });
            throw error;
        }
    }

    async getCuitWithGSI(cuit: string) {
        const params: GetItemsGSIInput = {
            indexName: 'GSI2',
            keyConditionExpression: 'GSI2PK = :prop AND GSI2SK = :code',
            expressionAttributeValues: {
                ':prop': { S: 'cuit' },
                ':code': { S: cuit },
            }
        };
        try {
            return await this.dynamoDbClient
                .getItemsGSI(params, process.env.HEADERS_TABLE)
                .then((response: Record<string, any>) => {
                    return response;
                });
        } catch (error) {
            logger.error({
                msg: 'Error in headersTableDynamoDBRepository on getCuitWithGSI method with message: ' + error.msg,
                paramsToPost: params,
                error: error
            });
            throw error;
        }
    }

    async putHeaderData(
        headerData: any,
    ): Promise<any> {
        try {
            const params = convertToDynamoDBFormat(headerData);
            return await this.dynamoDbClient.postItem(params, process.env.HEADERS_TABLE);
        } catch (error) {
            logger.error({
                msg: 'Error in headersTableDynamoDBRepository on putHeaderData method with message: ' + error.msg,
                paramsToPost: headerData,
                error: error
            });
            throw error;
        }
    }

    async getAllHeaders(): Promise<HeaderTableInterface[]> {
        try {
            const response = await this.dynamoDbClient.getItemByQuery(process.env.HEADERS_TABLE);
            if (response == null) return [];
            response.map((item) => {
                return convertDynamoDBtoJSON(item);
            });
        } catch (error) {
            logger.error({
                msg: 'Error in headersTableDynamoDBRepository on getAllHeaders method with message: ' + error.msg,
                error: error
            });
            throw error;
        }
    }
}