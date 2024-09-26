// src\modules\subteams\subteams.validation.js
import Joi from 'joi';
// import { subTeam } from '../../utils/common/enum.js';

// Joi schema for subteam validation
export const subteamValidationSchema = Joi.object({
  title: Joi.string()
    .required()
    .trim()
    .messages({
      'any.required': 'Subteam title is required.',
      'string.empty': 'Subteam title cannot be empty.'
    }),
  
  description: Joi.string()
    .allow(null, '')
    .max(500)
    .messages({
      'string.max': 'Description must not exceed 500 characters.'
    }),

  leader: Joi.string()
    .optional()
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Leader ID must be a valid ObjectId.'
    })
});