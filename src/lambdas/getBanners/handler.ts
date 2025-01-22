import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';
import { withApiLoggingAuth } from '../../common/lambda-utils';
import { getBannersService } from './getBannersService';

const getBannersLambda = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    try {
        const response = await getBannersService();
        return {
            statusCode: StatusCodes.OK,
            body: JSON.stringify(response),
            headers: { 'Content-Type': 'application/json' }
        }
    } catch (error) {
        throw error
    }
}
export const handler = withApiLoggingAuth(getBannersLambda);