import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import prisma from "../config/db";
import { MulterS3File } from "../utils/multerS3";         //For AWS S3
import { deleteFilesFromS3} from "../utils/s3Upload";

export const recentContribution=async (req: AuthRequest, res:Response) =>{
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const materials = await prisma.material.findMany({
      where: {
        studentId: req.user!.email,
      },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        subject: true,
        createdAt: true,
        uploadedBy: {
          select: { name: true }
        },
        files: true
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    res.status(200).json({materials:materials});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch materials" });
  }
}

export const getMaterials=async (req: AuthRequest, res:Response) =>{
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const materials = await prisma.material.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        subject: true,
        createdAt: true,
        uploadedBy: {
          select: { name: true }
        },
        files: true
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    res.status(200).json({materials:materials});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch materials" });
  }
}

export const getMaterialsById=async (req: AuthRequest, res:Response)=>{
  try {
    const materialId = req.params.id;
    if (!materialId || isNaN(Number(materialId))) {
      return res.status(400).json({ error: "Invalid material Id." });
    }
    const material = await prisma.material.findUnique({
       where: { id: Number(materialId) },
       select: {
          id: true,
          title: true,
          description: true,
          type: true,
          subject: true,
          createdAt: true,
          uploadedBy: {
            select: { name: true }
          },
          files: true
        },
    });
    if (!material) return res.status(404).json({ message: "Material not found" });

    res.status(200).json({material:material});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch the material" });
  }
}

export const getCollegeResources=async (req: AuthRequest, res:Response) =>{
  try {
    const userProfile=await prisma.studentProfile.findUnique({
      where:{ email:req.user!.email },
      select:{collegeId:true}
    })

    if(userProfile===null || userProfile?.collegeId===null)
       return res.status(404).json({ message: "You don't registerd your college yet." });

    const collegeStudents=await prisma.studentProfile.findMany({
      where:{ collegeId:userProfile.collegeId },
      select: { email: true }
    })

    const studentIds = collegeStudents.map(s => s.email);
    const limit = parseInt(req.query.limit as string) || 50;
    const materials = await prisma.material.findMany({
      where: {
       studentId: { in:studentIds}
      },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        subject: true,
        createdAt: true,
        uploadedBy: {
          select: { name: true }
        },
        files: true
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    res.status(200).json({materials:materials});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch materials" });
  }
}

export const postMaterial=async (req: AuthRequest, res:Response) =>{
  try {
    const { title, description, type, subject } = req.body;
    const studentId = req.user!.email;
    const files = req.files as MulterS3File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    //For local use
    // const uploadedFiles = files.map((file) => ({
    //   url: getLocalFileUrl(req, file.filename),
    // }));


    const uploadedFiles = files.map((file:MulterS3File) => ({
      s3Key: file.key,
      originalName: file.originalname,
      contentType: file.mimetype,
      url: file.location
    }));

    // // For S3 (future use)
    // const uploadedFiles = await Promise.all(
    //   files.map(async (file) => {
    //       const f=await uploadToS3(file,type);
    //       return f;
    //   })
    // );

    const material = await prisma.material.create({
      data: {
        title,
        description,
        type,
        subject,
        studentId,
        files: { create: uploadedFiles },
      },
      include: { files: true },
    });

    //contribution award
    const XP_REWARD = 5;
    await prisma.user.update({
        where: { email: req.user!.email },
        data: {
          xpPoints: { increment: XP_REWARD },
        },
    });

    res.status(201).json({ message: "5 xpPoint awarded and material uploaded successfully.", material });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to upload material" });
  }
}

export const updateMaterialsById=async (req: AuthRequest, res:Response)=>{
  try {
    const materialId = Number(req.params.id);

    if (!materialId || isNaN(materialId)) {
      return res.status(400).json({ error: "Invalid material Id." });
    }
    const { title, description, subject, type } = req.body;

    const updated = await prisma.material.updateMany({
      where: {
        id:materialId ,
        studentId:req.user!.email
      },
      data: { title, description, subject, type },
    });

    if(updated.count===0)
      return res.status(403).json({ message: "You are not authorized to update this material." });

    res.status(200).json({ message: "Material updated successfully.", updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch the material" });
  }
}

export const deleteMaterialById=async (req: AuthRequest, res:Response)=>{
  try {
    const materialId = Number(req.params.id);

    if (!materialId || isNaN(materialId)) {
      return res.status(400).json({ error: "Invalid material Id." });
    }

    const files = await prisma.file.findMany({
      where: {
        materialId ,
        material:{
          studentId:req.user!.email
        }
      },
      select: { s3Key: true }
    });

    // 2️⃣ Delete files from S3 using the reusable function
    await deleteFilesFromS3(files.map(f => f.s3Key!));

    //Delete material (cascade deletes File records)
    const updated = await prisma.material.deleteMany({
      where: {
        id:materialId ,
        studentId:req.user!.email
      }
    });

    if(updated.count===0)
      return res.status(403).json({ message: "You are not authorized to delete this material." });

    res.status(200).json({ message: "Material deleted successfully.", updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch the material" });
  }
}