import { S3Event, Context, S3EventRecord } from 'aws-lambda';
import { withS3Logging } from '../../common/lambda-utils';
import { logger } from '../../common/logger';
import {triggerS3BillsBucketService} from './triggerS3BillsBucketService'

async function triggerBillsTableLambda(event: S3Event, context: Context): Promise<any> {
    try {
        await triggerS3BillsBucketService(event.Records);
        return;
    } catch (error) {
        logger.error("Erron in triggerBillsTableLambda", error);
        throw error;
    }
};
export const handler = withS3Logging(triggerBillsTableLambda);