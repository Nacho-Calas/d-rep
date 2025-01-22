import { Context } from 'aws-lambda';
import { withSQSLogging } from '../../common/lambda-utils';
import { SQSEventInterface } from '../../common/sqsEventInterface';
import { promotionsIdentifyService } from './promotionsIdentifyService';
async function promotionsIdentifyLambda(event: SQSEventInterface, context: Context): Promise<any> {
    try {
        const body = JSON.parse(event.Records[0].body);
        await promotionsIdentifyService(body, body.detail.response.result.bill.data.userId.data, body.detail.response.result.id.data);
        return;
    } catch (error) {
        throw error
    }
}
export const handler = withSQSLogging(promotionsIdentifyLambda);