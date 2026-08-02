import mongoose from "mongoose";

export interface ReviewDoc {
  _id: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  parentMovie: mongoose.Types.ObjectId;
  content: string;
  rating: number;
}

const reviewSchema = new mongoose.Schema({
  // owner parentMovie rating content
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  parentMovie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Movie",
    required: true,
  },
  content: {
    type: String,
    trim: true,
  },
  rating: {
    type: Number,
    required: true,
  },
});

export default mongoose.model<ReviewDoc>("Review", reviewSchema);
