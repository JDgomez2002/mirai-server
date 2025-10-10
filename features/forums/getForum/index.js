// @ts-nocheck
import mongoose from "mongoose";
import { ForumModel, UserModel } from "./schema.js";
import dotenv from "dotenv";
import { decrypt } from "./crypto.utils.js";

dotenv.config();

const uri = process.env.URI;

if (!uri) {
  throw new Error("URI not found in the environment");
}

export const handler = async (event) => {
  try {
    await mongoose.connect(uri);

    // Get the forum ID from query parameters or path parameters
    const forumId = event.pathParameters?.id || event.queryStringParameters?.id;

    // Validate that ID is provided
    if (!forumId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Forum ID is required: /forums/{id}",
        }),
      };
    }

    // Validate that the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(forumId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid MongoDB ObjectId forum ID format",
        }),
      };
    }

    // Find the forum by MongoDB _id
    // populate the creator_id with user._id, user.first_name, user.last_name and user.role
    // for both comments and answers.
    // also populate career_id with career.nombre_carrera and career.facultad
    const forum = await ForumModel.findById(forumId)
      .populate("creator_id", "first_name last_name role image_url")
      .populate("comments.user_id", "first_name last_name role image_url")
      .populate(
        "comments.answers.user_id",
        "first_name last_name role image_url"
      )
      .populate("career_id", "nombre_carrera facultad");

    if (!forum) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Forum not found",
        }),
      };
    }

    // get number of participants
    let participants = [];
    if (forum.comments && forum.comments.length > 0) {
      participants = await UserModel.find({
        _id: { $in: forum.comments.map((comment) => comment.user_id) },
      });
    }

    // format comments to have user instead of user_id as key of the object
    const comments = forum.comments.map((comment) => {
      // also format answers to have user instead of user_id as key of the object
      const answers = comment.answers.map((answer) => {
        return {
          _id: answer._id,
          content: answer.content,
          created_at: answer.created_at,
          user: {
            _id: answer.user_id._id,
            first_name: decrypt(answer.user_id.first_name),
            last_name: decrypt(answer.user_id.last_name),
            image_url: decrypt(answer.user_id.image_url),
            role: answer.user_id.role,
          },
          edited: answer.edited,
        };
      });

      return {
        _id: comment._id,
        content: comment.content,
        created_at: comment.created_at,
        answers,
        user: {
          _id: comment.user_id._id,
          first_name: decrypt(comment.user_id.first_name),
          last_name: decrypt(comment.user_id.last_name),
          image_url: decrypt(comment.user_id.image_url),
          role: comment.user_id.role,
        },
        edited: comment.edited,
      };
    });

    // format creator_id to have user instead of user_id as key of the object
    const creator = {
      ...forum.creator_id.toObject(),
      first_name: decrypt(forum.creator_id.first_name),
      last_name: decrypt(forum.creator_id.last_name),
      image_url: decrypt(forum.creator_id.image_url),
    };
    // format career_id to have career instead of user_id as key of the object
    const career = {
      ...forum.career_id.toObject(),
    };

    return {
      statusCode: 200,
      body: JSON.stringify({
        forum: {
          _id: forum._id,
          title: forum.title,
          description: forum.description,
          created_at: forum.created_at,
          final_date: forum.final_date,
          active: forum?.active,
          creator,
          career,
          comments,
          comments_count: forum.comments.length,
          participants_count: participants.length,
        },
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error retrieving forum: " + error.message,
      }),
    };
  } finally {
    // Close the connection
    await mongoose.connection.close();
  }
};
