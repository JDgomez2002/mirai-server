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

    // Get the forum ID from query parameters or path parameters
    const forumId = event.pathParameters?.id || event.queryStringParameters?.id;

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

    // get number of participants
    let participants = [];
    if (forum.comments && forum.comments.length > 0) {
      participants = await UserModel.find({
        _id: { $in: forum.comments.map((comment) => comment.user_id) },
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        forum: {
          ...forum,
          comments: forum.comments.length,
          participants: participants.length,
        },
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error retrieving forum: " + error.message,
      }),
    };
  } finally {
    // Close the connection
    await mongoose.connection.close();
  }
};
