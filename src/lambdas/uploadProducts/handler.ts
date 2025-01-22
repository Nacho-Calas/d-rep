import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';
import { withApiLogging } from '../../common/lambda-utils';
import { logger } from '../../common/logger';
import { UploadProductsReqDTO } from './uploadProductsDTO';
import { uploadProductsReqSchema } from './uploadProductsReqSchema';
import { uploadProductsService } from './uploadProductsService';

async function uploadProductsLambda(event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> {
    const payload: UploadProductsReqDTO = JSON.parse(event.body);
    const { error } = uploadProductsReqSchema.validate(payload);

    if (error) {
        const errorResponse = JSON.stringify({ error: 'Solicitud no válida', details: error.details });
        logger.error(errorResponse);
        return {
            statusCode: StatusCodes.BAD_REQUEST,
            body: errorResponse,
            headers: { 'Content-Type': 'application/json' }
        };
    }

    const { statusCode, body } = await uploadProductsService(payload);
    return {
        statusCode: statusCode,
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
    }
}
export const handler = withApiLogging(uploadProductsLambda);