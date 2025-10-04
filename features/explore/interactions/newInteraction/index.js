import mongoose from "mongoose";
import { InteractionModel, CardModel } from "./schema.js";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.URI;

if (!uri) {
  throw new Error("URI not found in the environment");
}

export const handler = async (event, context) => {
  try {
    await mongoose.connect(uri);

    const { cardId, action, duration, metadata } = JSON.parse(event.body);

    // Validate required fields
    const missingFields = [];
    if (!cardId) missingFields.push("cardId");
    if (!action) missingFields.push("action");

    if (missingFields.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Missing required fields: [${missingFields.join(", ")}]`,
        }),
      };
    }

    // Validate action is one of the allowed values
    const allowedActions = ["view", "tap", "save", "share"];
    if (!allowedActions.includes(action)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Invalid action. Allowed actions: [${allowedActions.join(
            ", "
          )}]`,
        }),
      };
    }

    // Validate cardId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(cardId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid MongoDB ObjectId card ID format",
        }),
      };
    }

    // Find the card by MongoDB _id
    const card = await CardModel.findById(cardId);

    if (!card) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Card not found",
        }),
      };
    }

    // Initialize interaction
    const interaction = new InteractionModel({
      cardId,
      action,
      duration,
      metadata,
      created_at: new Date(),
    });

    // Create the interaction
    await interaction.save();

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Interaction created",
        interaction,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error creating interaction: " + error.message,
      }),
    };
  } finally {
    // Close the connection
    await mongoose.connection.close();
  }
};
