import { Context } from 'aws-lambda';
import { withSQSLogging } from '../../common/lambda-utils';
import { SQSEventInterface } from '../../common/sqsEventInterface';
import { billTextractPreProcessingService } from './billTextractPreProcessingService';

async function billTextractPreProcessingLambda(event: SQSEventInterface, context: Context): Promise<any> {
    try {
        const body = JSON.parse(event.Records[0].body);
        const response = await billTextractPreProcessingService(body.detail.response.result.id.data, body.detail.response.result.bill.data.s3key.data)
        return response;
    } catch (error) {
        throw error
    }
}
export const handler = withSQSLogging(billTextractPreProcessingLambda);