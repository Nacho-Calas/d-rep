import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';
import { withApiLogging } from '../../common/lambda-utils';
import { ResendCodeReqDTO } from './resendCodeDTO';
import { resendCodeReqSchema } from './resendCodeReqSchema';
import { resendCodeService } from './resendCodeService';

const resendCodeLambda = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    try {
        const payload: ResendCodeReqDTO = JSON.parse(event.body);
        const { error } = resendCodeReqSchema.validate(payload);

        if (error) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ error: 'Solicitud no válida', details: error.details }),
                headers: { 'Content-Type': 'application/json' }
            };
        }

        const { statusCode, body } = await resendCodeService(payload);
        return {
            statusCode: statusCode,
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        };
    } catch (error) {
        throw error
    }
}
export const handler = withApiLogging(resendCodeLambda);