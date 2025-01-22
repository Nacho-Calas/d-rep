import Joi = require('joi');

export const forceResetPasswordSchema = Joi.object({
  userName: Joi.string().required(),
  password: Joi.string().required(),
}).required()