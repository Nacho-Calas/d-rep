import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';
import { withApiLogging } from '../../common/lambda-utils';
import { forceResetPasswordSchema } from './forceResetPasswordReqSchema'
import { ForceResetPasswordReqDTO } from './forceResetPasswordDTO'
import { forceResetPasswordService } from './forceResetPasswordService'

const forceResetPasswordLambda = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    try {
        const payload: ForceResetPasswordReqDTO = JSON.parse(event.body);

        const { error } = forceResetPasswordSchema.validate(payload);
        if (error) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ error: 'Solicitud no válida', details: error.details }),
                headers: { 'Content-Type': 'application/json' }
            };
        }

        const { statusCode, body } = await forceResetPasswordService(payload);
        return {
            statusCode: statusCode,
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        };
    } catch (error) {
        throw error
    }
}
export const handler = withApiLogging(forceResetPasswordLambda);