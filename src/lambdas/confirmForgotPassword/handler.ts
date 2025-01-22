import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';
import { withApiLogging } from '../../common/lambda-utils';
import { ConfirmForgotPasswordReqDTO } from './confirmForgotPasswordDTO';
import { confirmForgotPasswordSchema } from './confirmForgotPasswordReqSchema';
import { confirmForgotPasswordService } from './confirmForgotPasswordService';

const confirmForgotPasswordLambda = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    try {
        const payload: ConfirmForgotPasswordReqDTO = JSON.parse(event.body);
        const { error } = confirmForgotPasswordSchema.validate(payload);

        if (error) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ error: 'Solicitud no válida', details: error.details }),
                headers: { 'Content-Type': 'application/json' }
            };
        }

        const { statusCode, body } = await confirmForgotPasswordService(payload);
        return {
            statusCode: statusCode,
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        };
    } catch (error) {
        throw error
    }
}
export const handler = withApiLogging(confirmForgotPasswordLambda);