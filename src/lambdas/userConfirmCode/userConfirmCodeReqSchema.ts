import Joi = require('joi');

export const userConfirmCodeReqSchema = Joi.object({
        userName: Joi.string().required(),
        code: Joi.string().required()
      }).required()
  
