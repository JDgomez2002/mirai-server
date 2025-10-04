import mongoose from "mongoose";
import dotenv from "dotenv";
import { UserModel } from "./schema.js";

dotenv.config();

const uri = process.env.URI;

if (!uri) {
  throw new Error("URI not found in the environment");
}

export const handler = async (event, context) => {
  try {
    await mongoose.connect(uri);

    const {
      data: { id },
    } = JSON.parse(event.body);

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields: [id]" }),
      };
    }

    // Check if user exists
    const existingUser = await UserModel.findOne({ clerk_id: id });
    if (!existingUser) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "User not found" }),
      };
    }

    // delete the user
    await UserModel.deleteOne({ clerk_id: id });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "User deleted",
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error deleting user: " + error.message,
      }),
    };
  } finally {
    // Close the connection
    await mongoose.connection.close();
  }
};
