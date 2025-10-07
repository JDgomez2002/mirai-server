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

    const {
      data: {
        id,
        unsafe_metadata: { role },
      },
    } = JSON.parse(event.body);

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields: [id]" }),
      };
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ clerk_id: id });
    if (existingUser) {
      return {
        statusCode: 409,
        body: JSON.stringify({ message: "User already exists" }),
      };
    }

    // initialize user
    const user = new UserModel({
      clerk_id: id,
      created_at: new Date(),
      role: role ?? "student",
    });

    // create the user
    await user.save();

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "User registered",
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error registering user: " + error.message,
      }),
    };
  } finally {
    // Close the connection
    await mongoose.connection.close();
  }
};
