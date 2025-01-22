import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';
import { withApiLogging } from '../../common/lambda-utils';
import { ForgotPasswordReqDTO } from './forgotPasswordDTO';
import { forgotPasswordSchema } from './forgotPasswordReqSchema';
import { forgotPasswordService } from './forgotPasswordService';

const forgotPasswordLambda = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    try {
        const payload: ForgotPasswordReqDTO = JSON.parse(event.body);

        const { error } = forgotPasswordSchema.validate(payload);
        if (error) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ error: 'Solicitud no válida', details: error.details }),
                headers: { 'Content-Type': 'application/json' }
            };
        }
        const { statusCode, body } = await forgotPasswordService(payload);
        return {
            statusCode: statusCode,
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        };
    } catch (error) {
        throw error
    }
}
export const handler = withApiLogging(forgotPasswordLambda);