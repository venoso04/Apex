import Joi from 'joi';
import mongoose from 'mongoose';

const teamValidationSchema = Joi.object({
  title: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'Team title cannot be empty',
      'any.required': 'Team title is required'
    }),
  
  description: Joi.string()
    .trim()
    .optional()
    .allow(null, '')
    .messages({
      'string.base': 'Description must be a string'
    }),
  
  head: Joi.string()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    })
    .optional()
    .messages({
      'any.invalid': 'Invalid head member ID'
    }),
  
  vice: Joi.string()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    })
    .optional()
    .messages({
      'any.invalid': 'Invalid vice member ID'
    }),
  
  images: Joi.array()
    .items(
      Joi.object({
        secure_url: Joi.string()
          .required()
          .messages({
            'string.empty': 'Secure URL cannot be empty',
            'string.uri': 'Invalid secure URL format',
            'any.required': 'Secure URL is required'
          }),
        
        public_id: Joi.string()
          .trim()
          .required()
          .messages({
            'string.empty': 'Public ID cannot be empty',
            'any.required': 'Public ID is required'
          })
      })
    )
    .messages({
      'array.base': 'Images must be an array'
    }),
  
//   totalMembers: Joi.number()
//     .integer()
//     .min(0)
//     .optional()
//     .default(0)
//     .messages({
//       'number.base': 'Total members must be a number',
//       'number.integer': 'Total members must be an integer',
//       'number.min': 'Total members cannot be negative'
//     }),
      // Optional fields added from timestamps
  createdAt: Joi.date(),
  updatedAt: Joi.date()
});

// Custom validation for MongoDB ObjectId
const objectIdValidator = (value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
    }
    return value;
};

// Define the validation schema
export const deleteTeamValidationSchema = Joi.object({
    teamId: Joi.string().custom(objectIdValidator, "ObjectId validation").required().messages({
        "string.base": "Team ID must be a string.",
        "string.empty": "Team ID cannot be empty.",
        "any.required": "Team ID is required.",
        "any.invalid": "Team ID must be a valid MongoDB ObjectId.",
    }),
});

export const updateTeamValidationSchema = Joi.object({
    params: Joi.object({
        teamId: Joi.string()
          .custom((value, helpers) => {
            // Consider adding a more explicit MongoDB ObjectId check
            if (!mongoose.Types.ObjectId.isValid(value)) {
              return helpers.error('any.invalid');
            }
            return value;
          })
          .required()
          .messages({
            'any.required': 'ID is required',
            'any.invalid': 'Invalid sponsor ID format'
          })
      }).required(),
    body: Joi.object({
        head: Joi.string()
        .custom((value, helpers) => {
          if (!mongoose.Types.ObjectId.isValid(value)) {
            return helpers.error('any.invalid');
          }
          return value;
        })
        .optional()
        .messages({
          'any.invalid': 'Invalid head member ID'
        }),
      
      vice: Joi.string()
        .custom((value, helpers) => {
          if (!mongoose.Types.ObjectId.isValid(value)) {
            return helpers.error('any.invalid');
          }
          return value;
        })
        .optional()
        .messages({
          'any.invalid': 'Invalid vice member ID'
        }),
    title: Joi.string()
        .trim()
        .optional()
        .messages({
        'string.empty': 'Team title cannot be empty.',
        'any.required': 'Team title is required.'
        }),

    description: Joi.string()
        .trim()
        .optional()
        .allow(null, '')
        .messages({
        'string.base': 'Description must be a string.'
        }),



    images: Joi.array()
        .items(
        Joi.object({
            secure_url: Joi.string()
            .required()
            .messages({
                'string.empty': 'Secure URL cannot be empty.',
                'string.uri': 'Invalid secure URL format.',
                'any.required': 'Secure URL is required.'
            }),

            public_id: Joi.string()
            .trim()
            .required()
            .messages({
                'string.empty': 'Public ID cannot be empty.',
                'any.required': 'Public ID is required.'
            })
        })
        )
        .optional()
        .messages({
        'array.base': 'Images must be an array of objects.'
        }),


}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  })
});

export const validateUpdateTeamRequest = (req, res, next) => {
    const { error } = updateTeamValidationSchema.validate({
      params: req.params,
      body: {
        ...req.body,
        // If a file is uploaded, add file information to the body
        ...(req.file ? { 
          image: {
            secure_url: req.file.path, 
            public_id: req.file.filename
          }
        } : {})
      }
    }, { abortEarly: false });
  
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        errors: errorMessages
      });
    }
  
    next();
  };

export default teamValidationSchema 
