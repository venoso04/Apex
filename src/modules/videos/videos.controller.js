import { Video } from "../../../db/models/videos.model.js";
import { asyncHandler } from "../../utils/common/asyncHandler.js";


///////////// get all videos by enum 
export const getVideosByType = (type) => asyncHandler(async (req, res, next) => {
     const videos = await Video.find({ vidType: type });
     res.status(200).json(videos);
 });


 ////////////// get video by id
export const getVideoByIdEdu = asyncHandler(async (req, res, next) => {
     const { id } = req.params;
     const video = await Video.findOne({ _id: id, vidType: 'Educational' });
 
     if (!video) {
         return next(new Error('Video not found'));
     }
 
     // Perform role-based authorization for educational videos
     if (!['super','admin', 'member'].includes(req.member.role)) {
         return next(new Error('You are not authorized to view this educational video'));
     }
 
     res.status(200).json(video);
 });

  ////////////// get Intro  videos by id 
export const getVideoByIdIntro = asyncHandler(async (req, res, next) => {
     const { id } = req.params;
     const video = await Video.findOne({ _id: id, vidType: 'Intro' });

 
     if (!video) {
         return next(new Error('Video not found'));
     }
 
 
     res.status(200).json(video);
 });

   ////////////// get Competition  videos by id 
export const getVideoByIdCompetition = asyncHandler(async (req, res, next) => {
     const { id } = req.params;
     const video = await Video.findOne({ _id: id, vidType: 'Competition' });


     if (!video) {
         return next(new Error('Video not found'));
     }
 
 
     res.status(200).json(video);
 });
 
