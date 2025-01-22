import Joi = require('joi');
import { Gender } from '../../common/enum';

export const updateUserReqSchema = Joi.object({
        email: Joi.string(),
        nameAndLastName: Joi.string(),
        phoneNumber: Joi.object().keys({
            code: Joi.string(),
            number: Joi.number()
        }),
        gender: Joi.string().valid(...Object.values(Gender)),
        birthdate: Joi.string(),
        localityCountry: Joi.string(),
        localityState: Joi.string(),
        localityCity: Joi.string(),
        localityNeighborhood: Joi.string(),
        family: Joi.object().keys ({
            adults: Joi.number(),
            kids: Joi.number(),
            birthdateKids: Joi.array().items(Joi.string())
        }),
        dni: Joi.number(),
      }).required();
  
