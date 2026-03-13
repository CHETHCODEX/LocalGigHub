import mongoose from "mongoose";
const { Schema } = mongoose;

const GigSchema = new Schema(
  {
    userId: {
      type: String,
      require: true,
    },
    title: {
      type: String,
      require: true,
    },
    desc: {
      type: String,
      require: true,
    },
    totalStars: {
      type: Number,
      default: 0,
    },
    starNumber: {
      type: Number,
      default: 0,
    },
    cat: {
      type: String,
      require: true,
    },
    price: {
      type: Number,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    // Geolocation for nearby matching
    geoLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
      city: {
        type: String,
        required: false,
      },
      pincode: {
        type: String,
        required: false,
      },
    },
    // Required skills for the gig
    requiredSkills: {
      type: [String],
      default: [],
    },
    // Experience level needed
    experienceRequired: {
      type: String,
      enum: ["beginner", "intermediate", "experienced", "expert", "any"],
      default: "any",
    },
    // AI-suggested price range
    suggestedPriceRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
    // Demand score calculated by AI
    demandScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    duration: {
      type: String,
      required: true,
    },
    cover: {
      type: String,
      required: false,
    },
    images: {
      type: [String],
      required: false,
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "completed"],
      default: "open",
    },
    moderationStatus: {
      type: String,
      enum: ["approved", "pending_review", "rejected"],
      default: "approved",
    },
    moderationReason: {
      type: String,
      required: false,
    },
    safetyFlags: {
      type: [String],
      default: [],
    },
    reports: {
      type: [
        {
          reporterId: { type: String, required: true },
          reason: { type: String, required: true },
          details: { type: String, required: false },
          status: {
            type: String,
            enum: ["open", "reviewed", "ignored"],
            default: "open",
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },
    sales: {
      type: Number,
      default: 0,
    },
    // Number of applicants
    applicantCount: {
      type: Number,
      default: 0,
    },
    // Views count for demand analysis
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Geospatial index for location-based queries
GigSchema.index({ "geoLocation.coordinates": "2dsphere" });

export default mongoose.model("Gig", GigSchema);
