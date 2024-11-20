// authentication.middleware.js
import { Member } from "../../db/models/members.model.js";
import { Token } from "../../db/models/token.model.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/common/asyncHandler.js";

export const isAuthenticated = asyncHandler(async (req, res, next) => {
  let token = req.headers["token"];
  
  if (!token || !token.startsWith(process.env.BEARER_KEY))
    return next(new Error("valid token is required !"));
  token = token.split(process.env.BEARER_KEY)[1];
  
  const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
  if (!decoded) return next(new Error("invalid token!"));
  const tokenDB = await Token.findOne({ token, isValid: true });
  if (!tokenDB) return next(new Error("token expired!"));
  const member = await Member.findOne({ email: decoded.email });
  if (!member) return next(new Error("Member not found"));
  req.member = member;
  req.token = token;
  return next();
});

// export const isAuthenticated = asyncHandler(async (req, res, next) => {
//   // Get the token from the Authorization header
//   let authHeader = req.headers["authorization"];
//   if (!authHeader || !authHeader.startsWith(`${process.env.BEARER_KEY} `)) {
//     return next(new Error("A valid token is required!"));
//   }

//   // Extract the token after 'Bearer '
//   let token = authHeader.split(`${process.env.BEARER_KEY} `)[1];

//   try {
//     // Verify JWT token
//     const decoded = jwt.verify(token, process.env.TOKEN_SECRET);

//     // Check if the token exists and is valid in the database
//     const tokenDB = await Token.findOne({ token, isValid: true });
//     if (!tokenDB) return next(new Error("Token expired or invalid!"));

//     // Find the member based on the email from the token payload
//     const member = await Member.findOne({ email: decoded.email });
//     if (!member) return next(new Error("Member not found!"));

//     // Attach member and token to the request object for use in further middleware
//     req.member = member;
//     req.token = token;

//     return next(); // Proceed to the next middleware
//   } catch (error) {
//     return next(new Error("Invalid token!")); // JWT token verification failed
//   }
// });
