import Joi = require('joi');
  
export const getProductsWithPromotionsReqSchema = Joi.object().keys({
      pageNumber: Joi.number().required(),
      pageSize: Joi.number().required(),
      category: Joi.string(),
      keyword: Joi.string(),
      sortingSeed: Joi.string()
    });