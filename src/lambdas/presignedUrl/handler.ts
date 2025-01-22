import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';
import { withApiLoggingAuth } from '../../common/lambda-utils';
import { getPresignedUrlService } from './presignedUrlService';

async function generatePresignedUrlLambda(event: APIGatewayEvent, context: Context, userId: string): Promise<APIGatewayProxyResult> {
    try {
        const { statusCode, body } = await getPresignedUrlService(userId);
        return {
            statusCode: statusCode,
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        };
    } catch (error) {
        throw {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: JSON.stringify({ error: "Error trying to get presigned url." }),
            headers: { 'Content-Type': 'application/json' }
        }
    }

}
export const handler = withApiLoggingAuth(generatePresignedUrlLambda);