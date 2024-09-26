import { Router } from "express";
import { getAllSubteams, getSubteamById } from "./subteams.controller.js";

export const subTeamsRouter = Router()

subTeamsRouter.get('/',
     getAllSubteams)
     
subTeamsRouter.get('/:id',
     getSubteamById)