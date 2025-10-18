import mongoose from "mongoose";
import { CareerModel, UserModel } from "./schema.js";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.URI;

if (!uri) {
  throw new Error("URI not found in the environment");
}

// This handler only allows editing the `insights` field of a career document
export const handler = async (event, _) => {
  try {
    await mongoose.connect(uri);

    const userId = event.requestContext?.authorizer?.lambda?.user_id;

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "User id is required in the authorizer context",
        }),
      };
    }

    const user = await UserModel.findOne({ clerk_id: userId });

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "User not found",
        }),
      };
    }

    if (user.role === "student") {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message: "Forbidden: Students cannot edit insights",
        }),
      };
    }

    const careerId = event.pathParameters?.id;

    if (!careerId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Career id is required in the path. /careers/{id}",
        }),
      };
    }

    if (!mongoose.Types.ObjectId.isValid(careerId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid MongoDB ObjectId career ID format",
        }),
      };
    }

    const { insights } = JSON.parse(event.body);

    if (!insights) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Insights field is required",
        }),
      };
    }

    const updated = await CareerModel.findByIdAndUpdate(
      careerId,
      { insights },
      { new: true }
    );

    if (!updated) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Career not found",
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Career insights updated successfully",
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error updating insights: " + error.message,
      }),
    };
  } finally {
    await mongoose.connection.close();
  }
};
