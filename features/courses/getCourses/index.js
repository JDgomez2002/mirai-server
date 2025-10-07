import mongoose from "mongoose";
import { CourseModel } from "./schema.js";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.URI;

if (!uri) {
  throw new Error("URI not found in the environment");
}

export const handler = async (event, context) => {
  try {
    await mongoose.connect(uri);

    // Fetch all courses, populating prerequisitos with course names
    const courses = await CourseModel.find().populate({
      path: "prerequisitos",
      select: "nombre",
    });

    // Format the courses to include prerequisitos as array of objects with _id and nombre
    const formattedCourses = courses.map((course) => ({
      _id: course._id,
      nombre: course.nombre,
      prerequisitos: course.prerequisitos.map((prereq) => ({
        _id: prereq._id,
        nombre: prereq.nombre,
      })),
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        courses: formattedCourses,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error retrieving courses: " + error.message,
      }),
    };
  } finally {
    // Close the connection
    await mongoose.connection.close();
  }
};
