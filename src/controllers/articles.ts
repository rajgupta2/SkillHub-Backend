import prisma from "../config/db";
import { AuthRequest } from "../middlewares/auth.middleware";
import { uploadToS3 } from "../utils/s3Upload";
import { Response } from "express";

export const getArticles=async (req:AuthRequest,res:Response)=>{
  try {
    const articles = await prisma.article.findMany({
      orderBy: { createdAt: "desc" },
      include:{
        author:{select:{name:true}},
        _count: {
          select: {likes: true }
        },
        tags:true
      }
    });

    res.status(200).json({articles});
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: "Internal Server error" });
  }
}

export const getArticlesById=async (req:AuthRequest,res:Response)=>{
    try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: "Invalid article ID" });
    }
    const article = await prisma.article.findUnique({
      where: { id: Number(id) },
      include:{
        author: { select: { name: true} },
        _count: {
          select: {likes: true }
        },
        tags:true
      }
    });
    if (!article) return res.status(404).json({ error: "Article not found" });
    res.status(200).json({article});
  } catch (e) {
    console.error("Error fetching article:", e);
    res.status(500).json({ error: "Internal Server error" });
  }
}

export const postArticle=async (req:AuthRequest,res:Response)=>{
  try {
    const { title, content, contentMd, tags } = req.body;
    const authorId=req.user!.email;

    if (!title || !contentMd) {
      return res.status(400).json({ error: "Missing fields" });
    }
    const file=req.file as Express.Multer.File;
    //const url= getLocalFileUrl(req, file.filename);//for local use
    const fileMetaData=await uploadToS3(file,"thumbmail");

    const article = await prisma.article.create({
      data: {
        title,
        contentMd,
        content,
        thumbnail:fileMetaData.url,
        authorId,
        tags: {
          create: tags.split(",").map((tag:string) => ({
            tagName: tag,
          })),
        },
      },
    });

    //contribution award
    const XP_REWARD = 30;
    await prisma.user.update({
        where: { email: req.user!.email },
        data: {
          xpPoints: { increment: XP_REWARD },
        },
    });

    res.status(201).json({ message: "30 xpPonits awarded and Article Created Successfully.", article });
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: "Server error" });
  }
}

export const updateArticle=async (req:AuthRequest,res:Response)=>{
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: "Invalid article ID" });
    }

    const { title, content, contentMd, thumbnail } = req.body;
    const updatedArticle = await prisma.article.updateMany({
      where: { id: Number(id),authorId:req.user!.email },
      data: {
        title,
        content,
        contentMd,
        thumbnail,
      },
    });

    if (updatedArticle.count===0) {
      return res.status(403).json({ message: "You are not authorized to update this article." });
    }

    return res.status(200).json({
      message: "Article updated successfully",
      article: updatedArticle
    });

  } catch (err: any) {

    // Prisma "record not found" error
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Article not found" });
    }

    return res.status(500).json({
      error: err.message || "Something went wrong"
    });
  }
}

export const deleteArticleById=async (req:AuthRequest,res:Response)=>{
  try{
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: "Invalid article ID" });
    }

    const article=await prisma.article.deleteMany({
      where:{
        id:Number(id),
        authorId:req.user!.email
      }
    });

    if (article.count===0) {
      return res.status(403).json({ message: "You are not authorized to delete this article." });
    }

    return res.status(200).json({
      message: "Article deleted successfully",
      article:article
    });
  }catch(err:any){
    return res.status(500).json({
      error: err.message || "Something went wrong"
    });
  }
}
