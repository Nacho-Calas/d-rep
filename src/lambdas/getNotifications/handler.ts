import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { withApiLogging } from "../../common/lambda-utils";
import { getNotificationsService } from "./getNotificationsService";


export const getNotificationsLambda = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    try {
        const { statusCode, body } = await getNotificationsService();
        return {
            statusCode: statusCode,
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" },
        };
    } catch (error) {
        throw error // manejar correctamente el error
    }
};
export const handler = withApiLogging(getNotificationsLambda);