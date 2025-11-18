import express from "express";
import { verifyToken, AuthRequest } from "../../middlewares/auth.middleware";
import prisma from "../../config/db";
import { upload } from "../../utils/multer";         //For AWS S3
//import { upload } from "../utils/multerConfig"; //For local storage

import { getLocalFileUrl } from "../../utils/localUpload";
import { createSignedUrl, uploadToS3 } from "../../utils/s3Upload";   // for later use
import path from "path";
import fs from "fs";
import { log } from "console";

const contribute = express.Router();

/**
 * ✅ GET user’s materials (supports alias route)
 * Example: GET /contribute or GET /get-materials
 */
//["/contribute"=>for recent contribution , "/get-materials=>materials"]
contribute.get(["/","/my-upload","/all-upload"],  async (req: AuthRequest, res) => {
  try {

    const limit = parseInt(req.query.limit as string) || 10;
    const isOwnRequest = req.path === "/my-upload"; // ✅ checks which URL was called

    const whereClause = isOwnRequest
      ? { studentId: req.user!.email } // only user's uploads
      : {}; // all uploads

    const materials = await prisma.material.findMany({
      where: whereClause,
      include: {
        files: true,
        uploadedBy: { select: { name: true, email: true } },
      },

      orderBy: { createdAt: "desc" },
      take: limit,
    });

    res.json({materials:materials});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch materials" });
  }
});


contribute.get(["/college-resources", "/get-college-resources"],  async (req: AuthRequest, res) => {
  try {
    const userProfile=await prisma.studentProfile.findUnique({
      where:{
        email:req.user!.email
      }
    })
    if(userProfile===null || userProfile?.collegeId===null)
      return res.json({materials:[]});

    const limit = parseInt(req.query.limit as string) || 50;
    const materials = await prisma.material.findMany({
      where: {
       collegeId: userProfile?.collegeId
      },
      include: {
        files: true,
        uploadedBy: { select: { name: true, email: true } },
      },

      orderBy: { createdAt: "desc" },
      take: limit,
    });

    res.json({materials:materials});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch materials" });
  }
});



/**
 * ✅ POST upload new material
 */
contribute.post("/",  upload.array("files"), async (req: AuthRequest, res) => {
  try {
    const { title, description, type, subject } = req.body;
    const studentId = req.user!.email;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    //user Profile if have
    const userProfile=await prisma.studentProfile.findUnique({
      where:{
        email:req.user!.email
      }
    })
    //For local use
    // const uploadedFiles = files.map((file) => ({
    //   url: getLocalFileUrl(req, file.filename),
    // }));


    // For S3 (future use)
    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
          const f=await uploadToS3(file,type);
          return f;
      })
    );

    const material = await prisma.material.create({
      data: {
        title,
        description,
        type,
        subject,
        studentId,
        collegeId: userProfile?.collegeId,
        files: { create: uploadedFiles },
      },
      include: { files: true },
    });

    //contribution award
    const XP_REWARD = 5;
    const newProfileData = {
      email: req.user!.email,
      xpPoints: XP_REWARD,
      collegeId: userProfile?.collegeId ?? null,
      courseId: userProfile?.courseId ?? null,
      avatarUrl: null,
    };
    await prisma.studentProfile.upsert({
        where: { email: req.user!.email },
        update: {
          xpPoints: { increment: XP_REWARD },
        },
        create: newProfileData,
    });

    res.status(201).json({ message: "5 xpPoint awarded and material uploaded successfully.", material });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to upload material" });
  }
});

/**
 * ✅ GET single file by ID
 */
contribute.get("/:id",  async (req: AuthRequest, res) => {
  try {
    const fileId = req.params.id;

    const file = await prisma.file.findUnique({ where: { id: Number(fileId) }, include: { material: true } });
    if (!file) return res.status(404).json({ message: "File not found" });

    // OPTIONAL: check if req.user is allowed to view this (owner or public) e.g. if only owner can view:
    // if (file.material.studentId !== req.user!.email) return res.status(403).json({ message: "Forbidden" });

    const key = file.s3Key; // stored key
    //presigned url for 1 hour
    const url= key && await createSignedUrl(key,60*60);
    res.json({ url, expiresIn: 60*60 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch the file" });
  }
});

/**
 * ✅ PUT update material (only owner)
 */
contribute.put("/:id",  async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, description, subject, type } = req.body;
    const email = req.user!.email;

    const material = await prisma.material.findUnique({ where: { id } });
    if (!material || material.studentId !== email) {
      return res.status(403).json({ message: "Not authorized to update this material." });
    }

    const updated = await prisma.material.update({
      where: { id },
      data: { title, description, subject, type },
    });

    res.json({ message: "Material updated successfully.", updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update material" });
  }
});

/**
 * ✅ DELETE material (only owner)
 */
contribute.delete("/:id",  async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const email = req.user!.email;

    const material = await prisma.material.findUnique({
      where: { id },
      include: { files: true },
    });

    if (!material || material.studentId !== email) {
      return res.status(403).json({ message: "Not authorized to delete this material." });
    }

    // 🗑️ Delete files from local storage
    for (const file of material.files) {
      // file.url might look like: http://localhost:5000/uploads/<filename>
      const filename = path.basename(file.url);
      const filePath = path.join(__dirname, "..", "uploads", filename);

      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (err) {
        console.error("Error deleting file:", err);
      }
    }

    await prisma.material.delete({ where: { id } });

    res.json({ message: "Material deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete material" });
  }
});

export default contribute;
