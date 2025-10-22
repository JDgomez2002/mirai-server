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
    const allowedActions = [
      "view",
      "tap",
      "save",
      "share",
      "like",
      "unlike",
      "unsave",
    ];
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
    const card = await db
      .collection("cards")
      .findOne({ _id: new mongoose.Types.ObjectId(cardId) });

    if (!card) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Card not found",
        }),
      };
    }

    const { insertedId } = await db.collection("interactions").insertOne({
      cardId,
      action,
      duration,
      metadata,
      createdAt: new Date(),
      userId: user._id,
    });

    const interaction = await db
      .collection("interactions")
      .findOne({ _id: insertedId });

    const userInteractions = await db
      .collection("interactions")
      .find({ userId: user._id })
      .toArray();

    // update user tags each 10 interactions
    if (userInteractions.length % 10 === 0) {
      // if (true) {
      // get all tags from all interactions, from the cards in the interactions
      const cards = await db
        .collection("cards")
        .find({
          _id: {
            $in: userInteractions.map(
              (interaction) => new mongoose.Types.ObjectId(interaction.cardId)
            ),
          },
        })
        .toArray();

      // get all tags from all cards in one array
      let tags = cards.flatMap((card) => card?.display_data?.tags);
      // there is also tags in card.tags, so we need to also add them to the tags array
      tags = tags.concat(cards.flatMap((card) => card?.tags));
      // remove duplicates
      tags = [...new Set(tags)];
      // remove tags that are not objects
      tags = tags.filter((tag) => typeof tag === "object");
      // TODO: Update user tags with algorithm
    }

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
