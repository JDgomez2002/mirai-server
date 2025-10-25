import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.URI;

if (!uri) {
  throw new Error("URI not found in the environment");
}

let conn = null;

const connect = async function () {
  if (conn == null) {
    conn = mongoose.createConnection(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    // `await`ing connection after assigning to the `conn` variable
    // to avoid multiple function calls creating new connections
    await conn.asPromise();
  }

  return conn;
};

export const handler = async (event, _) => {
  try {
    const userId = event.requestContext?.authorizer?.lambda?.user_id;

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields: [userId]" }),
      };
    }

    const db = (await connect()).db;

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

    let tags = [];

    // update user tags each 7 interactions
    // if (userInteractions.length % 7 === 0) {
    if (true) {
      const userInteractions = await db
        .collection("interactions")
        .find({ userId: user._id })
        // get the last 7 interactions
        .sort({ createdAt: -1 })
        .limit(7)
        .toArray();
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

      // Build tag objects including the corresponding interaction action
      // Map cardId to the action by finding the interaction for that card
      // Map cardId to all actions for that cardId, for each interaction (could be multiple per card)
      const interactionCardIdToActions = {};
      userInteractions.forEach((interaction) => {
        const cardIdStr = interaction.cardId?.toString();
        if (!interactionCardIdToActions[cardIdStr]) {
          interactionCardIdToActions[cardIdStr] = [];
        }
        interactionCardIdToActions[cardIdStr].push(interaction.action);
      });

      tags = [];
      cards.forEach((card) => {
        const cardIdStr = card._id?.toString();

        // display_data.tags
        if (Array.isArray(card?.display_data?.tags)) {
          card.display_data.tags.forEach((tag) => {
            if (typeof tag === "object" && tag) {
              tags.push({
                ...tag,
                actions: interactionCardIdToActions[cardIdStr] ?? [],
              });
            }
          });
        }
        // card.tags
        if (Array.isArray(card?.tags)) {
          card.tags.forEach((tag) => {
            if (typeof tag === "object" && tag) {
              tags.push({
                ...tag,
                actions: interactionCardIdToActions[cardIdStr] ?? [],
              });
            }
          });
        }
      });
      // Remove duplicate tag references (by stringifying tag+actions)
      tags = tags.filter(
        (tag, index, self) =>
          index ===
          self.findIndex((t) => JSON.stringify(t) === JSON.stringify(tag))
      );

      // TODO: Update user tags with algorithm

      const INTERACTION_WEIGHTS = {
        like: 0.3,
        unlike: -0.3,
        save: 0.5,
        unsave: -0.5,
      };

      // calculate score based on the weights
      tags = tags.map((tag) => ({
        ...tag,
        score:
          tag.actions.reduce(
            (acc, action) => acc + INTERACTION_WEIGHTS[action],
            0
          ) / (tag.actions.length ?? 1),
      }));
    }

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Interaction created",
        interaction,
        tags,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error creating interaction: " + error.message,
      }),
    };
  }
};
