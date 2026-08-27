import mongoose from "mongoose";

const tutorialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: mongoose.Schema.Types.Mixed,
    slug: { type: String, required: true }, //linkSlug
    order: { type: Number, required: true },
    courseSlug: {
      type: String,
      required: true,
    },
    owner: {
      type: {
        name: { type: String, required: true },
        email: { type: String, required: true },
      },
      required: true,
    },
    status: {
      type: String,
      enum: ["published", "draft"],
      default: "draft",
    },
  },
  { timestamps: true },
);

tutorialSchema.index({ courseSlug: 1, slug: 1 }, { unique: true });
export const Tutorials=mongoose.model("Tutorials",tutorialSchema);

const CourseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    links: [{
      type:mongoose.Schema.Types.ObjectId,
      ref:"Tutorials"
    }],
  },
  { timestamps: true },
);

const Course=mongoose.model("CourseProd", CourseSchema);
export default Course;
