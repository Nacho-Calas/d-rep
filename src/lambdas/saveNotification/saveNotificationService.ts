import { notificationsDynamoDBRepository } from "../../common/dynamoDB/notificationsTableDynamoRepository";
import { StatusCodes } from 'http-status-codes';
import { logger } from "../../common/logger";
import * as OneSignal from '@onesignal/node-onesignal';
import { SaveNotificationDTO } from "./saveNotificationDTO";

const notificationRepository = new notificationsDynamoDBRepository();

export const saveNotificationService = async (notification: SaveNotificationDTO): Promise<any> => {
    console.log('notification que llega desde el front:', notification)
    const configuration = OneSignal.createConfiguration({
        userAuthKey: 'MDdmMjM4ZjAtZGU3Ny00ODAzLTgwZGItNDJkMmY1MDE0MmIz', // process.env.ONESIGNAL_USER_AUTH_KEY,
        restApiKey: 'ODI4ODJiZWItMTU2OS00MDMwLThkZDItZDA5M2I0OTc0Njg1' // process.env.ONESIGNAL_REST_API_KEY
    });
    const client = new OneSignal.DefaultApi(configuration);
    const app = await client.getApp('60ad484a-94ab-41a8-85ba-cda28211ee30');
    const notificationFromOneSignal = await client.getNotification(app.id, notification.notificationId, configuration);
    console.log('notificationFromOneSignal', notificationFromOneSignal)
    const notificationData = {
        id: notification.notificationId,
        title: notification.title,
        description: notification.body,
        date: new Date(notificationFromOneSignal.completed_at * 1000).toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
          }).replace(',', ''),
        isRead: 1,
    }
    console.log('notificationData', notificationData)
    try {
        const response = await notificationRepository.saveNotification(notificationData);
        console.log('response', response)
        return {
            statusCode: StatusCodes.OK,
            body: JSON.stringify(response),
        }
    } catch (error) {
        logger.error({
            message: 'Error al guardar la notificación' + error.msg,
            error: error
        })
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: JSON.stringify({ error: 'Error al guardar la notificación' }),
        }
    }
};