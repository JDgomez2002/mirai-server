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

    // Get forumId and commentId from params and userId from the current user (assume event.requestContext.authorizer.user_id)
    const { id: forumId, commentId } = event.pathParameters || {};

    // Extract user_id from the Lambda authorizer context
    const userId = event.requestContext?.authorizer?.lambda?.user_id;

    // Validate required fields
    const missingFields = [];
    if (!forumId) missingFields.push("forumId (params: {id})");
    if (!commentId) missingFields.push("commentId (params: {commentId})");
    if (!userId) missingFields.push("userId (from current user)");

    if (missingFields.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Missing required fields: [${missingFields.join(", ")}]`,
        }),
      };
    }

    // Validate ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(forumId) ||
      !mongoose.Types.ObjectId.isValid(commentId)
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid MongoDB ObjectId for forumId or commentId",
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

    // Find the user via clerk_id
    const user = await UserModel.findOne({ clerk_id: userId });
    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "User not found",
        }),
      };
    }

    // Find the comment to delete
    const comment = forum.comments.id(commentId);
    if (!comment) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Comment not found",
        }),
      };
    }

    // Check permission: only the owner or admins can delete
    if (
      comment.user_id.toString() !== user._id.toString() &&
      user.role !== "admin"
    ) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message:
            "You do not have permission to delete this comment. Only the owner or an admin can delete it.",
        }),
      };
    }

    // Remove the comment
    comment.deleteOne();

    await forum.save();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Comment deleted successfully",
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error deleting comment: " + error.message,
      }),
    };
  } finally {
    await mongoose.connection.close();
  }
};
