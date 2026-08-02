import mongoose from "mongoose";

export interface ActorDoc {
  _id: mongoose.Types.ObjectId;
  name: string;
  about: string;
  gender: string;
  avatar?: { url: string; public_id: string };
}

// SchemaTypes
const actorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    about: {
      type: String,
      trim: true,
      required: true,
    },
    gender: {
      type: String,
      trim: true,
      required: true,
    },
    avatar: {
      type: Object,
      url: String,
      public_id: String,
    },
  },
  { timestamps: true }
);

// Text Index
actorSchema.index({ name: "text" });

export default mongoose.model<ActorDoc>("Actor", actorSchema);
