import { Schema, model } from 'mongoose';


const teamSchema = new Schema({
     title: {
          type: String
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
      

   }, { timestamps: true });


export const Team = model('Team', teamSchema);

