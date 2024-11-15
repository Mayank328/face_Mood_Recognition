import mongoose from 'mongoose';

const PersonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  images: [{
    imageUrl: String,
    mood: String,
    timestamp: Date,
    descriptor: [Number]  // Face descriptor array
  }]
});

export default mongoose.models.Person || mongoose.model('Person', PersonSchema);