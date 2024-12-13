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

