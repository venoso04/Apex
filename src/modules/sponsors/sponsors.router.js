import { Router } from "express";
import { createSponsor, deleteSponsor, getAllSponsors, getSponsorById, updateSponsor } from "./sponsors.controller.js";
import { isAuthenticated } from "../../middleware/authentication.middleware.js";
import { multerMiddleHost } from "../../middleware/multer.middleware.js";
import { allowedExtensions } from "../../utils/allowedExtensions.js";
import { sponsorsValidationSchema, validateUpdateRequest } from "./sponsors.validation.js";
import { isAuthorized } from "../../middleware/authorization.middleware.js";
import { systemRoles } from "../../utils/common/enum.js";
import { validation } from "../../middleware/validation.middleware.js";

export const sponsorsRouter = Router()

sponsorsRouter.post(
    "/create-sponsor",
    isAuthenticated,
    isAuthorized(systemRoles.ADMIN,systemRoles.SUPER),
    multerMiddleHost(allowedExtensions.image).single("image"),
    validation(sponsorsValidationSchema)
    ,createSponsor);


sponsorsRouter.put(
  "/update-sponsor/:id",
  isAuthenticated,
  isAuthorized(systemRoles.ADMIN, systemRoles.SUPER),
  multerMiddleHost(allowedExtensions.image).single("image"),
  validateUpdateRequest,
  updateSponsor
);

sponsorsRouter.delete(
    "/delete-sponsor/:id",
    isAuthenticated,
    isAuthorized(systemRoles.ADMIN, systemRoles.SUPER),
    deleteSponsor
  );

sponsorsRouter.get(
    '/all-sponsors',
    getAllSponsors)

sponsorsRouter.get(
    '/get-sponsor/:id',
    getSponsorById)

