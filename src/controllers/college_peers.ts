import { Response } from "express";
import prisma from "../config/db";
import { AuthRequest } from "../middlewares/auth.middleware";

export const getCollegePeers=async (req:AuthRequest, res:Response)=>{
    try {
    const student = await prisma.user.findUnique({
      where: { email: req.user!.email },
      select: { profile:{ select:{ collegeId:true} } },
    });

    if (!student || !student.profile?.collegeId) {
      return res.status(404).json({ message: "You don't registerd your college yet." });
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
}
