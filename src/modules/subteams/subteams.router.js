import { Router } from "express";
import { multerMiddleHost } from "../../middleware/multer.middleware.js";
import { isAuthenticated } from "../../middleware/authentication.middleware.js";
import { isAuthorized } from "../../middleware/authorization.middleware.js";
import { validation } from "../../middleware/validation.middleware.js";
import { systemRoles } from "../../utils/common/enum.js";
import { allowedExtensions } from "../../utils/allowedExtensions.js";
import {deleteSubTeamValidationSchema, profilePictureValidationSchema, subTeamValidationSchema, updateSubTeamValidationSchema, validateRequest} from "./subteams.validation.js";
import { addSubTeam, deleteSubTeam, getAllmembersProfilePic, getAllSubTeams, getSubTeamById, updateSubTeam} from "./subteams.controller.js";


export const subTeamsRouter = Router();

// Create Sub Team Route
subTeamsRouter.post(
    "/create-subteam/team/:teamId",
    isAuthenticated,
    isAuthorized(systemRoles.ADMIN, systemRoles.SUPER),
    multerMiddleHost(allowedExtensions.image).array("images"),
    validateRequest(subTeamValidationSchema),
    addSubTeam
);

// Route to update a subteam
subTeamsRouter.put('/update-subteam/:subTeamId',
     isAuthenticated,
     isAuthorized(systemRoles.ADMIN, systemRoles.SUPER),
     multerMiddleHost(allowedExtensions.image).array("images"),
     validateRequest(updateSubTeamValidationSchema),
     updateSubTeam);

// Route to delete a subteam
subTeamsRouter.delete('/delete-subteam/:subTeamId',
     isAuthenticated,
     isAuthorized(systemRoles.ADMIN, systemRoles.SUPER),
     validation(deleteSubTeamValidationSchema),
     deleteSubTeam);

// Get all subteams
subTeamsRouter.get(
     '/all-subteams',
      getAllSubTeams);

// Get subteam by ID
subTeamsRouter.get(
     '/subteam/:subTeamId',
     validation(deleteSubTeamValidationSchema),
     getSubTeamById);

subTeamsRouter.get(
     '/members/team/:teamId/subteam/:subTeamId',
     validation(profilePictureValidationSchema),
     getAllmembersProfilePic);
     

export default subTeamsRouter;

