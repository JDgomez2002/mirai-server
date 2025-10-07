import mongoose from "mongoose";
import { CareerModel } from "./schema.js";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.URI;

if (!uri) {
  throw new Error("URI not found in the environment");
}

export const handler = async (event, context) => {
  try {
    await mongoose.connect(uri);

    const { faculty, duration, name } = event.queryStringParameters || {};

    // Basic implementation: return all careers, no filters
    const allCareers = await CareerModel.find(
      {},
      {
        _id: 1,
        nombre_carrera: 1,
        facultad: 1,
        descripcion: 1,
        duracion: 1,
        empleabilidad: 1,
      }
    );

    const careers = allCareers
      // filter by faculty, duration, and name
      .filter((career) => {
        if (faculty) {
          return career.facultad.toLowerCase().includes(faculty.toLowerCase());
        }
        return true;
      })
      .filter((career) => {
        if (duration) {
          return career.duracion?.toString() === duration?.toString();
        }
        return true;
      })
      .filter((career) => {
        if (name) {
          return career.nombre_carrera
            .toLowerCase()
            .includes(name.toLowerCase());
        }
        return true;
      })
      // map to the required fields
      .map((career) => ({
        _id: career._id,
        name: career.nombre_carrera,
        faculty: career.facultad,
        description: career.descripcion,
        duration: career.duracion,
        employability: career.empleabilidad,
      }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        careers,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error retrieving careers: " + error.message,
      }),
    };
  } finally {
    // Close the connection
    await mongoose.connection.close();
  }
};
