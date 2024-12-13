
import { Schema, model } from 'mongoose';


const subteamSchema = new Schema({
     title: {
          type: String,
          unique: true,
          required: true
        },
     description: {
       type: String,
       required: false,
     },
     head:{
      type: Schema.Types.ObjectId,
      ref: 'Member'
    },
    vice:{
      type: Schema.Types.ObjectId,
      ref: 'Member'
    },

      images:[
        {
            type: Object,
            secure_url:{type:String, required:true},
            public_id:{type:String, required:true, unique:true},
        }
    ],
    totalMembers: {
      type: Number,
      default: 0
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true
    },
      

   }, { timestamps: true });


export const SubTeam = model("SubTeam", subteamSchema);
