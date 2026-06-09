import { Request,Response } from "express";
import prisma  from "../config/db.js";
import { AuthRequest } from "../../src/middlewares/auth.middleware.js";

export const getAllColleges=async (req: Request, res:Response) => {
  try {

    const college=await prisma.college.findMany();
    college
        ? res.status(200).json(college)
        : res.status(400).json({message:"Colleges Not Found."});

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch college.",error });
  }
}

export const getAllCollegeCourses=async (req: Request, res:Response) => {
  try {

    const courses=await prisma.course.findMany();
    courses
        ? res.status(200).json(courses)
        : res.status(400).json({message:"Courses Not Found."});

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch courses.",error });
  }
}

export const getCollegeById=async (req: Request, res:Response) => {
  try {

    const college=await prisma.college.findUnique({
        where:{
            id:Number(req.params.id)
        }
    })
    college
        ?  res.status(200).json({college})
        : res.status(400).json({message:"College Not Found."});

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch college.",error });
  }
}

export const getAuthUserCollege=async (req: AuthRequest, res:Response) => {
  try {

    const studentProfile=await prisma.studentProfile.findUnique({
        where:{
            email:req.user!.email
        },
        select:{college:true}
    })

    studentProfile?.college
        ? res.status(200).json({college:studentProfile.college})
        : res.status(400).json({message:"College Not Found."})

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch college.",error });
  }
}

export const deleteCollegeById=async (req: Request, res:Response) => {
  try {

    const college=await prisma.college.delete({
        where:{
            id:Number(req.params.id)
        }
    })
    college
        ?  res.status(200).json({college,message:"College deleted Successfully."})
        : res.status(400).json({message:"College Not Found."});

  } catch (error) {
    res.status(500).json({ message: "Failed to delete college.",error });
  }
}

export const deleteCollegeCourseById=async (req: Request, res:Response) => {
  try {
    const course=await prisma.course.delete({
        where:{
            id:Number(req.params.id)
        }
    })
    course
        ?  res.status(200).json({course,message:"Course deleted Successfully."})
        : res.status(400).json({message:"Course Not Found."});

  } catch (error) {
    res.status(500).json({ message: "Failed to delete course.",error });
  }
}