import express from "express";
import prisma  from "../../config/db";
import { verifyToken, AuthRequest } from "../../middlewares/auth.middleware";

const suggestions = express.Router();

/**
 * - GET all suggestions
 * - Admins can see all suggestions (with user name + email)
 * - Students only see their own suggestions
 */
suggestions.get("/",  async (req: AuthRequest, res) => {
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

    res.json(suggestions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch suggestions." });
  }
});

/**
 * ✅ POST create a suggestion
 */
suggestions.post("/",  async (req: AuthRequest, res) => {
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
    console.error(error);
    res.status(500).json({ message: "Failed to save suggestion." });
  }
});

/**
 * ✅ PUT update suggestion status (admin only)
 */
suggestions.put("/:id/status",  async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (req.user?.role !== "Admin") {
      return res.status(403).json({ message: "Access denied." });
    }

    const updated = await prisma.suggestion.update({
      where: { id: Number(id) },
      data: { status },
    });

    res.json({ message: "Suggestion status updated.", updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update suggestion status." });
  }
});

/**
 * ✅ DELETE suggestion (admin or suggestion owner)
 */
suggestions.delete("/:id",  async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const suggestion = await prisma.suggestion.findUnique({
      where: { id: Number(id) },
      include: { suggestedBy: true },
    });

    if (!suggestion) {
      return res.status(404).json({ message: "Suggestion not found." });
    }

    // Only admin or the person who created it can delete
    if (
      req.user?.email !== suggestion.userId
    ) {
      return res.status(403).json({ message: "Access denied." });
    }

    await prisma.suggestion.delete({ where: { id: Number(id) } });

    res.json({ message: "Suggestion deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete suggestion." });
  }
});

export default suggestions;
