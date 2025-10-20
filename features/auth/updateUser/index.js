import mongoose from "mongoose";
import dotenv from "dotenv";
import { encrypt } from "./crypto.utils.js";

dotenv.config();

const uri = process.env.URI;

if (!uri) {
  throw new Error("URI not found in the environment");
}

export const handler = async (event, _) => {
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;

    console.log("EVENT:", JSON.stringify(event, null, 2));

    const {
      data: {
        id,
        first_name,
        last_name,
        username,
        image_url,
        primary_email_address_id,
        email_addresses,
        // unsafe_metadata: { role },
      },
    } = JSON.parse(event.body);

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields: [id]" }),
      };
    }

    // Check if user already exists
    const user = await db.collection("users").findOne({ clerk_id: id });
    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "User not found" }),
      };
    }

    // Find the primary email
    const email = email_addresses.find(
      (e) => e.id === primary_email_address_id
    );

    // Prepare encrypted and updated fields (except clerk_id)
    const updateFields = {
      first_name: encrypt(first_name),
      last_name: encrypt(last_name),
      username: encrypt(username),
      image_url: encrypt(image_url),
      email: email ? encrypt(email.email_address) : null,
    };

    await db
      .collection("users")
      .updateOne({ clerk_id: id }, { $set: updateFields });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "User updated",
      }),
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
