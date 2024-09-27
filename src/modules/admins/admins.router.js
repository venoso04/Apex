import { Router } from "express";
import { addAllowedMember, addSubteam, deleteMemberById, deleteSubteamById, deleteVideoById, setMemberSubteam,addVideo, addMemberRole, removeMemberRole, setSubteamLeader } from "./admins.controller.js";
import {allowedMembersSchema, validation } from "../../middleware/validation.middleware.js";
import { subteamValidationSchema } from "../subteams/subteams.validation.js";
import { isAuthenticated } from "../../middleware/authentication.middleware.js";
import { isAuthorized } from "../../middleware/authorization.middleware.js";
import { systemRoles } from "../../utils/common/enum.js";
import { videoValidationSchema } from "../videos/videos.validation.js";


export const adminsRouter = Router()

adminsRouter.post('/add-members',
     isAuthenticated,
     isAuthorized(systemRoles.ADMIN,systemRoles.SUPER),
     validation(allowedMembersSchema),
     addAllowedMember)

adminsRouter.post('/add-subteam',
     isAuthenticated,
     isAuthorized(systemRoles.ADMIN,systemRoles.SUPER),
     validation(subteamValidationSchema),
     addSubteam)

adminsRouter.delete('/delete-subteam/:id',
     isAuthenticated,
     isAuthorized(systemRoles.ADMIN,systemRoles.SUPER),
     deleteSubteamById)

adminsRouter.patch('/set-subteam-leader',
     isAuthenticated,
     isAuthorized(systemRoles.ADMIN,systemRoles.SUPER),
     setSubteamLeader)

adminsRouter.patch('/update-member-subteam/:memberId',
     isAuthenticated,
     isAuthorized(systemRoles.ADMIN,systemRoles.SUPER),
     setMemberSubteam
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