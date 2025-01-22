import Joi = require('joi');

export const confirmForgotPasswordSchema = Joi.object({
        userName: Joi.string().required(),
        verificationCode: Joi.string().required(),
        newPassword: Joi.string().required(),
      }).required()