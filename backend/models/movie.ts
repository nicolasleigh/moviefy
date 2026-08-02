import mongoose from "mongoose";
import genres from "../utils/genres";

export interface MovieDoc {
  _id: mongoose.Types.ObjectId;
  title: string;
  storyLine: string;
  director?: mongoose.Types.ObjectId;
  releaseDate: Date;
  status: "public" | "private";
  type: string;
  genres: string[];
  tags: string[];
  cast: mongoose.Types.ObjectId[];
  writer?: mongoose.Types.ObjectId;
  poster?: { url: string; public_id: string; responsive: string[] };
  video?: { url: string; public_id: string };
  reviews: mongoose.Types.ObjectId[];
  language: string;
}

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      require: true,
    },
    storyLine: {
      type: String,
      trim: true,
      require: true,
    },
    director: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Actor",
    },
    releaseDate: {
      type: Date,
      require: true,
    },
    status: {
      type: String,
      require: true,
      enum: ["public", "private"],
    },
    type: {
      type: String,
      require: true,
    },
    genres: {
      type: [String],
      require: true,
      enum: genres,
    },
    tags: {
      type: [String],
      require: true,
    },
    cast: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Actor",
        // actor: { type: mongoose.Schema.Types.ObjectId, ref: "Actor" },
        // roleAs: String,
        // leadActor: Boolean,
      },
    ],
    writer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Actor",
    },

    poster: {
      type: Object,
      url: { type: String, required: true },
      public_id: { type: String, required: true },
      responsive: [URL],
      required: true,
    },
    video: {
      type: Object,
      url: { type: String, required: true },
      public_id: { type: String, required: true },
      required: true,
    },
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
    language: {
      type: String,
      require: true,
    },
  },
  { timestamps: true }
);

const Movie = mongoose.model<MovieDoc>("Movie", movieSchema);
export default Movie;

// module.exports = mongoose.model('Movie', movieSchema);
