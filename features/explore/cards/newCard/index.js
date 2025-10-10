import mongoose from "mongoose";
import { CardModel } from "./schema.js";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.URI;

if (!uri) {
  throw new Error("URI not found in the environment");
}

export const handler = async (event, _) => {
  try {
    await mongoose.connect(uri);

    const { type, title, content, tags, priority, color, display_data } =
      JSON.parse(event.body);

    // Validate required fields
    const missingFields = [];
    if (!type) missingFields.push("type");
    if (!title) missingFields.push("title");
    if (!content) missingFields.push("content");

    if (missingFields.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Missing required fields: [${missingFields.join(", ")}]`,
        }),
      };
    }

    // just testimony and what_if are allowed to be created by the user
    if (type !== "testimony" && type !== "what_if") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message:
            "Only testimony and what_if are allowed to be created by the user",
        }),
      };
    }

    // if color is not provided, set it to a random color
    const colors = [
      "#FF5733",
      "#33FF57",
      "#3357FF",
      "#FF33A1",
      "#A133FF",
      "#FFA133",
    ];

    // Initialize card
    const card = new CardModel({
      type,
      title,
      content,
      tags: Array.isArray(tags) ? tags : [],
      priority: priority ?? 0,
      created_at: new Date(),
      color: color || colors[Math.floor(Math.random() * colors.length)],
      display_data,
    });

    // Create the card
    await card.save();

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Card created",
        card,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error creating card: " + error.message,
      }),
    };
  } finally {
    // Close the connection
    await mongoose.connection.close();
  }
};
