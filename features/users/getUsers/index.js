import mongoose from "mongoose";
import { UserModel } from "./schema.js";
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

    const allUsers = await UserModel.find({});

    const users = allUsers.map((user) => ({
      _id: encrypt(user._id.toString()),
      first_name: encrypt(decrypt(user.first_name)),
      last_name: encrypt(decrypt(user.last_name)),
      image_url: encrypt(decrypt(user.image_url)),
      username: encrypt(decrypt(user.username)),
      email: encrypt(decrypt(user.email)),
      role: encrypt(user.role),
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        users,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error getting users: " + error.message,
      }),
    };
  } finally {
    // Close the connection
    await mongoose.connection.close();
  }
};
