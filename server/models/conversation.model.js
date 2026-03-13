import mongoose from "mongoose";

const { Schema } = mongoose;

const ConversationSchema = new Schema(
  {
    gigId: {
      type: String,
      required: true,
      index: true,
    },
    shopId: {
      type: String,
      required: true,
      index: true,
    },
    studentId: {
      type: String,
      required: true,
      index: true,
    },
    lastMessage: {
      type: String,
      default: "",
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

ConversationSchema.index(
  { gigId: 1, shopId: 1, studentId: 1 },
  { unique: true },
);

export default mongoose.model("Conversation", ConversationSchema);
