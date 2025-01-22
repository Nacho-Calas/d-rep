import { StatusCodes } from "http-status-codes";
import { notificationsDynamoDBRepository } from "../../common/dynamoDB/notificationsTableDynamoRepository";
import { logger } from "../../common/logger";

const notificationRepository = new notificationsDynamoDBRepository();

export const updateNotificationsService = async (): Promise<any> => {
    try {
        const response = await notificationRepository.updateAllNotifications();
        return {
            statusCode: StatusCodes.OK,
            body: JSON.stringify(response)
        }
    } catch (error) {
        logger.error({
            message: 'Error al actualizar las notificaciones' + error.msg,
            error: error
        })
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: JSON.stringify({ error: 'Error al actualizar las notificaciones' }),
        }
    }
}