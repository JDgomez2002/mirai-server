import mongoose from "mongoose";
import { ForumModel, UserModel } from "./schema.js";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.URI;

if (!uri) {
  throw new Error("URI not found in the environment");
}

export const handler = async (event) => {
  try {
    await mongoose.connect(uri);

    const { title, description, career_id, final_date } = JSON.parse(
      event.body
    );

    // Extract user_id from the Lambda authorizer context
    const userId = event.requestContext?.authorizer?.lambda?.user_id;

    // Validate required fields
    const missingFields = [];
    if (!title) missingFields.push("title");
    if (!description) missingFields.push("description");
    if (!career_id) missingFields.push("career_id");
    if (!final_date) missingFields.push("final_date");

    if (missingFields.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Missing required fields: [${missingFields.join(", ")}]`,
        }),
      };
    }

    const user = await UserModel.findOne({ clerk_id: userId });

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "User not found",
        }),
      };
    }

    // verify that the creator_id and career_id are valid id objects
    if (!mongoose.Types.ObjectId.isValid(career_id)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid MongoDB ObjectId career_id format",
        }),
      };
    }

    // Create the forum post
    const forum = new ForumModel({
      title,
      description,
      creator_id: user._id,
      career_id,
      final_date: new Date(final_date ?? new Date()),
      created_at: new Date(),
      // comments will use schema defaults
    });

    await forum.save();

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Forum created",
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error creating forum post: " + error.message,
      }),
    };
  } finally {
    await mongoose.connection.close();
  }
};
