import { AuthRequest } from "../middlewares/auth.middleware.js";
import Course, { Tutorials } from "./course-schema.js";
import { Response } from "express";
import slugify from "slugify";
import { nanoid } from "nanoid";
import mongoose from "mongoose";

function generateCourseSlug(title: string) {
  return `${slugify(title, { lower: true })}--${nanoid(6)}`;
}

function generateLinkSlug(title: string) {
  if (!title) return "";
  title = title.trim();
  return `${slugify(title, { lower: true })}`;
}

export const getCourse = async (req: AuthRequest, res: Response) => {
  const courses = await Course.find().sort({ createdAt: 1 }).select("-links"); // optional: preview only

  return res.status(200).json(courses);
};

export const getCourseBySlug = async (req: AuthRequest, res: Response) => {
  const course = await Course.findOne({
    slug: req.params.slug,
  }).populate({
    path: "links",
    select: "-content -owner.email",
  });

  if (!course) {
    return res.status(404).json({ error: "Course not found" });
  }

  return res.status(200).json(course);
};

export const getAllUserTutorials = async (req: AuthRequest, res: Response) => {
  const tutorials = await Tutorials.find({
    "owner.email": req.user?.email,
  }).select("-content -owner.email");

  return res.status(200).json(tutorials);
};

export const getTutorialBySlug = async (req: AuthRequest, res: Response) => {
  const tutorial = await Tutorials.findOne({
    courseSlug: req.params.courseSlug,
    slug: req.params.linkSlug,
  }).lean();

  if (!tutorial) {
    return res.status(404).json({ error: "Tutorial does not found" });
  }

  const isTutorialOwner = tutorial.owner.email === req.user?.email;
  if (tutorial.status === "published" || isTutorialOwner) {
    const { email, ...owner } = tutorial.owner;
    const t = {
      ...tutorial,
      owner,
    };
    return res.status(200).json({ tutorial: t, isTutorialOwner });
  }

  return res.status(401).json({ error: "You are unauthorized." });
};

export const postCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: "Invalid course data" });
    }

    const course = await Course.create({
      title,
      description,
      slug: generateCourseSlug(title),
    });

    return res.status(201).json({ created: true, courseId: course._id });
  } catch (error) {
    console.error("Course creation failed", error);
    res.status(500).json({ error: "Course creation failed" });
  }
};

export const postTutorial = async (req: AuthRequest, res: Response) => {
  try {
    const { courseSlug } = req.params;
    const { title, status } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: "You are unauthorized" });
    }

    if (!courseSlug || !title || !status) {
      return res.status(400).json({ error: "Invalid params" });
    }

    const course = await Course.findOne({ slug: courseSlug });
    if (!course) {
      return res.status(404).json({
        error: "Course not found",
      });
    }

    const order = await Tutorials.find({
      courseSlug: courseSlug,
    }).countDocuments();
    const tutorial = await Tutorials.create({
      title,
      slug: generateLinkSlug(title),
      courseSlug,
      owner: {
        name: req.user.name,
        email: req.user.email,
      },
      order: order + 1,
      status,
    });

    await Course.updateOne(
      { slug: courseSlug },
      {
        $addToSet: {
          links: tutorial._id,
        },
      },
    );

    return res.status(201).json({
      created: true,
      tutorial,
    });
  } catch (error) {
    const err =
      "Tutorial creation failed. Tutorial with same title may be occured. Please change tutorial title.";
    console.error(err);
    res.status(500).json({ error: err });
  }
};

export const deleteTutorialBySlug = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  if (!req.user) {
    return res.status(401).json({ error: "You are unauthorized." });
  }
  try {
    session.startTransaction();

    const tutorial = await Tutorials.findOne({
      slug: req.params.linkSlug,
      courseSlug: req.params.courseSlug,
      "owner.email": req.user.email,
    }).session(session);

    if (!tutorial) {
      await session.abortTransaction();
      return res.status(404).json({ error: "Tutorial not found" });
    }

    const courseResult = await Course.updateOne(
      { slug: req.params.courseSlug },
      {
        $pull: {
          links: tutorial._id,
        },
      },
      { session },
    );

    if (courseResult.matchedCount === 0) {
      throw new Error("Course not found");
    }

    await Tutorials.deleteOne(
      {
        _id: tutorial._id,
      },
      { session },
    );
    await session.commitTransaction();

    return res.status(200).json({ message: "Tutorial deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    console.error(error);

    return res.status(500).json({ error: "Failed to delete tutorial" });
  } finally {
    await session.endSession();
  }
};

export const updateTutorialBySlug = async (req: AuthRequest, res: Response) => {
  try {
    const { courseSlug, linkSlug } = req.params;
    const { content } = req.body;

    if (!courseSlug || !linkSlug) {
      return res.status(400).json({ error: "Invalid params" });
    }

    if (!req.user) {
      return res.status(401).json({ error: "You are unauthorized." });
    }

    const tutorial = await Tutorials.updateOne(
      {
        courseSlug,
        slug: linkSlug,
        "owner.email": req.user.email,
      },
      {
        content,
      },
    );

    return res.status(200).json({ updated: true, tutorial });
  } catch (error) {
    console.error("Link update failed", error);
    return res.status(500).json({ error: "Link update failed" });
  }
};