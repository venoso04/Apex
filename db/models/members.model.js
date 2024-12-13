import bcrypt from 'bcryptjs'
import { Schema, model } from 'mongoose';
import {  systemRoles } from '../../src/utils/common/enum.js';
import { ObjectId } from 'bson';

const memberSchema = new Schema({
  memberId: {
    type: Number,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    validate: {
      validator: function(v) {
        return /\d/.test(v) && /[a-zA-Z]/.test(v);
      },
      message: props => `Password must contain at least one number and one letter`
    }
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  verifyEmail: {
    type: Boolean,
    default: false
  },
  forgetCode: String,
  role: {
    type: String,
    enum: Object.values(systemRoles), 
    default: systemRoles.MEMBER
  },
  profilePicture:{
    secure_url : {
      type : String,
      default : null
    },
    public_id:{
      type: String,
      default : null
    }
  },
  isDeleted: {
    type: Boolean,
    default: false
  },

  phone: {
    type: String,
    validate: {
      validator: function(v) {
        return /\d{10,}/.test(v);
      },
      message: props => `${props.value} is not a valid phone number`
    },
    unique:true
  },
  subTeamId:{
    type:ObjectId,
    ref:("SubTeam"),

    },
  teamId:{
    type:ObjectId,
    ref:("Team"),

  },
  emailUpdateCode: String,
  pendingEmail: String,
  lastEmailSentAt: { type: Date, default: null }
}, { timestamps: true });

// Pre-save hook to generate sequential memberId
memberSchema.pre('save', async function(next) {
  if (this.isNew) {
    const lastMember = await this.constructor.findOne({}, {}, { sort: { 'memberId' : -1 } });
    this.memberId = lastMember && lastMember.memberId ? lastMember.memberId + 1 : 1;
  }
  next();
});

// Index for faster queries
memberSchema.index({ email: 1, memberId: 1 });

// Virtual for full name
memberSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save hook to hash password
memberSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

export const Member = model("Member", memberSchema);


