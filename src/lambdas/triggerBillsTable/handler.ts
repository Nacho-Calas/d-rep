import { DynamoDBStreamEvent } from '../../common/dynamoDB/DynamoDBStreamEventInterface';
import { withDynamoDBLogging } from '../../common/lambda-utils';
import { triggerBillsTableService } from './triggerBillsTableService';

async function triggerBillsTableLambda(event: DynamoDBStreamEvent, context: any): Promise<any> {
    try {
        const response = await triggerBillsTableService(event);
        return response;
    } catch (error) {
        throw error
    }
}
export const handler = withDynamoDBLogging(triggerBillsTableLambda);