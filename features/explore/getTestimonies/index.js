import mongoose from "mongoose";
import { CardModel } from "./schema.js";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.URI;

if (!uri) {
  throw new Error("URI not found in the environment");
}

// eslint-disable-next-line no-unused-vars
export const handler = async (event, _) => {
  try {
    await mongoose.connect(uri);

    // Get all cards of type "testimony"
    const testimonies = await CardModel.find({ type: "testimony" });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Testimony cards retrieved successfully",
        testimonies,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error retrieving testimony cards: " + error.message,
      }),
    };
  } finally {
    // Close the connection
    await mongoose.connection.close();
  }
};
