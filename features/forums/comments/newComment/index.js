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

    // Get forumId from params and userId from the current user (assume event.requestContext.authorizer.user_id)
    const { id: forumId } = event.pathParameters || {};
    const { content } = JSON.parse(event.body || "{}");

    // You may need to adjust this depending on your auth setup
    const userId =
      event.requestContext &&
      event.requestContext.authorizer &&
      event.requestContext.authorizer.user_id;

    // Validate required fields
    const missingFields = [];
    if (!forumId) missingFields.push("forumId (params.id)");
    if (!userId) missingFields.push("userId (from current user)");
    if (!content) missingFields.push("content");

    if (missingFields.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Missing required fields: [${missingFields.join(", ")}]`,
        }),
      };
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(forumId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid MongoDB ObjectId for forumId",
        }),
      };
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid MongoDB ObjectId for userId",
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

    // Create the new comment
    const newComment = {
      user_id: userId,
      content,
      created_at: new Date(),
      answers: [],
    };

    forum.comments.push(newComment);
    await forum.save();

    // Return the newly added comment (last in the array)
    const addedComment = forum.comments[forum.comments.length - 1];

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Comment added",
        comment: addedComment,
        forumId: forum._id,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error adding comment: " + error.message,
      }),
    };
  } finally {
    await mongoose.connection.close();
  }
};
