import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.URI;

if (!uri) {
  throw new Error("URI not found in the environment");
}

export const handler = async (event, _) => {
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;

    const userId = event.requestContext?.authorizer?.lambda?.user_id;

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields: [userId]" }),
      };
    }

    const user = await db.collection("users").findOne({ clerk_id: userId });

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "User not found" }),
      };
    }

    const results = await db
      .collection("test_results")
      .findOne({ user_id: user._id });

    if (!results) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Test results not found" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        results,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error getting test results: " + error.message,
      }),
    };
  } finally {
    // Close the connection
    await mongoose.connection.close();
  }
};
