import { AttributeValue, ScanCommandOutput, UpdateItemCommandInput } from "@aws-sdk/client-dynamodb";
import { AWSDynamoDBClient, awsDynamoDBClientInstance } from "./AWSdynamoDBClient";
import { NotificationsTableInterface } from "./notificationsTableDynamoInterface";
import { logger } from "../logger";
import { GetItemsGSIInput } from "./AWSdynamoDBClientInterface";


export class notificationsDynamoDBRepository {
    dynamoDbClient: AWSDynamoDBClient;

    constructor() { this.dynamoDbClient = awsDynamoDBClientInstance };

    async saveNotification(
        notificationBody: NotificationsTableInterface
    ): Promise<any> {
        let params: Record<string, AttributeValue>;
        try {
            params = {
                id: { S: notificationBody.id },
                GSI1PK: { S: 'isRead' },
                GSI1SK: { N: JSON.stringify(notificationBody.isRead) },
                title: { S: notificationBody.title },
                description: { S: notificationBody.description },
                date: { S: notificationBody.date }
            };
            console.log('params saveNotification', params)
            const response = await this.dynamoDbClient.postItem(params, process.env.NOTIFICATIONS_TABLE);
            return response;
        } catch (error) {
            logger.error({
                msg: 'Error in notificationsDynamoDBRepository on newNotification method with message: ' + error.msg,
                paramsToPost: params,
                error: error
            });
            throw error;
        }
    }

    async updateAllNotifications(): Promise<any> {
        try {
            const scanParams: GetItemsGSIInput = {
                indexName: 'GSI1',
                keyConditionExpression: "GSI1PK = :column AND GSI1SK = :value",
                expressionAttributeValues: {
                    ":column": { S: "isRead" },
                    ":value": { N: "1" },
                },
            };
            const scanResponse = await this.dynamoDbClient.getItemsGSI(scanParams, process.env.NOTIFICATIONS_TABLE);

            for (const item of scanResponse.Items) {
                const updateParams: UpdateItemCommandInput = {
                    TableName: process.env.NOTIFICATIONS_TABLE,
                    Key: {
                        id: item.id,
                    },
                    UpdateExpression: "set #GSI1SK = :newValue",
                    ExpressionAttributeNames: {
                        "#GSI1SK": "GSI1SK",
                    },
                    ExpressionAttributeValues: {
                        ":newValue": { N: "0" },
                    },
                    ReturnValues: 'UPDATED_NEW'
                };
                try {
                    const response = await this.dynamoDbClient.updateItem(updateParams);
                    console.log('response', response)
                    return response;
                } catch (error) {
                    logger.error({
                        msg: 'Error in notificationsDynamoDBRepository on updateNotification method with message: ' + error.msg,
                        error: error
                    });
                    continue;
                }
            }
        } catch (error) {
            logger.error({
                msg: 'Error in notificationsDynamoDBRepository on updateAllNotifications method with message: ' + error.msg,
                error: error
            });
            throw error; // manejar errores
        }
    }

    async getAllNotifications(): Promise<NotificationsTableInterface[]> {
        try {
            const response = await this.dynamoDbClient.getItems(process.env.NOTIFICATIONS_TABLE);
            return response.map((item: Record<string, AttributeValue>) => {
                return {
                    id: item.id.S,
                    title: item.title.S,
                    description: item.description.S,
                    date: item.date.S,
                    isRead: Number(item.GSI1SK.N)
                }
            });
        } catch (error) {
            logger.error({
                msg: 'Error in notificationsDynamoDBRepository on getAllNotifications method with message: ' + error.msg,
                error: error
            });
            throw error;
        }
    }
}