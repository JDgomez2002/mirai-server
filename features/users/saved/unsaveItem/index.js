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

    const item_id = event.pathParameters?.id;

    if (!item_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Missing required field: [item_id] as path parameter",
        }),
      };
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(item_id)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid MongoDB ObjectId item_id format",
        }),
      };
    }

    const item = await SavedItemModel.findById(item_id);

    if (!item) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Saved item not found",
        }),
      };
    }

    if (item.user_id.toString() !== user._id.toString()) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message: "You are not authorized to unsave this item",
        }),
      };
    }

    // delete the saved item
    await item.deleteOne();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Item unsaved successfully",
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error unsaving card: " + error.message,
      }),
    };
  } finally {
    await mongoose.connection.close();
  }
};
