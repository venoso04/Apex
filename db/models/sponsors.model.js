import { Schema, model } from 'mongoose';

const sponsorsSchema = new Schema({
  name:{
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  image:{
    type: Object,
    secure_url:{type:String, required:true},
    public_id:{type:String, required:true, unique:true,},
},
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  }
}, { timestamps: true });

export const Sponsors = model('Sponsors', sponsorsSchema);