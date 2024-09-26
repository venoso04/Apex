import { Router } from "express";
import { isAuthenticated } from "../../middleware/authentication.middleware.js";
import { isAuthorized } from "../../middleware/authorization.middleware.js";
import { systemRoles } from "../../utils/common/enum.js";
import { getVideoByIdCompetition, getVideoByIdEdu, getVideoByIdIntro, getVideosByType } from "./videos.controller.js";

export const videosRouter = Router()

videosRouter.get('/educational/:id',
     isAuthenticated,
     isAuthorized(systemRoles.ADMIN,systemRoles.MEMBER,systemRoles.SUPER),
     getVideoByIdEdu
)

videosRouter.get('/intro/:id',
     getVideoByIdIntro
)

videosRouter.get('/competition/:id',
     getVideoByIdCompetition
)

videosRouter.get('/educational', 
     isAuthenticated,
     isAuthorized(systemRoles.ADMIN,systemRoles.MEMBER,systemRoles.SUPER),
     getVideosByType('Educational'));
 
 videosRouter.get('/intro',  
     getVideosByType('Intro'));
 
 videosRouter.get('/competition',  
     getVideosByType('Competition'));

