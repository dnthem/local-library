import mongoose from "mongoose";

const Schema = mongoose.Schema;

const genreSchema = new Schema({
  name: { type: String, required: true, min: 3, max: 100},
});

genreSchema.virtual("url").get(function () {
  return "/catalog/genre/" + this._id;
});

export default mongoose.model("Genre", genreSchema);