import { Response } from "express";
import prisma  from "../config/db";
import { AuthRequest } from "../middlewares/auth.middleware";



//Students only see their own suggestions and admin all
export const getSuggestions=async (req: AuthRequest, res:Response) => {
  try {
    const user = req.user!;
    const isAdmin = user.role === "Admin";

    const suggestions = await prisma.suggestion.findMany({
      where: isAdmin ? {} : { userId: user.email },
      include: {
        suggestedBy: {
          select: { name: true, email: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json(suggestions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch suggestions.",error });
  }
}

export const postSuggestion=async (req: AuthRequest, res:Response) => {
  try {
    const { title, message } = req.body;
    const userId = req.user!.email;

    const suggestion = await prisma.suggestion.create({
      data: { title, message, userId },
    });

    res.status(201).json({
      message: "Suggestion Submitted Successfully.",
      suggestion,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to save suggestion.",error });
  }
}

export const updateStatus_Suggestion=async (req: AuthRequest, res:Response) => {
  try {
    const  id = req.params;
    const  status :  "Pending" | "Reviewed" | "Implemented"= req.params.status as "Pending" | "Reviewed" | "Implemented";

    const updated = await prisma.suggestion.update({
      where: { id: Number(id) },
      data: { status },
    });

    res.json({ message: "Suggestion status updated.", updated });
  } catch (error) {
    res.status(500).json({ message: "Failed to update suggestion status.",error });
  }
}

export const updateSuggestionById=async (req: AuthRequest, res:Response) => {
  try {
    const id=Number(req.params.id);
    const { title, message } = req.body;
    const userId = req.user!.email;

    const suggestion = await prisma.suggestion.update({
      where:{
        id,
        userId
      },
      data: {
        title,
        message
      },
    });

    res.status(201).json({
      message: "Suggestion Submitted Successfully.",
      suggestion,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to save suggestion.",error });
  }
}

export const deleteSuggestionById=async (req: AuthRequest, res:Response) => {
  try {
    const { id } = req.params;
    const {count} = await prisma.suggestion.deleteMany({
      where: {
        id: Number(id),
        userId:req.user!.email
      },
    });
    count===0 && res.status(200).json({ message: "Suggestion Not Found.",count });
    res.status(200).json({ message: "Suggestion deleted successfully.",count });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete suggestion.",error });
  }
}
