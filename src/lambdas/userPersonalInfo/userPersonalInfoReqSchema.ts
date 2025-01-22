import Joi = require('joi');
import { Gender } from '../../common/enum';

export const userPersonalInfoReqSchema = Joi.object({
    username: Joi.string().required(),
    nameAndLastName: Joi.string().required(),
    birthdate: Joi.string().required(),
    phoneNumber: Joi.object().keys({
        code: Joi.string().required(),
        number: Joi.number().required()
    }),
    dni: Joi.number().required(),
    localityCountry: Joi.string().required(),
    localityState: Joi.string().required(),
    localityCity: Joi.string().required(),
    localityNeighborhood: Joi.string().required(),
    gender: Joi.string().valid(...Object.values(Gender)).required()
}).required();