import Joi = require('joi');

export const resendCodeReqSchema = Joi.object({
        userName: Joi.string().required()
      }).required()
  
