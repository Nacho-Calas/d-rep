import { AttributeValue, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { AWSDynamoDBClient, awsDynamoDBClientInstance } from "./AWSdynamoDBClient";
import { HeaderTableInterface } from "./headersTableVertexDynamoDBInterface";
import { logger } from "../logger";
import { GetItemsGSIInput } from "./AWSdynamoDBClientInterface";
import { convertDynamoDBtoJSON } from "../convertDynamoDBtoJSON";
import { convertToDynamoDBFormat } from "../convertToDynamoDBFormat";

export class headersTableVertexDynamoDBRepository {
    dynamoDbClient: AWSDynamoDBClient;
    private dynamoDbClient2: DynamoDBClient;

    constructor() {
        this.dynamoDbClient = awsDynamoDBClientInstance;
        this.dynamoDbClient2 = new DynamoDBClient({ region: "us-east-2" });
    };
    
    async newHeaderData(
        headerData: HeaderTableInterface,
        headerId: string
    ): Promise<any> {
        let params: Record<string, AttributeValue>;
    //    let existInTable = await this.getNameWithGSI(headerData.nombreComercio)
    //    console.log("Respuesta de la base de datos")
    //    console.log(existInTable)
        try {
            params = {
                id: { S: headerId },
                GSI1PK: { S: 'name' },
                GSI1SK: { S: headerData.nombreComercio ? headerData.nombreComercio : "" },
                GSI2PK: { S: 'cuit' },
                GSI2SK: { S: headerData.cuit ? headerData.cuit:""},
                GSI3PK: { S: 'razonSocial' },
                GSI3SK: { S: headerData.razonSocial ? headerData.razonSocial:"" },
                address: { L: [{ S: headerData.domicilio ? headerData.domicilio :"" }] },
                name: { S: headerData.nombreComercio ? headerData.nombreComercio : "" }
            };

            const response = await this.dynamoDbClient.postItem(params, process.env.HEADERS_TABLE_VERTEX);
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

    async getNameWithGSI(name: string) {
        const params: GetItemsGSIInput = {
            indexName: 'GSI1',
            keyConditionExpression: 'GSI1PK = :prop AND GSI1SK = :code',
            expressionAttributeValues: {
                ':prop': { S: 'name' },
                ':code': { S: name },
            }
        };
        try {
            const response = await this.dynamoDbClient.getItemsGSI(params, process.env.HEADERS_TABLE_VERTEX);
            if (response == null) return [];
            if (response.Count == 0) return [];
            const createNewHeaderList = async (response): Promise<any[]> => {
                let headerDataList: any[]  = [];
                for await (const item of response.Items) {
                    const header = await convertDynamoDBtoJSON({M:item});
                    headerDataList.push(header);
                };
                return headerDataList;
            };
            return await createNewHeaderList(response);
        } catch (error) {
            logger.error({
                msg: 'Error in headersTableDynamoDBRepository on getCuitWithGSI method with message: ' + error.msg,
                paramsToPost: params,
                error: error
            });
            throw error;
        }
    }

    async getHeadersWithCuit(cuit: string) : Promise<any[]> {
        const params: GetItemsGSIInput = {
            indexName: 'GSI2',
            keyConditionExpression: 'GSI2PK = :prop AND GSI2SK = :code',
            expressionAttributeValues: {
                ':prop': { S: 'cuit' },
                ':code': { S: cuit },
            }
        };
        try {
            const response = await this.dynamoDbClient
            .getItemsGSI(params, process.env.HEADERS_TABLE_VERTEX)
            .then((response: Record<string, any>) => {
                return response;
            });
            if (response == null) return [];
            if (response.Count == 0) return [];
            const createNewHeaderList = async (response): Promise<any[]> => {
                let headerDataList: any[]  = [];
                for await (const item of response.Items) {
                    const header = await convertDynamoDBtoJSON({M:item});
                    headerDataList.push(header);
                };
                return headerDataList;
            };
            return await createNewHeaderList(response);
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
            return await this.dynamoDbClient.postItem(params, process.env.HEADERS_TABLE_VERTEX);
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
            const response = await this.dynamoDbClient.getItemByQuery(process.env.HEADERS_TABLE_VERTEX);
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
    };

    async queryByKeywordsInName(keywords: string[]): Promise<any[]> {
        const keywordConditions = keywords.map((_, i) => `contains(#name, :keyword${i})`).join(' OR ');
        const expressionAttributeValues = keywords.reduce((acc, keyword, index) => {
            acc[`:keyword${index}`] = {S: keyword};
            return acc;
        }, { ":partitionKeyValue": {S:'name'} } as Record<string, any>) ;
        const params: GetItemsGSIInput = {
            indexName: "GSI1",
            keyConditionExpression: `GSI1PK = :partitionKeyValue`,
            expressionAttributeNames: {
                "#name": "name"
            },
            filterExpression: keywordConditions,
            expressionAttributeValues: expressionAttributeValues
        };
          try {
            const response = await this.dynamoDbClient.getItemsGSI(
              params,
              process.env.HEADERS_TABLE_VERTEX
            );
            if (response == null) return [];
            if (response.Count == 0) return [];
            const createNewHeaderList = async (response): Promise<any[]> => {
              let headerDataList: any[]  = [];
              for await (const item of response.Items) {
                  const header = await convertDynamoDBtoJSON({M:item});
                  headerDataList.push(header);
              };
              return headerDataList;
            };
            return await createNewHeaderList(response);
          } catch (error) {
            logger.error({
              msg:
                "Error in headersTableVertexDynamoDBRepository on queryByKeywordsInName method with message: " +
                error.msg,
              paramsToPost: params,
              error: error,
            });
            throw error;
          }
    }
}