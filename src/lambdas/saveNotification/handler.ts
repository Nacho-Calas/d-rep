import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { withApiLogging } from "../../common/lambda-utils";
import { saveNotificationService } from "./saveNotificationService";
import { SaveNotificationDTO } from "./saveNotificationDTO";
import { saveNotificationReqSchema } from "./saveNotificationReqSchema";
import { StatusCodes } from "http-status-codes";

export const saveNotificationLambda = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    try {
        console.log('event', event)
        console.log('event.body', event.body)
        const payload: SaveNotificationDTO = JSON.parse(event.body);
        console.log('payload', payload)
        const { error } = saveNotificationReqSchema.validate(payload);

        if (error) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ error: 'Solicitud no válida', details: error.details }),
                headers: { 'Content-Type': 'application/json' }
            };
        };

        const { statusCode, body } = await saveNotificationService(payload);
        return {
            statusCode: statusCode,
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        };
    } catch (error) {
        throw error // manejar correctamente el error
    }
}
export const handler = withApiLogging(saveNotificationLambda);