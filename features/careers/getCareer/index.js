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

    const db = (await connect()).db;

    const career = await db
      .collection("careers")
      .findOne({ _id: new mongoose.Types.ObjectId(careerId) });

    if (!career) {
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
        career,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error retrieving career: " + error.message,
      }),
    };
  }
};
