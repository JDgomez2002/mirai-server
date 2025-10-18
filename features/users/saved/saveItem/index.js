import mongoose from "mongoose";
import { CardModel, CareerModel, UserModel, SavedItemModel } from "./schema.js";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.URI;

if (!uri) {
  throw new Error("URI not found in the environment");
}

export const handler = async (event, _) => {
  try {
    await mongoose.connect(uri);

    const userId = event.requestContext?.authorizer?.lambda?.user_id;

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields: [userId]" }),
      };
    }

    const user = await UserModel.findOne({ clerk_id: userId });

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "User not found" }),
      };
    }

    const { type, item_id } = JSON.parse(event.body);

    if (!type || !item_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Missing required fields: [type, item_id]",
        }),
      };
    }

    // validate that the type is valid
    if (type !== "card" && type !== "career") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid type: " + type + ". Must be 'card' or 'career'",
        }),
      };
    }

    if (!mongoose.Types.ObjectId.isValid(item_id)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid MongoDB ObjectId item_id format",
        }),
      };
    }

    // Find the item based on type
    let item;
    if (type === "card") {
      const card = await CardModel.findById(item_id);
      if (!card) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: "Card not found" }),
        };
      }
      item = {
        _id: card._id,
        type: card.type,
        title: card.title,
        content: card.content,
        tags: card.tags,
        priority: card.priority,
        color: card.color,
        display_data: card.display_data,
      };
    } else {
      const career = await CareerModel.findById(item_id);
      if (!career) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: "Career not found" }),
        };
      }
      item = {
        _id: career._id,
        nombre_carrera: career.nombre_carrera,
        facultad: career.facultad,
        descripcion: career.descripcion,
      };
    }

    // create the saved item
    const savedItem = new SavedItemModel({
      user_id: user._id,
      type,
      item_id: item._id,
      saved_at: new Date(),
      item,
    });

    // save the saved item
    await savedItem.save();

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Item saved successfully",
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error saving item: " + error.message,
      }),
    };
  } finally {
    // Close the connection
    await mongoose.connection.close();
  }
};
