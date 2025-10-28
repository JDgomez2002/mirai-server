import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.URI;

if (!uri) {
  throw new Error("URI not found in the environment");
}

let conn = null;

const connect = async function () {
  if (conn == null) {
    conn = mongoose.createConnection(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    // `await`ing connection after assigning to the `conn` variable
    // to avoid multiple function calls creating new connections
    await conn.asPromise();
  }

  return conn;
};

export const handler = async (event, _) => {
  try {
    // Get the forum ID from query parameters or path parameters
    const forumId = event.pathParameters?.id || event.queryStringParameters?.id;
    const { title, description, final_date } = JSON.parse(event.body);

    // Extract user_id from the Lambda authorizer context
    const userId = event.requestContext?.authorizer?.lambda?.user_id;

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "User ID is required in the authorizer context",
        }),
      };
    }

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

    const db = (await connect()).db;

    const user = await db.collection("users").findOne({ clerk_id: userId });

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "User not found",
        }),
      };
    }

    // Find the forum by MongoDB _id
    const forum = await db
      .collection("forums")
      .findOne({ _id: new mongoose.Types.ObjectId(forumId) });

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
    const data = {};
    if (title) data.title = title;
    if (description) data.description = description;
    if (final_date) data.final_date = new Date(final_date);

    // save the forum
    await db.collection("forums").updateOne({ _id: forum._id }, { $set: data });

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
  }
};
