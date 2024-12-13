// validation.middleware.js

import { Types } from "mongoose";
import Joi from 'joi';

export const validation = (schema) => {
  return (req, res, next) => {
    const data = { ...req.body, ...req.params, ...req.query };
    const validationResault = schema.validate(data, { abortEarly: false });
    if (validationResault.error) {
      const errorMessages = validationResault.error.details.map((errObj) => {
        return errObj.message;
      });
      return next(new Error(errorMessages), { cause: 400 });
    }
    return next();
  };
};

export const validationSpecific = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = req[source]; // Validate only the specified part of the request
    const validationResult = schema.validate(data, { abortEarly: false });
    if (validationResult.error) {
      const errorMessages = validationResult.error.details.map((errObj) => errObj.message);
      return next(new Error(errorMessages.join(', ')), { cause: 400 });
    }
    next();
  };
};
// Joi schema for validating allowed members
export const allowedMembersSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Email must be a valid email address',
      'string.empty': 'Email is required'
    }),
  // joinedAt is not included because it's handled by the database
});

export const isValidObjectId = (value, helper) =>
  Types.ObjectId.isValid(value) ? true : helper.message("invalid object id");
