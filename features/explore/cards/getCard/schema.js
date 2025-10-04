import mongoose from "mongoose";

const CardSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  tags: {
    type: [String],
    default: [],
  },
  imageUrl: {
    type: String,
    required: true,
  },
  priority: {
    type: Number,
    required: true,
  },
  created_at: {
    type: Date,
    required: true,
  },
  color: {
    type: String,
    required: false,
  },
});

export const CardModel = mongoose.model("Card", CardSchema);
