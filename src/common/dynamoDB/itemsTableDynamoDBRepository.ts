import {
    AWSDynamoDBClient,
    awsDynamoDBClientInstance,
} from './AWSdynamoDBClient';
import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { ItemInterface } from './itemsTableDynamoDBInterface';
import { GetItemsGSIInput } from './AWSdynamoDBClientInterface';
import { convertToDynamoDBFormat } from '../convertToDynamoDBFormat';
import { convertDynamoDBtoJSON } from '../convertDynamoDBtoJSON';
import { mergeObjects } from '../mergeObjects';
import { logger } from '../logger';

export class itemsTableDynamoDBRepository {
    dynamoDbClient: AWSDynamoDBClient;

    constructor() {
        this.dynamoDbClient = awsDynamoDBClientInstance;
    }

    async newItem(
        itemData: ItemInterface,
    ): Promise<any> {
        const params = convertToDynamoDBFormat(itemData);
        try {
            const response = await this.dynamoDbClient.postItem(
                params,
                process.env.ITEMS_TABLE
            );
            return response;
        } catch (error) {
            logger.error({
                msg:
                    'Error in itemTableDynamoDBRepository on newItem method with message: ' +
                    error.msg,
                paramsToPost: params,
                error: error,
            });
            throw error;
        }
    }

}
