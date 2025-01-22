import { Context } from 'aws-lambda';
import { withSQSLogging } from '../../common/lambda-utils';
import { SQSEventInterface } from '../../common/sqsEventInterface';
import { seekHeaderRelationshipsService } from './seekHeaderRelationshipsService';

const seekHeaderRelationshipsLambda = async (event: SQSEventInterface, context: Context): Promise<any> => {
    try {
        const body = JSON.parse(event.Records[0].body)
        const response = await seekHeaderRelationshipsService(body.detail.response.result.id.data)
        return response;
    } catch (error) {
        throw error;
    }
}
export const handler = withSQSLogging(seekHeaderRelationshipsLambda);