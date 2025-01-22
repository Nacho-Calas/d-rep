import Joi = require('joi');
  
export const uploadBillReqSchema =  Joi.binary().encoding('base64').required();