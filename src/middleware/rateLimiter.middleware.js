import rateLimit from 'express-rate-limit';

//  rate-limiting for the resend verification email API
export const resendEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 3, // Limit each IP to 3 requests per window
  message: 'You have exceeded the number of allowed email requests within 15 minutes. Please try again after some time.'
});


