import mongoose from "mongoose";
import { CardModel } from "./schema.js";
import dotenv from "dotenv";
import { randomUUID } from "crypto";

dotenv.config();

const uri = process.env.URI;

if (!uri) {
  throw new Error("URI not found in the environment");
}

export const handler = async (event, context) => {
  try {
    await mongoose.connect(uri);

    const { type, title, content, tags, imageUrl, priority, color } =
      JSON.parse(event.body);

    // Validate required fields
    const missingFields = [];
    if (!type) missingFields.push("type");
    if (!title) missingFields.push("title");
    if (!content) missingFields.push("content");
    if (!imageUrl) missingFields.push("imageUrl");
    if (priority === undefined || priority === null)
      missingFields.push("priority");

    if (missingFields.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Missing required fields: [${missingFields.join(", ")}]`,
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
      imageUrl,
      priority,
      created_at: new Date(),
      color: color || colors[Math.floor(Math.random() * colors.length)],
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
