import mongoose, { Schema, Document } from "mongoose";

export interface CourseDocument extends Document {
  title: string;
  description?: string;

  slug: string,

  links: {
    linkId: string;
    title: string;
    order: number;
    content: any; // editor JSON
  }[];

  owner: {
    name: string;
    email: string;
  };

  status: "published";

  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<CourseDocument>(
  {
    title: { type: String, required: true },
    description: String,
    slug: { type: String, required: true, unique: true, index: true },
    links: [
      {
        linkId: String,
        title: String,
        order: Number,
        content: Schema.Types.Mixed,
      },
    ],

    owner: {
      name: { type: String, required: true },
      email: { type: String, required: true},
    },

    status: {
      type: String,
      enum: ["published"],
      default: "published",
    },
  },
  { timestamps: true }
);

export default mongoose.model<CourseDocument>("Course", CourseSchema);
