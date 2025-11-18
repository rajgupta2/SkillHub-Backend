import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/db";
import { sendEmail } from "../utils/email";
import { PREMIUM_EMAIL_TEMPLATE } from "../utils/PREMIUM_EMAIL_TEMPLATE";

const auth = express.Router();

const JWT_SECRET=process.env.JWT_SECRET!;
const salt = bcrypt.genSaltSync(10);

auth.post("/register", async (req: Request, res: Response) => {
  try {

    const { email} = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ message: "Email already registered" });

    // Create 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete old OTP if exists
    await prisma.verifyEmail.deleteMany({ where: { email } });

    // Send OTP email
    await sendEmail(
      email,
      "Verify Your Email - SkillHub",
      PREMIUM_EMAIL_TEMPLATE(otp)
    );

    await prisma.verifyEmail.create({
      data: {
        email,
        otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      }
    });

    res.json({
      message: "OTP sent to email",
      email
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

auth.post("/verify-otp", async (req: Request, res: Response) => {
  try {
    const {
        email,
        password,
        fullName,
        role,
        otp,
    } = req.body;

    const record = await prisma.verifyEmail.findUnique({ where: { email } });
    if (!record) return res.status(400).json({ message: "OTP not found" });

    if (record.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    if (record.expiresAt < new Date())
      return res.status(400).json({ message: "OTP expired" });

    const hashedPassword = await bcrypt.hash(password, salt);

    await prisma.user.create({
      data: {
        email,
        name:fullName,
        role,
        password: hashedPassword,
        isVerified:true
      },
    });

    // Delete OTP record
    await prisma.verifyEmail.delete({ where: { email } });

    res.json({ message: "You are registered successfully! Please Login Now." });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});


auth.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ email: user.email, role: user.role}, JWT_SECRET, { expiresIn: "7d"});

    const isProd = process.env.NODE_ENV === "production";

    //setting token
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProd,                       // true only on HTTPS
      sameSite: isProd ? "none" : "lax",    // none for production, lax for localhost
      maxAge: 7 * 24 * 60 * 60 * 1000,      //7 days
    });

     //setting token
    res.cookie("user", JSON.stringify({ name: user.name, role: user.role }), {
      httpOnly: true,
      secure: isProd,                       // true only on HTTPS
      sameSite: isProd ? "none" : "lax",    // none for production, lax for localhost
      maxAge: 7 * 24 * 60 * 60 * 1000,      //7 days
    });

    res.json({
      message: "Login successful",
      user: {
        name: user.name,
        role: user.role,
        email: user.email,
    },
   });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

auth.post("/logout", (req, res) => {
  const isProd = process.env.NODE_ENV === "production";

  res.clearCookie("token", {
    secure: isProd,                       // true only on HTTPS
    sameSite: isProd ? "none" : "lax",
    httpOnly: true,
  });

  res.clearCookie("user", {
    secure: isProd,                       // true only on HTTPS
    sameSite: isProd ? "none" : "lax",
    httpOnly: true,
  });

  res.status(200).json({ message: "Logged out" });
});

export default auth;

