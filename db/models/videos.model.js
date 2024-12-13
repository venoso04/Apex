import { Schema, model } from 'mongoose';
import { vidType } from '../../src/utils/common/enum.js';

const videoSchema = new Schema({
     title: {
          type: String,
          required: true
     },
     description: {
          type: String,
          required: true
     },
     url: {
          type: String,
          required: true
     },
     subteamId: {
          type: Schema.Types.ObjectId,
          ref: 'SubTeam',
          required: true
     },
     vidType: {
          type: String,
          enum: Object.values(vidType)
     }

     },{timestamps: true});

export const Video = model("Video", videoSchema)