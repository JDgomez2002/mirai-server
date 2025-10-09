import mongoose from "mongoose";
import { ForumModel, UserModel } from "./schema.js";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.URI;

if (!uri) {
  throw new Error("URI not found in the environment");
}

export const handler = async (event, context) => {
  try {
    await mongoose.connect(uri);

    // Get the forum ID from query parameters or path parameters
    const forumId = event.pathParameters?.id || event.queryStringParameters?.id;
    const { title, description, final_date } = JSON.parse(event.body);

    // Extract user_id from the Lambda authorizer context
    const userId = event.requestContext?.authorizer?.lambda?.user_id;

    // Validate that ID is provided
    if (!forumId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Forum ID is required: /forums/{id}",
        }),
      };
    }

    // Validate that the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(forumId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid MongoDB ObjectId forum ID format",
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

    // Find the forum by MongoDB _id
    const forum = await ForumModel.findById(forumId);

    if (!forum) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Forum not found",
        }),
      };
    }

    // verify that the user is the creator of the forum, just admins and the creator can edit the forum
    if (
      // check if the user is the creator of the forum
      user._id.toString() !== forum.creator_id.toString() &&
      // check if the user is an admin
      user.role !== "admin"
    ) {
      // if the user is not the creator of the forum and not an admin, return a forbidden error
      return {
        statusCode: 403,
        body: JSON.stringify({
          message: "Forbidden: Only admins and the creator can edit the forum",
        }),
      };
    }

    // update the forum just with the fields that are provided
    if (title) forum.title = title;
    if (description) forum.description = description;
    if (final_date) forum.final_date = final_date;

    // save the forum
    await forum.save();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Forum updated",
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error updating forum: " + error.message,
      }),
    };
  } finally {
    // Close the connection
    await mongoose.connection.close();
  }
};
