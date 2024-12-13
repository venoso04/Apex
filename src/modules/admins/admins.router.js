import { Router } from "express";
import { addAllowedMember,  deleteMemberById,  deleteVideoById, setMemberSubteam,addVideo, addMemberRole, removeMemberRole,  setMemberTeam, getAllmembers } from "./admins.controller.js";
import {allowedMembersSchema, validation } from "../../middleware/validation.middleware.js";
import { isAuthenticated } from "../../middleware/authentication.middleware.js";
import { isAuthorized } from "../../middleware/authorization.middleware.js";
import { systemRoles } from "../../utils/common/enum.js";
import { videoValidationSchema } from "../videos/videos.validation.js";
import { deleteSubTeamValidationSchema } from "../subteams/subteams.validation.js";


export const adminsRouter = Router()

adminsRouter.post('/add-members',
     isAuthenticated,
     isAuthorized(systemRoles.ADMIN,systemRoles.SUPER),
     validation(allowedMembersSchema),
     addAllowedMember)


adminsRouter.patch('/set-member-team/:id',
     isAuthenticated,
     isAuthorized(systemRoles.ADMIN,systemRoles.SUPER),
     setMemberTeam
)

adminsRouter.patch('/set-member-subteam/:id',
     isAuthenticated,
     isAuthorized(systemRoles.ADMIN,systemRoles.SUPER),
     setMemberSubteam
)
adminsRouter.get('/all-members',
     isAuthenticated,
     isAuthorized(systemRoles.ADMIN,systemRoles.SUPER),
     getAllmembers
)
adminsRouter.delete('/delete-member/:id',
     isAuthenticated,
     isAuthorized(systemRoles.ADMIN,systemRoles.SUPER),
     deleteMemberById
)
adminsRouter.post('/add-video',
     isAuthenticated,
     isAuthorized(systemRoles.ADMIN,systemRoles.SUPER), 
     validation(videoValidationSchema),
     addVideo);

adminsRouter.delete('/delete-video/:id',
     isAuthenticated,
     isAuthorized(systemRoles.ADMIN,systemRoles.SUPER), 
     deleteVideoById);

adminsRouter.post('/add-admin',
     isAuthenticated,
     isAuthorized(systemRoles.SUPER), 
     addMemberRole);

adminsRouter.post('/remove-admin',
     isAuthenticated,
     isAuthorized(systemRoles.SUPER), 
     removeMemberRole);