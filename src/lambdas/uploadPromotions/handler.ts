import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';
import { withApiLogging } from '../../common/lambda-utils';
import { UploadPromotionsReqDTO } from './uploadPromotionsDTO';
import { uploadPromotionsReqSchema } from './uploadPromotionsReqSchema';
import { uploadPromotionsService } from './uploadPromotionsService';

async function uploadPromotionsLambda(event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> {
    const payload: UploadPromotionsReqDTO = JSON.parse(event.body);
    const { error } = uploadPromotionsReqSchema.validate(payload);

    if (error) {
        return {
            statusCode: StatusCodes.BAD_REQUEST,
            body: JSON.stringify({ error: 'Solicitud no válida', details: error.details }),
            headers: { 'Content-Type': 'application/json' }
        };
    }

    const { statusCode, body } = await uploadPromotionsService(payload);
    return {
        statusCode: statusCode,
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
    };
}
export const handler = withApiLogging(uploadPromotionsLambda);