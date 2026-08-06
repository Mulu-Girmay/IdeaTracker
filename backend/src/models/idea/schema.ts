import mongoose, { Schema } from "mongoose";
import { IIdea, IIdeaModel, IdeaStatus, IdeaCategory } from "./types.js";
import ideaStatics from "./statics.js";
import ideaMethods from "./method.js";

const IdeaSchema = new Schema<IIdea>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      default: "",
    },
    status: {
      type: String,
      enum: Object.values(IdeaStatus),
      default: IdeaStatus.DRAFT,
    },
    category: {
      type: String,
      enum: Object.values(IdeaCategory),
      default: IdeaCategory.OTHER,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

IdeaSchema.index({ owner: 1 });
IdeaSchema.index({ status: 1 });
IdeaSchema.index({ category: 1 });
IdeaSchema.index({ title: "text", description: "text" });

IdeaSchema.statics = { ...IdeaSchema.statics, ...ideaStatics } as any;
IdeaSchema.methods = { ...IdeaSchema.methods, ...ideaMethods } as any;

const Idea = mongoose.model<IIdea, IIdeaModel>("Idea", IdeaSchema);

export default Idea;
