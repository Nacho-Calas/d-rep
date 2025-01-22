import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';
import { withApiLoggingAuth } from '../../common/lambda-utils';
import { UpdateUserDTO } from './updateUserDTO';
import { updateUserReqSchema } from './updateUserReqSchema';
import { updateUserService } from './updateUserService';

const updateUserLambda = async (event: APIGatewayEvent, context: Context, userId: string): Promise<APIGatewayProxyResult> => {
    try {
        const payload: UpdateUserDTO = JSON.parse(event.body);
        const { error } = updateUserReqSchema.validate(payload);

        if (error) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ error: 'Solicitud no válida', details: error.details }),
                headers: { 'Content-Type': 'application/json' }
            };
        }

        const { statusCode, body } = await updateUserService(payload, userId);
        return {
            statusCode: statusCode,
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        };
    } catch (error) {
        throw error
    }
}
export const handler = withApiLoggingAuth(updateUserLambda);