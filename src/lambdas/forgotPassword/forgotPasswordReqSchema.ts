import Joi = require('joi');

export const forgotPasswordSchema = Joi.object({
        userName: Joi.string().required()
      }).required()