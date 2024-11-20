import { Schema, model } from 'mongoose';

const gallerySchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true  
  },
  image_url: {
     type: String,
     required: true
    },
  alt_text: {
     type: String,
     default: "" 
    },
    category: {
    type: String,
    enum: ['cars', 'competitions', 'events', 'teams', 'subTeams'],
    required : true
  },
  team: {
    type: String,
    enum: ['Operation', 'Shell', 'Formula', 'Ever'],
  },
  subTeam: {
    type: String,
    enum: [
      'Vehicle Dynamics',
      'Frame',
      'Power Train',
      'Drive Line',
      'Electrical',
      'Embedded Systems',
      'Autonomous',
      'Cost and Manufacturing',
      'Media And Marketing',
      'Business Plan',
      'External Relations',
      'CS',
    ],
  },
  priority: {
    type: Number,
    default: 0, // Helps in sorting images for sliders or featured galleries
  },
  isHighlighted: {
    type: Boolean,
    default: false, // Used to mark items for special display (e.g. homepage slider)
  },
  uploaded_by: { type: Schema.Types.ObjectId, ref: "User" }
  
},{timestamps : true});

const Gallery = model("Gallery", gallerySchema);
export default Gallery;
