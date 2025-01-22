import Joi = require('joi');

enum PromotionType {
    BYUNIT = 'BYUNIT',
    BYBRAND = 'BYBRAND'
    //se pueden ir sumando mas tipos de promociones
}

const promotionSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  type: Joi.string().valid(...Object.values(PromotionType)).required(),
  amount: Joi.number().required(),
  listOfProducts: Joi.array().items(Joi.string()).required(),
  brandID: Joi.string().required(),
  supplierID: Joi.string().required(),
});

export const uploadPromotionsReqSchema = Joi.object({
  data: Joi.array().items(promotionSchema),
});