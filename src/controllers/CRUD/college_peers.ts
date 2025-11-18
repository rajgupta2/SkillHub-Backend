import express from "express";
import prisma from "../../config/db";
import { AuthRequest } from "../../middlewares/auth.middleware";

const college_peers=express.Router();

college_peers.get("/",  async (req:AuthRequest, res) => {
  try {
    const student = await prisma.user.findUnique({
      where: { email: req.user!.email },
      include: { profile: true },
    });

    if (!student || !student.profile?.collegeId) {
      return res.status(404).json({ message: "Student or college not found" });
    }

    const peers = await prisma.user.findMany({
      where: {
        profile: {
          collegeId: student.profile.collegeId,
        },
       // NOT: { email: student.email }, // exclude current user
      },
      select: {
        name: true,
        profile: {
          select: {
            course: { select: { name: true } },
            startYear: true,
            endYear: true,
          },
        },
      },
    });

    res.json({ peers });
  } catch (error) {
    console.error("Error fetching peers:", error);
    res.status(500).json({ message: "Server error fetching peers" });
  }
});

export default college_peers;
