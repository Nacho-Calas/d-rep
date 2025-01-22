import { Context } from 'aws-lambda';
import { withSQSLogging } from '../../common/lambda-utils';
import { SQSEventInterface } from '../../common/sqsEventInterface';
import { billAnalysisService } from './billAnalysisService';

async function billAnalysisLambda(event: SQSEventInterface, context: Context): Promise<any> {
    try {
        const body = JSON.parse(event.Records[0].body);
        const response = await billAnalysisService(body, body.detail.response.result.bill.data.userId.data, body.detail.response.result.id.data)
        return response;
    } catch (error) {
        throw error
    }
}
export const handler = withSQSLogging(billAnalysisLambda);