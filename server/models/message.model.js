import mongoose from "mongoose";

const { Schema } = mongoose;

const MessageSchema = new Schema(
  {
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    senderId: {
      type: String,
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    readBy: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Message", MessageSchema);
