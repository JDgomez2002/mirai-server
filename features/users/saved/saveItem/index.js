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

    // check if the item is already saved
    const savedItem = await db
      .collection("saveditems")
      .findOne({
        user_id: user._id,
        item_id: new mongoose.Types.ObjectId(item_id),
      });
    if (savedItem) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Item already saved" }),
      };
    }

    // Find the item based on type
    let item;
    if (type === "card") {
      const card = await db
        .collection("cards")
        .findOne({ _id: new mongoose.Types.ObjectId(item_id) });
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
      const career = await db
        .collection("careers")
        .findOne({ _id: new mongoose.Types.ObjectId(item_id) });
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
        duration: career.duracion,
        employability: career.empleabilidad,
      };
    }

    // create the saved item in the saved_items collection
    await db.collection("saveditems").insertOne({
      user_id: user._id,
      type,
      item_id: item._id,
      saved_at: new Date(),
      item,
    });

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
  }
};
