import { Response } from "express";
import prisma from "../config/db";
import { AuthRequest } from "../middlewares/auth.middleware";

const calculateRank=async (district:any,email:string)=>{

    if(!district) return 1;

    // 4️⃣ Compute District Rank
    const districtLeaders = district.length>0 && await prisma.user.findMany({
      where: {
        profile: {
          college: {
            district
          },
        },
      },
      orderBy: { xpPoints: "desc" },
      select:{
        name:true,
        xpPoints:true,
        email:true
      }
    });

    const rank = districtLeaders ? districtLeaders.findIndex((u) => u.email === email) + 1 : 1;
    return rank;
};

export const dashboardStats= async (req: AuthRequest, res:Response) => {
  try {
    const email = req.user!.email;

    const user = await prisma.user.findUnique({
      where: { email },
        select: {
          name: true,
          email: true,
          role: true,
          xpPoints:true,
          profile: {
              include: {
                  course: true,
                  college: true,
              },
          },
          _count: {
              select: { materials: true },
          },
        },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    //calculate district rank
    const rank= await calculateRank(user.profile?.college?.district,email);

    res.status(200).json({
       name: user.name,
       role: user.role,
       xpPoints: user.xpPoints,
       materials_count:user._count.materials,
       rank:rank
     });
  } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile",  error});
  }
}

export const getProfile=async (req: AuthRequest, res:Response) => {
  try {
    const email = req.params.email || req.user!.email;

    const user = await prisma.user.findUnique({
      where: { email },
        select: {
          name: true,
          email: true,
          role: true,
          xpPoints:true,
          profile: {
              include: {
                  course: true,
                  college: true,
              },
          },
          _count: {
              select: { materials: true },
          },
        },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    //calculate district rank
    const rank= await calculateRank(user.profile?.college?.district,email);

    res.status(200).json({
       name: user.name,
       email: user.email,
       role: user.role,
       xpPoints: user.xpPoints,
       college_id: user.profile?.college?.id,
       college: user.profile?.college?.name ?? null,
       college_city: user.profile?.college?.city ?? null,
       college_district: user.profile?.college?.district ?? null,
       college_state: user.profile?.college?.state ?? null,
       course_id: user.profile?.course?.id ?? null,
       course: user.profile?.course?.name ?? null,
       startYear: user.profile?.startYear,
       endYear: user.profile?.endYear,
       materials_count:user._count.materials,
       rank:rank
     });
  } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile",error });
  }
}

export const updateProfile=async (req: AuthRequest, res:Response) => {
  try {
    const email = req.user!.email;
    const {
      name,
      college,
      college_id,
      college_city,
      college_district,
      college_state,
      course_id,
      course,
      startYear,
      endYear,
    } = req.body.profile;

    // Create or update College
    const NewCollege = await prisma.college.upsert({
      where: { id: Number(college_id) || 0 }, // 0 will never match any record
      create: {
        name: college,
        city: college_city,
        district: college_district,
        state: college_state,
      },
      update: {
        name: college,
        city: college_city,
        district: college_district,
        state: college_state,
      },
    });

    // Create or update Course
    const NewCourse=await prisma.course.upsert({
      where:{
        id: Number(course_id) || 0
      },
      create:{
        name: course
      },
      update:{
        name: course
      }
    });

    // Update User and StudentProfile
    const updated = await prisma.user.update({
      where: { email },
      data: {
        name,
        profile: {
          upsert: {
            create: {
              startYear:parseInt(startYear),
              endYear:parseInt(endYear),
              college: { connect: { id: NewCollege.id } },
              course: { connect: { id: NewCourse.id } },
            },
            update: {
              startYear:parseInt(startYear),
              endYear:parseInt(endYear),
              college: { connect: { id: NewCollege.id } },
              course: { connect: { id: NewCourse.id } },
            },
          },
        },
      },
      include: {
        profile: {
          include: {
            college: true,
            course: true,
          },
        },
        _count: { select: { materials: true } },
      },
    });

     res.status(200).json({
      message: "Profile updated successfully",
      updated: {
        name: updated.name,
        email: updated.email,
        role: updated.role,
        xpPoints: updated.xpPoints,
        college_id: updated.profile!.college?.id,
        college: updated.profile!.college?.name,
        college_city: updated.profile!.college?.city,
        college_district: updated.profile!.college?.district,
        college_state: updated.profile!.college?.state,
        course_id: updated.profile!.course?.id,
        course: updated.profile!.course?.name,
        startYear: updated.profile!.startYear,
        endYear: updated.profile!.endYear,
        materials_count: updated._count.materials,
      },
    });

  } catch (error) {
      res.status(500).json({ message: "Failed to update profile" ,error});
  }
}