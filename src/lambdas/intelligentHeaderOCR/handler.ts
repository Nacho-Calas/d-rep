import { Context } from 'aws-lambda';
import { withSQSLogging } from '../../common/lambda-utils';
import { SQSEventInterface } from '../../common/sqsEventInterface';
import { intelligentHeaderOCRService } from './intelligentHeaderOCRService';

const intelligentHeaderOCRLambda = async (event: SQSEventInterface, context: Context): Promise<any> => {
    try {
        const body = JSON.parse(event.Records[0].body);
        const response = await intelligentHeaderOCRService(body.detail.response.result.id.data)
        return response;
    } catch (error) {
        throw error;
    }
}
export const handler = withSQSLogging(intelligentHeaderOCRLambda);