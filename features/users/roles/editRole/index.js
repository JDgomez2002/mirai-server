import mongoose from "mongoose";
import { UserModel } from "./schema.js";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.URI;

if (!uri) {
  throw new Error("URI not found in the environment");
}

export const handler = async (event, context) => {
  try {
    await mongoose.connect(uri);

    console.log("event:", event);

    // Verify with auth middleware if the user.role is admin
    // The auth middleware provides user metadata in event.requestContext.authorizer
    const userMetadata = event.requestContext?.authorizer;

    if (!userMetadata || !userMetadata.role) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          message: "Unauthorized: User metadata not found",
        }),
      };
    }

    console.log("userMetadata:", userMetadata);

    // Check if the user is an admin
    if (userMetadata.role !== "admin") {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message: "Forbidden: Only admins can edit user roles",
        }),
      };
    }

    // Get the card ID from query parameters or path parameters
    const userId = event.pathParameters?.id || event.queryStringParameters?.id;
    const { role } = JSON.parse(event.body);

    // Validate that ID is provided
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "User ID is required: /users/roles/{id}",
        }),
      };
    }

    // Validate that the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid MongoDB ObjectId user ID format",
        }),
      };
    }

    // Find the user by MongoDB _id
    const user = await UserModel.findById(userId);

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "User not found",
        }),
      };
    }

    // update the user role
    user.role = role;
    await user.save();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "User role updated",
        user,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error updating user role: " + error.message,
      }),
    };
  } finally {
    // Close the connection
    await mongoose.connection.close();
  }
};
