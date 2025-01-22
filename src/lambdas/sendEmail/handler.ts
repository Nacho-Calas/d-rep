import { Context } from 'aws-lambda';
import { withSQSLogging } from '../../common/lambda-utils';
import { SQSEventInterface } from '../../common/sqsEventInterface';
import { sendEmailService } from './sendEmailService';

async function sendEmailLambda(event: SQSEventInterface, context: Context): Promise<any> {
    try {
        const body = JSON.parse(event.Records[0].body);
        await sendEmailService(body);
        return;
    } catch (error) {
        throw error
    }
}
export const handler = withSQSLogging(sendEmailLambda);