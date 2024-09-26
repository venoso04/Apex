// authorization.middleware.js

import { asyncHandler } from "../utils/common/asyncHandler.js";

export const isAuthorized = (...roles) => {
  return asyncHandler(async (req, res, next) => {
    const userRole = req.member.role; // Use req.member.role

    // Check if the user's role is included in the provided roles
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        error: 'You are not authorized to perform this action.'
      });
    }

    return next();
  });
};