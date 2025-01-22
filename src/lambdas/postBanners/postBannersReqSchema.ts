import Joi = require('joi');

const bannerSchema = Joi.object().keys({
    index: Joi.number().required(),
    imageUrl: Joi.string().required()
  });
  
export const uploadBannersReqSchema = Joi.array().items(bannerSchema).required();
  
