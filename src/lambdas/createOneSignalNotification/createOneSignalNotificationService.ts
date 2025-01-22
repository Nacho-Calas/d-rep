import * as OneSignal from '@onesignal/node-onesignal';

export const createOneSignalNotificationService = async () => {
    const configuration = OneSignal.createConfiguration({
        userAuthKey: 'MDdmMjM4ZjAtZGU3Ny00ODAzLTgwZGItNDJkMmY1MDE0MmIz', // process.env.ONESIGNAL_USER_AUTH_KEY,
        restApiKey: 'ODI4ODJiZWItMTU2OS00MDMwLThkZDItZDA5M2I0OTc0Njg1' // process.env.ONESIGNAL_REST_API_KEY
    });
    const client = new OneSignal.DefaultApi(configuration);
    console.log('client', client)

    const app = await client.getApp('60ad484a-94ab-41a8-85ba-cda28211ee30');
    console.log('app de onesignal', app)

    const notification = new OneSignal.Notification();
    console.log('notification previo al contenido', notification)
    notification.app_id = app.id;
    notification.contents = {
        en: `
        ¡Hello {{name}}!

        We tell you that the scanned ticket was successfully processed, so you got a total of {{sumcashbackhistory}} chances for the draw.

        These accumulated chances already include 500 EXTRA chances, just for having scanned the ticket!!!

        If you have any questions or queries, please contact us at hola@deyappa.com

        ¡Keep saving with deyappa!
        `
    };
    notification.headings = { 
        en: 'Deyappa - Processing your Ticket' 
    };
    notification.included_segments = ['Subscribed Users'];
    // notification.data = { url: 'https://www.google.com' };

    console.log('notification luego del contenido', notification);

    try {
        const response = await client.createNotification(notification);
        console.log('response', response);
        return { statusCode: 200, body: response };
    } catch (error) {
        return { statusCode: 500, body: error };
    }
};