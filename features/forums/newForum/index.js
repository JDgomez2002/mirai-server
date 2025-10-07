import mongoose from "mongoose";
import { ForumModel } from "./schema.js";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.URI;

if (!uri) {
  throw new Error("URI not found in the environment");
}

export const handler = async (event, context) => {
  try {
    await mongoose.connect(uri);

    const { title, description, creator_id, career_id, active } = JSON.parse(
      event.body
    );

    // Validate required fields
    const missingFields = [];
    if (!title) missingFields.push("title");
    if (!description) missingFields.push("description");
    if (!creator_id) missingFields.push("creator_id");
    if (!career_id) missingFields.push("career_id");
    if (active === undefined || active === null) missingFields.push("active");

    if (missingFields.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Missing required fields: [${missingFields.join(", ")}]`,
        }),
      };
    }

    // verify that the creator_id and career_id are valid id objects
    if (
      !mongoose.Types.ObjectId.isValid(creator_id) ||
      !mongoose.Types.ObjectId.isValid(career_id)
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid MongoDB ObjectId creator_id or career_id format",
        }),
      };
    }

    // Create the forum post
    const forum = new ForumModel({
      title,
      description,
      creator_id,
      career_id,
      active,
      // comments will use schema defaults
    });

    await forum.save();

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Forum post created",
        forum,
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
