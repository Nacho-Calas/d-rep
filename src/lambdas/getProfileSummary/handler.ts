import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { withApiLoggingAuth } from '../../common/lambda-utils';
import { getProfileSummaryService } from './getProfileSummaryService';

const getProfileSummaryLambda = async (event: APIGatewayEvent, context: Context, userId: string): Promise<APIGatewayProxyResult> => {
    try {
        const { statusCode, body } = await getProfileSummaryService(userId);
        return {
            statusCode: statusCode,
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        };
    } catch (error) {
        throw error
    }
}
export const handler = withApiLoggingAuth(getProfileSummaryLambda);