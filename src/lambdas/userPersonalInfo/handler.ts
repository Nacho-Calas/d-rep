import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';
import { withApiLogging } from '../../common/lambda-utils';
import { userPersonalInfoService } from './userPersonalInfoService';
import { userPersonalInfoReqSchema } from './userPersonalInfoReqSchema';
import { UserPersonalInfoDTO } from './userPersonalInfoDTO';

export const userPersonalInfoLambda = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    try {
        const payload: UserPersonalInfoDTO = JSON.parse(event.body);
        const { error } = userPersonalInfoReqSchema.validate(payload);

        if (error) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ error: 'Solicitud no válida', details: error.details }),
                headers: { 'Content-Type': 'application/json' }
            };
        }

        const { statusCode, body } = await userPersonalInfoService(payload);
        return {
            statusCode: statusCode,
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        };
    } catch (error) {
        throw error
    }
}
export const handler = withApiLogging(userPersonalInfoLambda);