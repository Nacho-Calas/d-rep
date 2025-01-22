import Joi = require('joi');

enum Reputation {
    BLACK = 'BLACK',
    PLATINUM = 'PLATINUM',
    GOLD = 'GOLD'
}

export const uploadSupplierReqSchema = Joi.object({
    data: Joi.object().keys({
        name: Joi.string().required(),
        reputation: Joi.string().valid(...Object.values(Reputation)).required(),
        email: Joi.string(),
        phoneNumber: Joi.number(),
        imageUrl: Joi.string(),
        active: Joi.boolean().required()
      }).required()
  });
  
