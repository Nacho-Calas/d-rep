import Joi = require('joi');

const brandSchema = Joi.object().keys({
    supplierId: Joi.string().required(),
    name: Joi.string().required(),
    imageUrl: Joi.string().required(),
    active: Joi.boolean().required()
  });
  
export const uploadBrandsReqSchema = Joi.object({
    data: Joi.array().items(brandSchema).required(),
  });
  
