import mongoose from "mongoose";
import { CareerModel, CourseModel } from "./schema.js";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.URI;

if (!uri) {
  throw new Error("URI not found in the environment");
}

export const handler = async (event, context) => {
  try {
    await mongoose.connect(uri);

    const careerId = event.pathParameters?.id;

    if (!careerId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Career id is required in the path. /careers/{id}",
        }),
      };
    }

    if (!mongoose.Types.ObjectId.isValid(careerId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid MongoDB ObjectId career ID format",
        }),
      };
    }

    const career = await CareerModel.findById(careerId);

    if (!career) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Career not found",
        }),
      };
    }

    // Populate all courses in the plan_de_estudio (primer_semestre and segundo_semestre for each year) manually
    // Populate plan_de_estudio with full course objects, preserving the structure

    // const study_plan = career.plan_de_estudio;
    // const years = Object.keys(study_plan);

    // console.log("study_plan:", study_plan);
    // console.log("years:", years);

    return {
      statusCode: 200,
      body: JSON.stringify({
        career,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error retrieving career: " + error.message,
      }),
    };
  } finally {
    // Close the connection
    await mongoose.connection.close();
  }
};
