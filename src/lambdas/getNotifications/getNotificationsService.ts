import * as OneSignal from '@onesignal/node-onesignal';
import { notificationsDynamoDBRepository } from '../../common/dynamoDB/notificationsTableDynamoRepository';
import { logger } from '../../common/logger';
import { StatusCodes } from 'http-status-codes';

const notificationRepository = new notificationsDynamoDBRepository();

export const getNotificationsService = async () => {
    const configuration = OneSignal.createConfiguration({
        userAuthKey: 'MDdmMjM4ZjAtZGU3Ny00ODAzLTgwZGItNDJkMmY1MDE0MmIz', // process.env.ONESIGNAL_USER_AUTH_KEY,
        restApiKey: 'ODI4ODJiZWItMTU2OS00MDMwLThkZDItZDA5M2I0OTc0Njg1' // process.env.ONESIGNAL_REST_API_KEY
    });
    const client = new OneSignal.DefaultApi(configuration);
    console.log('client', client)
    const app = await client.getApp('60ad484a-94ab-41a8-85ba-cda28211ee30');
    console.log('app de onesignal', app)

    try {
        const notificationsFromDB = await notificationRepository.getAllNotifications();
        console.log('notificationsFromDB', notificationsFromDB)
        return {
            statusCode: StatusCodes.OK,
            body: notificationsFromDB
        }
    } catch (error) {
        logger.error({
            message: 'Error al obtener las notificaciones' + error.msg,
            error: error
        })
        return { 
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR, 
            body: error 
        };
    }
};
