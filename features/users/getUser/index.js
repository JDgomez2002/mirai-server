import mongoose from "mongoose";
import dotenv from "dotenv";
import { decrypt } from "./crypto.utils.js";
import { encrypt } from "./traffic.crypto.js";

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

    return {
      statusCode: 200,
      body: JSON.stringify({
        user: {
          _id: encrypt(user._id.toString()),
          first_name: encrypt(decrypt(user.first_name)),
          last_name: encrypt(decrypt(user.last_name)),
          image_url: encrypt(decrypt(user.image_url)),
          username: encrypt(decrypt(user.username)),
          email: encrypt(decrypt(user.email)),
          role: encrypt(user.role),
          tags: user.user_tags,
          quizCompletedAt: user.quizCompletedAt ?? null,
          likes: user.likes ?? [],
        },
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error getting user: " + error.message,
      }),
    };
  } finally {
    // Close the connection
    await mongoose.connection.close();
  }
};
