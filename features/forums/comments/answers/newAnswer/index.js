import mongoose from "mongoose";
import { ForumModel, UserModel } from "./schema.js";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.URI;

if (!uri) {
  throw new Error("URI not found in the environment");
}

export const handler = async (event, _) => {
  try {
    await mongoose.connect(uri);

    // Get forumId from params and userId from the current user (assume event.requestContext.authorizer.user_id)
    const { id: forumId, commentId } = event.pathParameters || {};
    const { content } = JSON.parse(event.body || "{}");

    // Extract user_id from the Lambda authorizer context
    const userId = event.requestContext?.authorizer?.lambda?.user_id;

    // Validate required fields
    const missingFields = [];
    if (!forumId) missingFields.push("forumId (params: {id})");
    if (!userId) missingFields.push("userId (from current user)");
    if (!content) missingFields.push("content");
    if (!commentId) missingFields.push("commentId (params: {commentId})");

    if (missingFields.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Missing required fields: [${missingFields.join(", ")}]`,
        }),
      };
    }

    // Validate ObjectId
    if (
      !mongoose.Types.ObjectId.isValid(forumId) ||
      !mongoose.Types.ObjectId.isValid(commentId)
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid MongoDB ObjectId for forumId",
        }),
      };
    }

    // Find the forum
    const forum = await ForumModel.findById(forumId);
    if (!forum) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Forum not found",
        }),
      };
    }

    // Find the comment
    const comment = forum.comments.id(commentId);
    if (!comment) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Comment not found",
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

    // Create the new answer
    const newAnswer = {
      user_id: user._id,
      content,
      created_at: new Date(),
      edited: false,
    };

    comment.answers.push(newAnswer);

    await forum.save();

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Comment's answer added successfully",
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error adding comment's answer: " + error.message,
      }),
    };
  } finally {
    await mongoose.connection.close();
  }
};
