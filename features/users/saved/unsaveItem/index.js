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

    const item_id = event.pathParameters?.id;

    if (!item_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Missing required field: [item_id] as path parameter",
        }),
      };
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(item_id)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid MongoDB ObjectId item_id format",
        }),
      };
    }

    const item = await db
      .collection("saveditems")
      .findOne({ _id: new mongoose.Types.ObjectId(item_id) });

    if (!item) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Saved item not found",
        }),
      };
    }

    if (item.user_id.toString() !== user._id.toString()) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message: "You are not authorized to unsave this item",
        }),
      };
    }

    // delete the saved item
    await db.collection("saveditems").deleteOne({ _id: item._id });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Item unsaved successfully",
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error unsaving card: " + error.message,
      }),
    };
  }
};
