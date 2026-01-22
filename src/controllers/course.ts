import { AuthRequest } from "../middlewares/auth.middleware";
import Course from "./course-schema";
import { Response } from "express";
import prisma from "../config/db";
import slugify from "slugify";
import { nanoid } from "nanoid";

function generateCourseSlug(title: string) {
  return `${slugify(title, { lower: true })}--${nanoid(6)}`;
}

export const getCourse= async (req:AuthRequest, res:Response) => {
  const courses = await Course.find()
    .sort({ createdAt: -1 })
    .select("-links.content -owner.email"); // optional: preview only

  res.json(courses);
}

export const postCourse= async (req:AuthRequest, res:Response) => {
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
      slug:generateCourseSlug(title),
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
  const course = await Course.findById(req.params.id).select("-owner.email");

  if (!course) {
    return res.status(404).json({ error: "Course not found" });
  }

  res.json(course);
}

export const getCourseBySlug= async (req:AuthRequest, res:Response) => {
  const course = await Course.findOne({slug:req.params.slug}).select("-owner.email");

  if (!course) {
    return res.status(404).json({ error: "Course not found" });
  }

  return res.status(200).json(course);
}

export const getCourseByLinkId= async (req:AuthRequest, res:Response) => {
  const course = await Course.findById(req.params.id).select("-owner.email");

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

export const updateCourseBySlugLinkId = async (req: AuthRequest,res: Response) => {

  try {
    const { courseSlug, linkSlug } = req.params;
    const { updateLink } = req.body;
    if (!courseSlug || !linkSlug) {
      return res.status(400).json({ error: "Invalid params" });
    }

    const course = await Course.findOne({
      slug: courseSlug,
      "owner.email": req.user!.email,
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found or unauthorized" });
    }

    const link = course.links.find(l => l.linkId === updateLink.linkId);

    if (!link) {
      course.links.push(updateLink);
    }else{
      course.links=course.links.filter((l)=>{
        if(l.linkId === updateLink.linkId)
         l.content = updateLink.content;
        return l;
      });
    }
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