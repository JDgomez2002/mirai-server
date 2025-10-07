import mongoose from "mongoose";
const { Schema, Types } = mongoose;

const CourseSchema = new Schema({
  nombre: {
    type: String,
    required: true,
  },
  prerequisitos: [
    {
      type: Types.ObjectId,
      ref: "Course",
      required: true,
      default: [],
    },
  ],
});

export const CourseModel = mongoose.model("Course", CourseSchema);
