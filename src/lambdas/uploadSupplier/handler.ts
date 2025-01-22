import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';
import { withApiLogging } from '../../common/lambda-utils';
import { UploadSupplierReqDTO } from './uploadSupplierDTO';
import { uploadSupplierReqSchema } from './uploadSupplierReqSchema';
import { uploadSupplierService } from './uploadSupplierService';


async function uploadSupplierLambda(event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> {
    const payload: UploadSupplierReqDTO = JSON.parse(event.body);
    const { error } = uploadSupplierReqSchema.validate(payload);

    if (error) {
        return {
            statusCode: StatusCodes.BAD_REQUEST,
            body: JSON.stringify({ error: 'Solicitud no válida', details: error.details }),
            headers: { 'Content-Type': 'application/json' }
        };
    }

    const { statusCode, body } = await uploadSupplierService(payload);
    return {
        statusCode: statusCode,
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
    };
}
export const handler = withApiLogging(uploadSupplierLambda);