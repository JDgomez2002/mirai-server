import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.URI;

if (!uri) {
  throw new Error("URI not found in the environment");
}

// patch
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

    const { cardId } = event.pathParameters;
    const { action } = JSON.parse(event.body);

    const missingFields = [];

    if (!cardId) missingFields.push("cardId (path)");
    if (!action) missingFields.push("action (body)");

    if (missingFields.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Missing required fields: [${missingFields.join(", ")}]`,
        }),
      };
    }

    if (!mongoose.Types.ObjectId.isValid(cardId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid MongoDB ObjectId cardId format",
        }),
      };
    }

    if (action !== "like" && action !== "unlike") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid action: " + action + ". Must be 'like' or 'unlike'",
        }),
      };
    }

    // Get the card and check if user has already liked it
    const card = await db
      .collection("cards")
      .findOne({ _id: new mongoose.Types.ObjectId(cardId) });
    if (!card) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Card not found" }),
      };
    }

    // Check current user likes to determine if they've already liked this card
    let userLikes = user?.likes ?? [];
    const hasAlreadyLiked = userLikes.some(
      (like) => like.cardId?.toString() === card._id?.toString()
    );

    // Handle like action
    if (action === "like") {
      if (hasAlreadyLiked) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: "Card already liked by user",
          }),
        };
      }

      // Add to user likes
      userLikes.push({
        cardId: card._id,
        title: card.title ?? card.display_data?.name ?? "Title not available",
        content:
          card.content ??
          card.display_data?.description ??
          "Content not available",
        type: card.type,
      });

      // Increment card likes count
      const newLikes = (card.likes || 0) + 1;
      await db
        .collection("cards")
        .updateOne(
          { _id: new mongoose.Types.ObjectId(cardId) },
          { $set: { likes: newLikes } }
        );
    }
    // Handle unlike action
    else if (action === "unlike") {
      if (!hasAlreadyLiked) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: "Card not liked by user",
          }),
        };
      }

      // Remove from user likes
      userLikes = userLikes.filter(
        (like) => like.cardId?.toString() !== card._id?.toString()
      );

      // Decrement card likes count (ensure it doesn't go below 0)
      const newLikes = Math.max((card.likes || 0) - 1, 0);
      await db
        .collection("cards")
        .updateOne(
          { _id: new mongoose.Types.ObjectId(cardId) },
          { $set: { likes: newLikes } }
        );
    }

    // Update user's likes array
    await db
      .collection("users")
      .updateOne(
        { _id: new mongoose.Types.ObjectId(user._id) },
        { $set: { likes: userLikes } }
      );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Like action updated",
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error updating like action: " + error.message,
      }),
    };
  } finally {
    // Close the connection
    await mongoose.connection.close();
  }
};
