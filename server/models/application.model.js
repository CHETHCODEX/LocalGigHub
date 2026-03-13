import mongoose from 'mongoose';
const { Schema } = mongoose;

const ApplicationSchema = new Schema({
  gigId: {
    type: String,
    required: true,
  },
  studentId: {
    type: String,
    required: true,
  },
  shopId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed'],
    default: 'pending',
  },
  coverLetter: {
    type: String,
    required: false,
  },
}, {
  timestamps: true
});

export default mongoose.model("Application", ApplicationSchema);
