import { Request,Response } from "express";
import prisma  from "../config/db";
import { AuthRequest } from "src/middlewares/auth.middleware";

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

