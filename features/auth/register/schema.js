import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  clerk_id: {
    type: String,
    required: true,
    unique: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  role: {
    type: String,
    required: true,
    enum: ["admin", "teacher", "director", "publisher", "student"],
    default: "student",
  },
});

export const UserModel = mongoose.model("User", UserSchema);
