import Joi = require('joi');

export const generateAccesTokenReqSchema = Joi.object({
    refreshToken: Joi.string().required(),
}).required()