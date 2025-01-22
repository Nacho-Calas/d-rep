import Joi = require('joi');

export const authorizeUserReqSchema = Joi.object({
        userName: Joi.string().required(),
        password: Joi.string().required()
      }).required()