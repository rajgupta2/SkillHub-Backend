import { Response } from "express";
import prisma from "../config/db";
import { AuthRequest } from "../middlewares/auth.middleware";

export const leaderBoard=async (req:AuthRequest, res:Response) => {
  try {
    // Step 1: Get current user with college details
    const currentUser = await prisma.user.findUnique({
      where: { email: req.user!.email },
      select: {
        profile: {
          select: { college: true },
        },
        name:true,
      },
    });

    if (!currentUser!.profile?.college) {
      return res.status(404).json({ message: "You don't registered your college yet." });
    }

    const { district, state } = currentUser!.profile.college;

    const collegeLeaders = await prisma.user.findMany({
      where: {
        profile: {
          collegeId: currentUser!.profile.college.id,
        },
      },
      orderBy: {
        xpPoints: "desc",
      },
      select:{
        profile:{
          select:{
            college:{
              select:{
                name:true
              }
            }
          }
        },
        name:true,
        xpPoints:true
      }
    });

    // Step 2: Get top district leaderboard
    const districtLeaders = district.length>0 && await prisma.user.findMany({
      where: {
        profile: {
          college: {
            district:district
          },
        },
      },
      orderBy: { xpPoints: "desc" },
      select:{
        profile:{
          select:{
            college:{
              select:{
                name:true
              }
            }
          }
        },
        name:true,
        xpPoints:true
      }
    });

    // Step 3: Get top zonal (state-level) leaderboard
    const zonalLeaders = state.length>0 && await prisma.user.findMany({
      where: {
        profile:{
          college:{
            state:state
          }
        }
      },
      orderBy: { xpPoints: "desc" },
      select:{
        profile:{
          select:{
            college:{
              select:{
                name:true
              }
            }
          }
        },
        name:true,
        xpPoints:true
      }
    });

    // Step 4: Format data
    const formatLeaderboard = (list: any[]) =>
     list.map((p, i) => ({
        rank: i + 1,
        name:
          p.name === currentUser!.name
            ? `${p.name} (You)`
            : p.name,
        college: p.profile?.college?.name,
        xp: p.xpPoints,
    }));

    const leaderboardData = {
      college: formatLeaderboard(collegeLeaders),
      district: districtLeaders ? formatLeaderboard(districtLeaders) :[],
      zonal: zonalLeaders ? formatLeaderboard(zonalLeaders) : [],
    };

    res.status(200).json({ leaderboardData });
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ message: "Failed to fetch leaderboard data",error:err });
  }
}
