import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET!;

export interface AuthRequest extends Request {
  user?: { email: string; role: string; };
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token=req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token in header." });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { email: string; role: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token",error });
  }
};

export const requireRole = (role: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: No user data found" });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    next();
  };
};

export const verifyOrigin=(req:Request, res:Response, next:NextFunction) => {
  const allowed = [
    process.env.CLIENT_URL,
    "http://localhost:3000",
  ];

  const origin = req.headers.origin;

  if (!origin) {
    return res.status(403).json({ error: "Origin missing. Access denied." });
  }

  if (origin && !allowed.includes(origin)) {
    return res.status(403).json({ error: "Forbidden origin." });
  }

  next();
}