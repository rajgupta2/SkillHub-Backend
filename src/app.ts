import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./config/db";
import cookieParser from "cookie-parser";
import path from "path";


dotenv.config();
const app = express();
app.use(cookieParser());
app.use(express.json());

// Global middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "*", // update later with frontend URL
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

//Importing Routes
import { verifyToken, requireRole} from "./middlewares/auth.middleware";
import studentController from "./controllers/student.controller"
import authRoutes from "./controllers/auth.controller";


// Routes
app.use("/api/auth", authRoutes);  //register,login,logout
app.use("/api/student",verifyToken,requireRole("Student"),studentController); //all student routes


app.get("/", async (req, res) => {
  res.send("🚀 SkillHub Backend API is Running!");
});

app.post("/api/contact", async (req, res) => {
  try {
    const {fullname, email, subject, message } = req.body;
    const help = await prisma.help.create({
         data: { fullname, email, subject, message },
    });

    res.status(201).json({ message: "Form Submitted Successfully.", help });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// ⚠️ ERROR HANDLER (Basic)
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Error:", err.message);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  try {
    await prisma.$connect();
    console.log(`✅ Connected to MySQL`);
    console.log(`🌐 Server running on http://localhost:${PORT}`);
  } catch (error) {
    console.error("❌ Database connection failed", error);
  }
});

export default app;