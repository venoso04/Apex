import { Schema, model } from 'mongoose';
// import { subTeam } from '../../src/utils/common/enum.js';

const subteamSchema = new Schema({
     title: {
          type: String
        },
     description: {
       type: String,
       required: false,
     },
     leader:{
       type: Schema.Types.ObjectId,
       ref: 'Member'
     },
     teamId: {
          type: Number,
          unique: true
        },
      totalMembers: {
        type: Number,
        default: 0
      }
      

   }, { timestamps: true });

// Pre-save hook to generate sequential teamId
subteamSchema.pre('save', async function(next) {
     if (this.isNew) {
       try {
         const lastTeam = await this.constructor.findOne({}, {}, { sort: { 'teamId' : -1 } });
         this.teamId = lastTeam && lastTeam.teamId ? lastTeam.teamId + 1 : 1;
       } catch (error) {
         console.error('Error in pre-save hook:', error);
         return next(error);
       }
     }
     next();
   });

export const SubTeam = model("SubTeam", subteamSchema);
