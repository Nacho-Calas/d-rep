import Joi = require('joi');

export const saveNotificationReqSchema = Joi.object({
    notificationId: Joi.string().required(),
    title: Joi.string().required(),
    body: Joi.string().required(),
}).required()