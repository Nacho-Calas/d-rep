import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda"
import { updateNotificationsService } from "./updateNotificationsService"
import { withApiLogging } from "../../common/lambda-utils";

export const updateNotificationsLambda = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    try {
        const { statusCode, body } = await updateNotificationsService();
        return {
            statusCode: statusCode,
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        }
    } catch (error) {
        throw error // manejar correctamente el error
    }
}
export const handler = withApiLogging(updateNotificationsLambda);