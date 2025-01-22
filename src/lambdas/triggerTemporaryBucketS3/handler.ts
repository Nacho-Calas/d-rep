import { S3Event, Context, S3EventRecord } from 'aws-lambda';
import { withS3Logging } from '../../common/lambda-utils';
import { logger } from '../../common/logger';
import {triggerTemporaryBucketS3Service} from './triggerTemporaryBucketS3Service'

async function triggerBillsTableLambda(event: S3Event, context: Context): Promise<any> {
    try {
        await triggerTemporaryBucketS3Service(event.Records);
        return;
    } catch (error) {
        logger.error("Error in triggerBillsTableLambda", error);
        throw error;
    }
};
export const handler = withS3Logging(triggerBillsTableLambda);