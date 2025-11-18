import express from "express";
import prisma from "../../config/db";
import { AuthRequest } from "../../middlewares/auth.middleware";

const router = express.Router();

const calculateRank=async (user:any)=>{

    // 1️⃣ Get user profile
    const userProfile = user!.profile;

    // 4️⃣ Compute District Rank
    const districtLeaders = await prisma.studentProfile.findMany({
      where: {
        college: { district: userProfile?.college?.district },
      },
      orderBy: { xpPoints: "desc" },
      select: { email: true, xpPoints: true },
    });

    const rank = districtLeaders.findIndex((u) => u.email === user.email) + 1;
    return rank;
};

router.get("/",  async (req: AuthRequest, res) => {
  try {
    const email = req.user!.email;

    const user = await prisma.user.findUnique({
        where: { email },
        select: {
            name: true,
            email: true,
            role: true,
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

    const rank= await calculateRank(user);

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
       name: user.name,
       email: user.email,
       role: user.role,
       xpPoints: user._count.materials * 5,
       college_id: user.profile?.college?.id ?? null,
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
        res.status(500).json({ message: "Failed to fetch profile" });
  }
});

/**
 * → Update user name, course, and year info
 */
router.put("/", async (req: AuthRequest, res) => {
  try {
    const email = req.user?.email;
    let {
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
    let NewCollege;
    if (!college_id) {
      NewCollege = await prisma.college.create({
        data: {
          name: college ?? "",
          city: college_city ?? "",
          district: college_district ?? "",
          state: college_state ?? "",
        },
      });
    } else {
      NewCollege = await prisma.college.update({
        where: { id: college_id },
        data: {
          name: college ?? "",
          city: college_city ?? "",
          district: college_district ?? "",
          state: college_state ?? "",
        },
      });
    }

    // Create or update Course
    let NewCourse;
    if (!course_id) {
      NewCourse = await prisma.course.create({
        data: {
          name: course ?? "",
        },
      });
    } else {
      NewCourse = await prisma.course.update({
        where: { id: course_id },
        data: {
          name: course ?? "",
        },
      });
    }

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

     res.json({
      message: "Profile updated successfully",
      updated: {
        name: updated.name,
        email: updated.email,
        role: updated.role,
        xpPoints: updated.profile?.xpPoints ?? 0,
        college_id: updated.profile?.college?.id ?? null,
        college: updated.profile?.college?.name ?? null,
        college_city: updated.profile?.college?.city ?? null,
        college_district: updated.profile?.college?.district ?? null,
        college_state: updated.profile?.college?.state ?? null,
        course_id: updated.profile?.course?.id ?? null,
        course: updated.profile?.course?.name ?? null,
        startYear: updated.profile?.startYear,
        endYear: updated.profile?.endYear,
        materials_count: updated._count.materials,
      },
    });

  } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
  }
});

export default router;
