import mongoose from "mongoose";

// Set `strictQuery: false` to globally opt into filtering by properties that aren't in the schema
// Included because it removes preparatory warnings for Mongoose 7.
// See: https://mongoosejs.com/docs/migrating_to_6.html#strictquery-is-removed-and-replaced-by-strict
mongoose.set("strictQuery", false);

const mongoDBURL = process.env.MONGODB_URL || "mongodb://localhost:27017/my_database";

async function main() {
  await mongoose.connect(mongoDBURL);
  console.log("Connected to MongoDB");
}

export default main;