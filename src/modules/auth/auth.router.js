import { Router } from "express";
import { signUp, login, verifyAccount, resetPassword, sendForgetCode, updatePassword, logout, updateEmail, verifyEmailUpdate, resendVerificationEmail } from './auth.controller.js';
// import { isAuthorized } from '../../middleware/authorization.middleware.js';
import { validation } from '../../middleware/validation.middleware.js';
// import { isAuthenticated } from "../../middleware/authentication.middleware.js";
import { forgetCodeSchema, loginSchema, resetPasswordSchema, signUpSchema, updateEmailSchema, updatePasswordSchema, verifyUpdateEmailSchema } from "./auth.validation.js";
import { isAuthenticated } from "../../middleware/authentication.middleware.js";
import { resendEmailLimiter } from "../../middleware/rateLimiter.middleware.js";
import { multerMiddleHost } from "../../middleware/multer.middleware.js";
import { allowedExtensions } from "../../utils/allowedExtensions.js";


const authRouter = Router();


// sign up
authRouter.post(
     '/sign-up',
     validation(signUpSchema), 
     signUp);

// verify account
authRouter.get(
     '/verify-account',
     verifyAccount)

// resend verification email
authRouter.post(
     '/resend-verify-email',
     resendEmailLimiter,
     resendVerificationEmail
)

// login
authRouter.post(
     '/log-in', 
     validation(loginSchema), 
     login);

// Logout
authRouter.post(
     "/log-out", 
     isAuthenticated,
     logout);

// send forget code
authRouter.patch(
     "/forget-code",
     isAuthenticated,
     resendEmailLimiter,
     validation(forgetCodeSchema),
     sendForgetCode
        );
        
//reset password
authRouter.patch(
     "/reset-password",
     isAuthenticated,
     validation(resetPasswordSchema),
     resetPassword
   );


// Update password
authRouter.patch(
     "/update-password",
     isAuthenticated,
     validation(updatePasswordSchema),
     updatePassword
   );

   
// Route to initiate email update process
authRouter.post('/update-email',
     resendEmailLimiter,
     validation(updateEmailSchema),
     isAuthenticated,
     updateEmail);

// Route to verify and complete email update
authRouter.post('/verify-email-update',
     isAuthenticated,
     validation(verifyUpdateEmailSchema),
     verifyEmailUpdate);

export default authRouter