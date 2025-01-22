import Joi = require('joi');
import { Category } from '../../common/enum'

const productSchema = Joi.object().keys({
  supplierId: Joi.string().required(),
  name: Joi.string().required(),
  brandId: Joi.string().required(),
  description: Joi.string().required(),
  category: Joi.string().valid(...Object.values(Category)).required(),
  imageUrl: Joi.string().required(),
  weight: Joi.number().required(),
  measure: Joi.string().required(),
  active: Joi.boolean().required(),
});

export const uploadProductsReqSchema = Joi.object({
  data: Joi.array().items(productSchema).required(),
});

