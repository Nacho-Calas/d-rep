import { DynamoDBStreamEvent } from '../../common/dynamoDB/DynamoDBStreamEventInterface';
import { withDynamoDBLogging } from '../../common/lambda-utils';
import { logger } from '../../common/logger';
import { triggerBillsTableVertexService } from './triggerBillsTableVertexService';

async function triggerBillsTableVertexLambda(event: DynamoDBStreamEvent, context: any): Promise<any> {
    try {
        const response = await triggerBillsTableVertexService(event);
        return response;
    } catch (error) {
        logger.error("Error in triggerBillsTableVertexLambda", error);
        throw error;
    }
};
export const handler = withDynamoDBLogging(triggerBillsTableVertexLambda);