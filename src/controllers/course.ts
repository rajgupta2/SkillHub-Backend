import { AuthRequest } from "../middlewares/auth.middleware";
import Course from "./course-schema";
import { Response } from "express";
import prisma from "../config/db";
import { connectDB } from "../config/mongoDB";

export const getCourse= async (req:AuthRequest, res:Response) => {
  await connectDB();
  const courses = await Course.find()
    .sort({ createdAt: -1 })
    .select("-links.content"); // optional: preview only

  res.json(courses);
}

export const postCourse= async (req:AuthRequest, res:Response) => {
  await connectDB();
  try {
    const { title, description, links } = req.body;

    if (!title || !links?.length) {
      return res.status(400).json({ error: "Invalid course data" });
    }

    // Bind ownership from token
    const user=await prisma.user.findUnique({
        where:{
            email:req.user!.email
        },
        select:{
          name:true
        }
    })

    const owner = {
      name:user?.name,
      email: req.user!.email,
    };

    const course = await Course.create({
      title,
      description,
      links,
      owner,
      status: "published",
    });

    return res.json({ published: true, courseId: course._id });
  } catch (error) {
    console.error("Publish failed", error);
    res.status(500).json({ error: "Publish failed" });
  }
}

export const postCourseByLinkId= async (req:AuthRequest, res:Response) => {
  await connectDB();
  try {
    const { courseId, linkId } = req.params;
    const { title,content } = req.body;

    if (!courseId || !linkId) {
      return res.status(400).json({ error: "Invalid params" });
    }

    const course = await Course.findOne({
      _id: courseId,
      "owner.email": req.user!.email,
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found or unauthorized" });
    }

    const link = {
      linkId,
      title,
      order: course.links.length + 1,
      content
    }

    course.links.push(link);
    course.markModified("links");
    await course.save();
    return res.status(201).json({
      created: true,
      course,
    });
  } catch (error) {
    console.error("Publish failed", error);
    res.status(500).json({ error: "Publish failed" });
  }
}

export const getCourseById= async (req:AuthRequest, res:Response) => {
  await connectDB();
  const course = await Course.findById(req.params.id);

  if (!course) {
    return res.status(404).json({ error: "Course not found" });
  }

  res.json(course);
}

export const getCourseByLinkId= async (req:AuthRequest, res:Response) => {
  await connectDB();
  const course = await Course.findById(req.params.id);

  if (!course) {
    return res.status(404).json({ error: "Course not found" });
  }
  const linkId=req.params.linkId;

  const link = course.links.find(
    (l) => l.linkId === linkId
  );

  if (!link) {
    return res.status(404).json({ error: "Link not found" });
  }

  return res.json(link);
}

export const updateCourseById= async (req:AuthRequest, res:Response) => {
  await connectDB();
  const course = await Course.findById(req.params.id);

  if (!course) {
    return res.status(404).json({ error: "Course not found" });
  }

  // Ownership check
  if (course.owner.email !== req.user!.email) {
    return res.status(403).json({ error: "Not owner" });
  }

  course.title = req.body.title ?? course.title;
  course.links = req.body.links ?? course.links;

  await course.save();

  res.json({ updated: true });
}

export const deleteCourseById=async (req:AuthRequest, res:Response) => {
  await connectDB();
  const course = await Course.findById(req.params.id);

  if (!course) {
    return res.status(404).json({ error: "Not found" });
  }

  if (course.owner.email !== req.user!.email) {
    return res.status(403).json({ error: "Not owner" });
  }

  await course.deleteOne();
  res.json({ deleted: true });
}

export const updateCourseByLinkId = async (req: AuthRequest,res: Response) => {
  await connectDB();

  try {
    const { courseId, linkId } = req.params;
    const { content } = req.body;

    if (!courseId || !linkId) {
      return res.status(400).json({ error: "Invalid params" });
    }

    const course = await Course.findOne({
      _id: courseId,
      "owner.email": req.user!.email,
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found or unauthorized" });
    }

    const link = course.links.find(l => l.linkId === linkId);

    if (!link) {
      return res.status(404).json({ error: "Link not found" });
    }

    link.content = content;
    course.markModified("links");
    await course.save();
    return res.json({
      updated: true,
      link,
    });
  } catch (error) {
    console.error("Link update failed", error);
    return res.status(500).json({ error: "Link update failed" });
  }
};