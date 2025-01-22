import { Context, SQSEvent } from 'aws-lambda';
import { withSQSLogging1 } from '../../common/lambda-utils';
import { logger } from '../../common/logger';
import { billVertexIaService } from './billVertexIaService';

async function billsTextractLambda(event: SQSEvent, context: Context): Promise<any> {
    try {
        const response = await billVertexIaService(event);
        return;
    } catch (error) {
        logger.error(error);
        throw error
    }
}
export const handler = withSQSLogging1(billsTextractLambda);