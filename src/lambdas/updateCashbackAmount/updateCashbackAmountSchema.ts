import Joi = require('joi');

export const updateCashbackAmountSchema = Joi.object({
    userId: Joi.string().required(),
    cashbackAmount: Joi.number().required()
}).required();