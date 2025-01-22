import Joi = require('joi');

export const createUserReqSchema = Joi.object({
        userName: Joi.string().required(),
        password: Joi.string().required()
      }).required()
  
