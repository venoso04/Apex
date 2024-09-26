import { Schema, model } from 'mongoose';

const allowedMembersSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

export const allowedMembers = model("allowedMembers", allowedMembersSchema);