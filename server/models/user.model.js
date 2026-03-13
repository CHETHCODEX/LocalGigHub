import mongoose from "mongoose";
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    username: {
      type: String,
      require: true,
      unique: true,
    },
    email: {
      type: String,
      require: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    img: {
      type: String, //store url
      required: false,
    },
    country: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: false,
    },
    desc: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      enum: ["student", "shop", "worker"], // worker = local unemployed people
      default: "student",
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified",
    },
    profileModerationStatus: {
      type: String,
      enum: ["approved", "pending_review"],
      default: "approved",
    },
    profileSafetyFlags: {
      type: [String],
      default: [],
    },
    blockedUsers: {
      type: [String],
      default: [],
    },
    // AI/ML Enhancement Fields
    skills: {
      type: [String],
      default: [],
    },
    resume: {
      type: String, // URL to uploaded resume or text content
      required: false,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
      address: {
        type: String,
        required: false,
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
    preferredCategories: {
      type: [String],
      default: [],
    },
    preferredAreas: {
      type: [
        {
          label: { type: String, required: true },
          city: { type: String, required: false },
          radiusKm: { type: Number, default: 10 },
          coordinates: {
            type: [Number],
            default: [0, 0],
          },
        },
      ],
      default: [],
    },
    notificationSettings: {
      nearbyGigAlerts: {
        type: Boolean,
        default: true,
      },
      preferredAreaAlerts: {
        type: Boolean,
        default: true,
      },
      maxAlertDistanceKm: {
        type: Number,
        default: 15,
      },
    },
    availability: {
      type: String,
      enum: ["full-time", "part-time", "flexible", "weekends"],
      default: "flexible",
    },
    experienceLevel: {
      type: String,
      enum: ["beginner", "intermediate", "experienced", "expert"],
      default: "beginner",
    },
    completedGigs: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    avgRating: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Geospatial index for location-based queries
userSchema.index({ "location.coordinates": "2dsphere" });

export default mongoose.model("user", userSchema);
