import { Context } from 'aws-lambda';
import { withSQSLogging } from '../../common/lambda-utils';
import { SQSEventInterface } from '../../common/sqsEventInterface';
import { checkHeaderDictionaryService } from './checkHeaderDictionaryService';

const checkHeaderDictionaryLambda = async (event: SQSEventInterface, context: Context): Promise<any> => {
    try {
        const body = JSON.parse(event.Records[0].body)
        const response = await checkHeaderDictionaryService(body.detail.response.result.id.data)
        return response;
    } catch (error) {
        throw error;
    }
}
export const handler = withSQSLogging(checkHeaderDictionaryLambda);