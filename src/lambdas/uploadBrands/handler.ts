import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';
import { withApiLogging} from '../../common/lambda-utils';
import { UploadBrandsReqDTO } from './uploadBrandsDTO';
import { uploadBrandsReqSchema } from './uploadBrandsReqSchema';
import { uploadBrandsService } from './uploadBrandsService';

async function uploadBrandsLambda(event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> {
    const payload: UploadBrandsReqDTO = JSON.parse(event.body);
    const { error } = uploadBrandsReqSchema.validate(payload);

    if (error) {
        return {
            statusCode: StatusCodes.BAD_REQUEST,
            body: JSON.stringify({ error: 'Solicitud no válida', details: error.details }),
            headers: { 'Content-Type': 'application/json' }
        };
    }

    const { statusCode, body } = await uploadBrandsService(payload);
    return {
        statusCode: statusCode,
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
    };
}
export const handler = withApiLogging(uploadBrandsLambda);