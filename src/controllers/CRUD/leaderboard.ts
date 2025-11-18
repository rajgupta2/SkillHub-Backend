import express from "express";
import prisma from "../../config/db";
import { AuthRequest } from "../../middlewares/auth.middleware";

const leaderboard=express.Router();

leaderboard.get("/", async (req:AuthRequest, res) => {
  try {
    // Step 1: Get current user with college details
    const currentUser = await prisma.user.findUnique({
      where: { email: req.user!.email },
      select: {
        name: true,
        email: true,
        role: true,
        profile: {
          include: { college: true },
        },
        _count: {
            select: { materials: true },
        },
      },
    });

    if (!currentUser!.profile?.college) {
      return res.status(404).json({ message: "User or college not found" });
    }

    const { district, state } = currentUser!.profile.college;

    const collegeLeaders = await prisma.studentProfile.findMany({
      where: { collegeId: currentUser!.profile.collegeId },
      orderBy: { xpPoints: "desc" },
      include: { student: true, college: true },
    });


    // Step 2: Get top district leaderboard
    const districtLeaders = await prisma.studentProfile.findMany({
      where: {
        college: { district },
      },
      orderBy: { xpPoints: "desc" },
      include: {
        student: true,
        college: true,
      },
    });

    // Step 3: Get top zonal (state-level) leaderboard
    const zonalLeaders = await prisma.studentProfile.findMany({
      where: {
        college: { state },
      },
      orderBy: { xpPoints: "desc" },
      take: 5,
      include: {
        student: true,
        college: true,
      },
    });

    // Step 4: Format data
    const formatLeaderboard = (list: any[]) =>
     list.map((p, i) => ({
        rank: i + 1,
        name:
          p.student.name === currentUser!.name
            ? `${p.student.name} (You)`
            : p.student.name,
        college: p.college.name,
        xp: p.xpPoints,
    }));

    const leaderboardData = {
      college: formatLeaderboard(collegeLeaders),
      district: formatLeaderboard(districtLeaders),
      zonal: formatLeaderboard(zonalLeaders),
    };

    res.json({ leaderboardData });
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ message: "Failed to fetch leaderboard data" });
  }
});


export default leaderboard;