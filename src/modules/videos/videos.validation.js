import Joi from 'joi';
import { vidType } from '../../utils/common/enum.js';
import mongoose from 'mongoose';

export const videoValidationSchema = Joi.object({
    title: Joi.string()
      .trim()
      .required()
      .messages({
        'string.empty': 'Title is required',
        'any.required': 'Title is required',
      }),
    description: Joi.string()
      .trim()
      .required()
      .messages({
        'string.empty': 'Description is required',
        'any.required': 'Description is required',
      }),
    url: Joi.string()
      .uri()
      .required()
      .messages({
        'string.empty': 'URL is required',
        'string.uri': 'URL must be a valid URI',
        'any.required': 'URL is required',
      }),
    subteamId: Joi.string()
      .custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          return helpers.message('Subteam ID must be a valid ObjectId');
        }
        return value;
      })
      .required()
      .messages({
        'string.empty': 'Subteam ID is required',
        'any.required': 'Subteam ID is required',
      }),
    vidType: Joi.string()
      .valid(...Object.values(vidType))
      .required()
      .messages({
        'string.empty': 'Video type is required',
        'any.required': 'Video type is required',
        'any.only': `Video type must be one of ${Object.values(vidType).join(', ')}`,
      }),
  });