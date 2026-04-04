import mongoose from "mongoose";
const { Schema } = mongoose;

const ReviewSchema = new Schema(
  {
    gigId: {
      type: String,
      required: true,
    },
    applicationId: {
      type: String,
      required: true,
    },
    reviewerId: {
      type: String,
      required: true,
    },
    revieweeId: {
      type: String,
      required: true,
    },
    reviewerRole: {
      type: String,
      enum: ["student", "shop"],
      required: true,
    },
    star: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: false,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// One review per side (student or shop) per application
ReviewSchema.index({ applicationId: 1, reviewerRole: 1 }, { unique: true });

export default mongoose.model("Review", ReviewSchema);
