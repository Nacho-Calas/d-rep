import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';
import { withApiLoggingAuth } from '../../common/lambda-utils';
import { logger } from '../../common/logger';
import { presignedVideoUrlReqSchema } from './presignedVideoUrlSchema';
import { PresignedVideoUrlServiceReqDTO } from './presignedVideoUrlServiceReqDTO';
import { getPresignedVideoUrlService } from './presignedVideoUrlService';

async function generatePresignedVideoUrlLambda(event: APIGatewayEvent, context: Context, userId: string): Promise<APIGatewayProxyResult> {
    try {
        const payload: PresignedVideoUrlServiceReqDTO = JSON.parse(event.body);
        const { error } = presignedVideoUrlReqSchema.validate(payload);

        if (error) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ error: 'Solicitud no válida', details: error.details }),
                headers: { 'Content-Type': 'application/json' }
            };
        }
        const { statusCode, body } = await getPresignedVideoUrlService(userId, payload);
        return {
            statusCode: statusCode,
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        };
    } catch (error) {
        logger.error("Error in generatePresignedUrlVideoLambda: ", error);
        throw {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: JSON.stringify({ error: "Error trying to get presigned url." }),
            headers: { 'Content-Type': 'application/json' }
        }
    }

}
export const handler = withApiLoggingAuth(generatePresignedVideoUrlLambda);