import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { withApiLoggingAuth } from '../../common/lambda-utils';
import { getUserBillsService } from './getUserBillsService';

const getUserLambda = async (event: APIGatewayEvent, context: Context, userId: string): Promise<APIGatewayProxyResult> => {
    try {
        const payload = event.body ? JSON.parse(event.body) : {};
        const response = await getUserBillsService(userId, payload);
        return response;

    } catch (error) {
        throw error
    }
}
export const handler = withApiLoggingAuth(getUserLambda);