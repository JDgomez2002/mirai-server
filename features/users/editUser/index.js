import mongoose from "mongoose";
import { UserModel } from "./schema.js";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.URI;

if (!uri) {
  throw new Error("URI not found in the environment");
}

export const handler = async (event, _) => {
  try {
    await mongoose.connect(uri);

    const userId = event.requestContext?.authorizer?.lambda?.user_id;

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields: [userId]" }),
      };
    }

    const user = await UserModel.findOne({ clerk_id: userId });

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "User not found" }),
      };
    }

    // just admins can edit users
    if (user.role !== "admin") {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message: "Forbidden: Only admins can edit users",
        }),
      };
    }

    const userIdToEdit = event.pathParameters?.id;

    // validate that the user ID to edit is provided
    if (!userIdToEdit) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Missing required user to edit: /users/{id}",
        }),
      };
    }

    // validate that the user ID to edit is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userIdToEdit)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid MongoDB ObjectId user ID format",
        }),
      };
    }

    const userToEdit = await UserModel.findById(userIdToEdit);

    if (!userToEdit) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "User not found" }),
      };
    }
    const { role } = JSON.parse(event.body);

    if (!role) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields: [role]" }),
      };
    }

    // validate that the role is a valid role
    if (!["admin", "teacher", "director", "student"].includes(role)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid role" }),
      };
    }

    // update the user
    await UserModel.updateOne({ _id: userIdToEdit }, { $set: { role } });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "User updated successfully" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error updating user: " + error.message,
      }),
    };
  } finally {
    // Close the connection
    await mongoose.connection.close();
  }
};
