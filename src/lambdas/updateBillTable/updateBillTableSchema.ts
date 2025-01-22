import Joi = require('joi');

export const updateBillTableSchema = Joi.object({
    billId: Joi.string()
}).required();