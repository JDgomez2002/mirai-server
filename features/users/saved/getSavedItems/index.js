import mongoose from "mongoose";
import { UserModel, SavedItemModel } from "./schema.js";
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

    // Get all saved items for this user
    const items = await SavedItemModel.find({ user_id: user._id });

    return {
      statusCode: 200,
      body: JSON.stringify({
        items,
        count: items?.length ?? 0,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error retrieving saved items: " + error.message,
      }),
    };
  } finally {
    await mongoose.connection.close();
  }
};
