import { multerMiddleHost } from "../../middleware/multer.middleware.js";
import { isAuthenticated } from "../../middleware/authentication.middleware.js";
import { isAuthorized } from "../../middleware/authorization.middleware.js";
import { validation } from "../../middleware/validation.middleware.js";
import { systemRoles } from "../../utils/common/enum.js";
import teamValidationSchema, { deleteTeamValidationSchema, updateTeamValidationSchema, validateUpdateTeamRequest } from "./teams.validation.js";
import { allowedExtensions } from "../../utils/allowedExtensions.js";
import { addTeam, deleteTeam, getAllTeams, getTeamById, updateTeam } from "./teams.controller.js";
import { Router } from "express";

export const teamsRouter = Router()

teamsRouter.post(
    "/create-team",
    isAuthenticated,
    isAuthorized(systemRoles.ADMIN,systemRoles.SUPER),
    multerMiddleHost(allowedExtensions.image).array("images"),
    validation(teamValidationSchema)
    ,addTeam);


teamsRouter.delete(
    "/delete-team/:teamId",
    isAuthenticated,
    isAuthorized(systemRoles.ADMIN,systemRoles.SUPER),
    validation(deleteTeamValidationSchema),
    deleteTeam);

teamsRouter.patch(
    "/update-team/:teamId",
    isAuthenticated,
    isAuthorized(systemRoles.ADMIN,systemRoles.SUPER),
    multerMiddleHost(allowedExtensions.image).array("images"),
    validateUpdateTeamRequest,
    updateTeam);

// Get all teams
teamsRouter.get(
    "/all-teams",
    getAllTeams
  );

// Get team by ID
teamsRouter.get(
    "/team/:teamId",
    validation(deleteTeamValidationSchema),
    getTeamById
  );