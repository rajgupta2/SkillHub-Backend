import slugify from "slugify";
import prisma from "../config/db";
import { AuthRequest } from "../middlewares/auth.middleware";
import { Response } from "express";
import { nanoid } from "nanoid";

type JobType = "FULL_TIME" | "PART_TIME" | "INTERNSHIP" | "CONTRACT" | "FREELANCE";
type ExperienceLevel = "FRESHER" | "JUNIOR" | "MID" | "SENIOR";
type JobSchema={
    title:string;
    descriptionJson:string;
    descriptionHtml:string;
    companyName:string;
    location:string;
    jobType:JobType;
    experienceLevel:ExperienceLevel;
    salaryRange:string | null;
    applyUrl:string;
    isRemote:boolean;
    isActive:boolean;
    expiryDate:string;
}

function generateJobSlug(title: string) {
  return `${slugify(title, { lower: true })}--${nanoid(6)}`;
}

export const getAllJobs=async (req:AuthRequest,res:Response)=>{
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({jobs});
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: "Internal Server error" });
  }
}

export const getJobBySlug=async (req:AuthRequest,res:Response)=>{
  try {
    const { slug } = req.params;

    const job = await prisma.job.findFirst({
      where: {
        slug,
      },
    });

    return res.status(200).json({job});
  } catch (e) {
    console.error("Error fetching job:", e);
    res.status(500).json({ error: "Internal Server error" });
  }
}

export const postJob=async (req:AuthRequest,res:Response)=>{
  try {
    const jobs:JobSchema[] = req.body;

    if(jobs.length==0) return  res.status(500).json({ error: "No Job Array Found." });

    jobs.forEach(async (job)=>{
      if (!job.title || !job.descriptionJson) {
          return res.status(400).json({ error: "Missing fields" });
      }

      await prisma.job.create({
        data: {
          title:job.title,
          slug: generateJobSlug(`${job.companyName} ${job.title}`),
          descriptionJson:job.descriptionJson,
          descriptionHtml:job.descriptionHtml,
          companyName:job.companyName,
          location:job.location,
          jobType:job.jobType,
          experienceLevel:job.experienceLevel,
          salaryRange:job.salaryRange,
          applyUrl:job.applyUrl,
          isRemote:job.isRemote,
          isActive:job.isActive,
          expiryDate:job.expiryDate,
        },
      });
    })

    res.status(201).json({ message: `${jobs.length} Job Created Successfully.`, jobs });
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: "Server error" });
  }
}

export const updateJob=async (req:AuthRequest,res:Response)=>{
  try {
    const { slug } = req.params;
    const {
        title, descriptionJson, descriptionHtml, companyName,
        location, jobType, experienceLevel, salaryRange, applyUrl,
        isRemote, isActive, expiryDate
    } = req.body;


    if (!title || !descriptionJson) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const updatedJob = await prisma.job.update({
      where: { slug: slug },
      data: {
        title,
        slug: generateJobSlug(title),
        descriptionJson, descriptionHtml, companyName,
        location, jobType, experienceLevel, salaryRange, applyUrl,
        isRemote, isActive, expiryDate,
      },
    });

    if (!updatedJob) {
      return res.status(403).json({ message: "You are not authorized to update this job." });
    }

    return res.status(200).json({
      message: "Job updated successfully",
      job: updatedJob
    });

  } catch (err: any) {

    // Prisma "record not found" error
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Job not found" });
    }

    return res.status(500).json({
      error: err.message || "Something went wrong"
    });
  }
}

export const deleteJobBySlug=async (req:AuthRequest,res:Response)=>{
  try{
    const { slug } = req.params;
    if (!slug) {
      return res.status(400).json({ error: "Invalid slug" });
    }

    const job=await prisma.job.deleteMany({
      where:{
        slug:slug
      }
    });

    if (job.count===0) {
      return res.status(403).json({ message: "You are not authorized to delete this job." });
    }

    return res.status(200).json({
      message: "job deleted successfully",
      job
    });
  }catch(err:any){
    return res.status(500).json({
      error: err.message || "Something went wrong"
    });
  }
}
