import mongoose from "mongoose";
import { CardModel } from "./schema.js";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.URI;
const backendUrl = process.env.BACKEND_URL;

if (!uri) {
  throw new Error("URI not found in the environment");
}

export const handler = async (event, context) => {
  try {
    await mongoose.connect(uri);

    return await handleGetFeed(event);
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error: " + error.message,
      }),
    };
  } finally {
    // Close the connection
    await mongoose.connection.close();
  }
};

const handleGetFeed = async (event) => {
  try {
    // Parse query parameters
    const queryParams = event.queryStringParameters || {};

    // Default values and validation
    const limit = Math.min(parseInt(queryParams.limit) || 7, 20); // Max 20, default 7
    const offset = parseInt(queryParams.offset) || 0;
    const types = queryParams.types ? queryParams.types.split(",") : [];
    // TODO: Add user context validation for models
    const userContext = queryParams.user_context
      ? JSON.parse(queryParams.user_context)
      : {};

    // Validate types if provided
    const validTypes = ["career", "alumni_story", "what_if", "short_question"];
    if (types.length > 0) {
      const invalidTypes = types.filter((type) => !validTypes.includes(type));
      if (invalidTypes.length > 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: `Invalid types: [${invalidTypes.join(
              ", "
            )}]. Valid types are: [${validTypes.join(", ")}]`,
          }),
        };
      }
    }

    // Build filter query
    const filter = {};
    if (types.length > 0) {
      filter.type = { $in: types };
    }

    // Get total count for pagination
    const total = await CardModel.countDocuments(filter);

    // Get cards with pagination, sorted by priority (highest first) and then by created_at
    const cards = await CardModel.find(filter)
      .sort({ priority: -1, created_at: -1 })
      .skip(offset)
      .limit(limit)
      .lean(); // Use lean() for better performance

    // Calculate pagination info
    const hasMore = offset + limit < total;

    // Build next batch URL
    const nextOffset = offset + limit;
    const nextBatchUrl = `${backendUrl}/explore/feed?offset=${nextOffset}&limit=${limit}`;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: cards,
        pagination: {
          total,
          limit,
          offset,
          hasMore,
        },
        recommendations: {
          nextBatchUrl,
        },
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error fetching feed: " + error.message,
      }),
    };
  }
};
