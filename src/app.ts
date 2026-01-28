import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import prisma from "./config/db";
import { Request, Response } from "express";
import router from "./router/route"
import { verifyOrigin } from "./middlewares/auth.middleware";
import { connectDB } from "./config/mongoDB";

const PORT = process.env.PORT || 5000;

dotenv.config();
const app = express();

// Global middleware
app.use(cors({
  origin: [
    process.env.CLIENT_URL!, //real frontend url
    "http://localhost:3000"
  ], // update later with frontend URL
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: [
    "Content-Type",
    "Authorization"
  ],
  credentials: true,
}));

//Body parsers with increased limits
app.use(cookieParser());
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));
app.use("/api",router)

// app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get(["/","/api"], async (req:Request, res:Response) => {
  res.send("🚀 SkillHub Backend API is Running!");
});


// ⚠️ ERROR HANDLER (Basic)
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Error:", err.message);
  res.status(500).json({ error: "Internal Server Error", errorMessage:err});
});

app.listen(Number(PORT), async () => {
  try {
    await prisma.$connect();
    await connectDB();
    console.log(`✅ Connected to PostgreSQL and mongodb`);
    console.log(`🌐 Server running on ${process.env.CLIENT_URL}:${PORT}`);
  } catch (error) {
    console.error("❌ Database connection failed", error);
  }
});

export default app;