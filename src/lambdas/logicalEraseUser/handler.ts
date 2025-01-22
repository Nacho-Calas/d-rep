import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { withApiLoggingAuth } from '../../common/lambda-utils';
import { logicalEraseUSerService } from './logicalEraseUserService';

const logicalEraseUSerLambda = async (event: APIGatewayEvent, context: Context, userId: string): Promise<APIGatewayProxyResult> => {
    try {
        const { statusCode, body } = await logicalEraseUSerService(userId);
        return {
            statusCode: statusCode,
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        };

    } catch (error) {
        throw error
    }
}
export const handler = withApiLoggingAuth(logicalEraseUSerLambda)