import { Context } from 'aws-lambda';
import { SQSEventInterface } from '../../common/sqsEventInterface';
import { withSQSLogging } from '../../common/lambda-utils';
import { simpleHeaderOCRService } from './simpleHeaderOCRService';

const simpleHeaderOCRLambda = async (event: SQSEventInterface, context: Context): Promise<any> => {
    try {
        const body = JSON.parse(event.Records[0].body);
        const response = await simpleHeaderOCRService(body.detail.response.result.id.data)
        return response;
    } catch (error) {
        throw error;
    }
};
export const handler = withSQSLogging(simpleHeaderOCRLambda);