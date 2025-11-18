import express from "express";
import {AuthRequest} from "../middlewares/auth.middleware";
import profile from "./CRUD/profile";
import suggestions  from "./CRUD/suggestions";
import contribute from "./CRUD/contribute";
import college_peers from "./CRUD/college_peers";
import leaderboard from "./CRUD/leaderboard";
import prisma from "../config/db";

const router = express.Router();
router.use("/suggestions",suggestions);
router.use(["/contribute", "/get-materials"],contribute);   //Materials get and post
router.use("/profile",profile);
router.use("/college-peers",college_peers);
router.use("/leaderboard",leaderboard);


router.get("/dashboard-stats", async (req:AuthRequest, res) => {
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
              student: true,
              college: true,
            },
          },
          _count: {
              select: { materials: true },
          },
      },
    });


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

    const rank = districtLeaders.findIndex((u) => u.email === email) + 1;

    res.json({
       name: user!.name,
       email: user!.email,
       role: user!.role,
       xpPoints: user!._count.materials * 5,
       materialsCount:user!._count.materials,
       rank:rank
     });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
});


export default router;