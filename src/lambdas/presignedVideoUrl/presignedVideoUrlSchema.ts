import Joi = require('joi');
  
export const presignedVideoUrlReqSchema = Joi.object().keys({
      contentType: Joi.string().required(),
    }).required();