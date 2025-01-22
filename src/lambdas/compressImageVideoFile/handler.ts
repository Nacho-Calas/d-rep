import { Context } from 'aws-lambda';
import { withSQSLogging } from '../../common/lambda-utils';
import { logger } from '../../common/logger';
import { SQSEventInterface } from '../../common/sqsEventInterface';
import { compressImageVideoFileService } from './compressImageVideoFileService';

async function compressImageVideoFileLambda(event: SQSEventInterface, context: Context): Promise<any> {
    try {
        const body = JSON.parse(event.Records[0].body);
        const response = await compressImageVideoFileService(body.detail.response.result.id.data);
        return;
    } catch (error) {
        logger.error("Error in compressImageVideoFileLambda", error);
        throw error
    }
}
export const handler = withSQSLogging(compressImageVideoFileLambda);