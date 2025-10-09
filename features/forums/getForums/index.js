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

export const handler = async () => {
  try {
    await mongoose.connect(uri);

    // Get all forums
    // just include the title, description, creator_id, career_id, created_at and final_date
    // populate the creator_id with first_name, last_name and role
    // populate the career_id with nombre_carrera and facultad
    const allForums = await ForumModel.find({})
      .select(
        "title description creator_id career_id created_at final_date comments"
      )
      .populate("creator_id", "first_name last_name role image_url")
      .populate("career_id", "nombre_carrera facultad");

    // For each forum, get number of comments and unique participants
    const forumsWithCounts = await Promise.all(
      allForums.map(async (forum) => {
        let participants = [];
        if (forum.comments && forum.comments.length > 0) {
          // Get unique user_ids from comments
          const userIds = [
            ...new Set(
              forum.comments.map((comment) => comment.user_id.toString())
            ),
          ];
          participants = await UserModel.find({
            _id: { $in: userIds },
          });
        }
        // Convert forum to plain object and add counts
        const forumObj = forum.toObject();
        return {
          ...forumObj,
          comments: forum.comments.length,
          participants: participants.length,
        };
      })
    );

    // format career_id to career and creator_id to creator
    const forums = forumsWithCounts.map((forum) => {
      const creator = forum.creator_id
        ? {
            _id: forum.creator_id._id,
            first_name: decrypt(forum.creator_id?.first_name),
            last_name: decrypt(forum.creator_id?.last_name),
            role: forum.creator_id.role,
            image_url: decrypt(forum.creator_id?.image_url),
          }
        : null;

      return {
        _id: forum._id,
        title: forum.title,
        description: forum.description,
        creator,
        career: forum.career_id,
        created_at: forum.created_at,
        final_date: forum.final_date,
        comments_count: forum.comments,
        participants_count: forum.participants,
      };
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        forums,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error retrieving forums: " + error.message,
      }),
    };
  } finally {
    // Close the connection
    await mongoose.connection.close();
  }
};
