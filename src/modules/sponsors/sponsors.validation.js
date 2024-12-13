import Joi from 'joi';
import mongoose from 'mongoose';

export const sponsorsValidationSchema = Joi.object({
  name: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'Name is required',
      'any.required': 'Name is required'
    }),
  
  description: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'Description is required',
      'any.required': 'Description is required'
    }),
  
  image: Joi.object({
    secure_url: Joi.string()
      .uri()
      .required()
      .messages({
        'string.empty': 'Secure URL is required',
        'string.uri': 'Secure URL must be a valid URL',
        'any.required': 'Secure URL is required'
      }),
    public_id: Joi.string()
      .required()
      .messages({
        'string.empty': 'Public ID is required',
        'any.required': 'Public ID is required'
      })
  }),
  // Optional fields added from timestamps
  createdAt: Joi.date(),
  updatedAt: Joi.date()
});

// A specific validation schema for updating a sponsor
export const sponsorsUpdateValidationSchema = Joi.object({
  params: Joi.object({
    id: Joi.string()
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
    name: Joi.string()
      .trim()
      .min(2)
      .max(100)
      .optional()
      .messages({
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name cannot exceed 100 characters'
      }),

    description: Joi.string()
      .trim()
      .min(10)
      .max(500)
      .optional()
      .messages({
        'string.min': 'Description must be at least 10 characters',
        'string.max': 'Description cannot exceed 500 characters'
      }),

    image: Joi.object({
      secure_url: Joi.string()
        .required()
        .messages({
          'string.uri': 'Secure URL must be a valid URL',
          'any.required': 'Secure URL is required'
        }),
      public_id: Joi.string()
        .optional()
    }).optional()
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  }),
});

export const validateUpdateRequest = (req, res, next) => {
  const { error } = sponsorsUpdateValidationSchema.validate({
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
