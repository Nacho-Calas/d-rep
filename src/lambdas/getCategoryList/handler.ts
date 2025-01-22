import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';
import { withApiLoggingAuth } from '../../common/lambda-utils';
import { getCategoryListService } from './getCategoryListService';

const getCategoryListLambda = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    try {
        const response = await getCategoryListService();
        return {
            statusCode: StatusCodes.OK,
            body: JSON.stringify(response),
            headers: { 'Content-Type': 'application/json' }
        }
    } catch (error) {
        throw error
    }
}
export const handler = withApiLoggingAuth(getCategoryListLambda);