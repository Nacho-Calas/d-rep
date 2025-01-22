import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { StatusCodes } from "http-status-codes";
import { withApiLogging } from "../../common/lambda-utils";
import { createOneSignalNotificationService } from "./createOneSignalNotificationService";


const createOneSignalNotificationLambda = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    try {
        // const payload: PostOneSignalNotificationDTO = JSON.parse(event.body);
        // const { error } = postOneSignalNotificationReqSchema.validate(payload);

        // if (error) {
        //     return {
        //         statusCode: StatusCodes.BAD_REQUEST,
        //         body: JSON.stringify({ error: "Solicitud no válida", details: error.details }),
        //         headers: { "Content-Type": "application/json" },
        //     };
        // }

        const { statusCode, body } = await createOneSignalNotificationService();
        return {
            statusCode: statusCode,
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" },
        };
    } catch (error) {
        throw error // manejar correctamente el error
    }
};
export const handler = withApiLogging(createOneSignalNotificationLambda);