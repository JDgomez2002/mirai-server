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

    // Get the card ID from query parameters or path parameters
    const cardId = event.pathParameters?.id || event.queryStringParameters?.id;

    // Validate that ID is provided
    if (!cardId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Card ID is required: /explore/cards/{id}",
        }),
      };
    }

    // Validate that the ID is a valid MongoDB ObjectId
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

    // just testimony and what_if are allowed to be deleted by the user
    if (card.type !== "testimony" && card.type !== "what_if") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message:
            "Only testimony and what_if are allowed to be deleted by the client",
        }),
      };
    }

    // delete the card
    await CardModel.deleteOne({ _id: cardId });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Card deleted",
        card,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error deleting card: " + error.message,
      }),
    };
  } finally {
    // Close the connection
    await mongoose.connection.close();
  }
};
