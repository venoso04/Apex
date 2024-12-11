import Joi from 'joi';
import { isValidObjectId } from '../../middleware/validation.middleware.js';



export const signUpSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    phone: Joi.string().pattern(/^\d{11}$/).required(),
    image : Joi.allow()
});

export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

export const updateProfileSchema = Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    phone: Joi.string().pattern(/^\d{10}$/)
});



//activateAccount
export const verifyEmailSchema = Joi
  .object({
    token: Joi.string().required(),
  })
  .required();

  // forget code

export const forgetCodeSchema = Joi
.object({
  email: Joi.string().email().required(),
})
.required();
// reset password

export const resetPasswordSchema = Joi
.object({
  email: Joi.string().email().required(),
  forgetCode: Joi.string().length(5).required(),
  password: Joi.string().required().pattern(new RegExp(`^.{8,}$`)),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
})
.required();
// Update password
export const updatePasswordSchema = Joi
.object({
  email: Joi.string().email().required(),
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().required().pattern(new RegExp(`^.{8,}$`)),
  confirmPassword: Joi.string().valid(Joi.ref("newPassword")).required(),
})
.required();

export const softDeleteUser = Joi
  .object({
    userId: Joi.string().custom(isValidObjectId),
  })
  .required();

  export const updateEmailSchema = Joi
  .object({
    currentEmail: Joi.string().email().required(),
    newEmail: Joi.string().email().required()
  })
  export const verifyUpdateEmailSchema = Joi
  .object({
    email: Joi.string().email().required(),
    verificationCode: Joi.string().required()
    
  })