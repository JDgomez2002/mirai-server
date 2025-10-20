import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.URI;

if (!uri) {
  throw new Error("URI not found in the environment");
}

export const handler = async (event, _) => {
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    // 1. Total number of students (users with role = "student")
    const totalStudents = await usersCollection.countDocuments({
      role: "student",
    });

    // 2. Students (role=student) with quizCompletedAt that is a date and not null
    const studentCompletedTests = await usersCollection.countDocuments({
      role: "student",
      quizCompletedAt: { $type: "date", $ne: null },
    });

    // 3. Count of students joined by month for current year, using created_at
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear() + 1, 0, 1);

    // Group count by month (1-12)
    const studentsJoinedByMonthAgg = await usersCollection
      .aggregate([
        {
          $match: {
            role: "student",
            created_at: { $gte: yearStart, $lt: yearEnd },
          },
        },
        {
          $group: {
            _id: { $month: "$created_at" },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ])
      .toArray();

    // Turn aggregation result into an array [month: count] for all months (1-12)
    const joinedByMonth = Array(12)
      .fill(0)
      .reduce((acc, _, i) => {
        const found = studentsJoinedByMonthAgg.find((m) => m._id === i + 1);
        acc[i + 1] = found ? found.count : 0;
        return acc;
      }, {});

    return {
      statusCode: 200,
      body: JSON.stringify({
        totalStudents,
        studentCompletedTests,
        studentsJoinedByMonth: joinedByMonth,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error getting analytics: " + error.message,
      }),
    };
  } finally {
    // Close the connection
    await mongoose.connection.close();
  }
};
