import slugify from "slugify";
import prisma from "../config/db.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { uploadToS3 } from "../utils/s3Upload.js";
import { Response } from "express";
import { nanoid } from "nanoid";
import { htmlToText } from "html-to-text";
import { isCourseOwner } from "./course.js";

export function extractMetaDescription(
  html: string,
  maxLength = 155
): string {
  const text = htmlToText(html, {
    wordwrap: false,
    selectors: [
      { selector: "img", format: "skip" },
      { selector: "a", options: { ignoreHref: true } },
    ],
  })
    .replace(/\s+/g, " ")
    .trim();

  return text.slice(0, maxLength);
}

function generateCourseSlug(title: string) {
  return `${slugify(title, { lower: true })}--${nanoid(6)}`;
}


//get all articles with student draft also.
export const getAllArticles=async (req:AuthRequest,res:Response)=>{
  try {
    const resultedArticles = await prisma.article.findMany({
      orderBy: { createdAt: "desc" },
      where:{
        isPublished:true
      },
      include:{
        author:{select:{name:true}},
        _count: {
          select: {likes: true }
        },
      }
    });
    const draftArticles= !req.user?.email ?  [] : await prisma.article.findMany({
      orderBy: { createdAt: "desc" },
      where:{
        isPublished:false,
        authorId:req.user.email
      },
      include:{
        author:{select:{name:true}},
        _count: {
          select: {likes: true }
        },
      }
    })
    const allArticles=[...resultedArticles,...draftArticles];
    res.status(200).json({articles:allArticles});
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: "Internal Server error" });
  }
}

export const getStudentArticles=async (req:AuthRequest,res:Response)=>{
  try {
    const Articles= !req.user?.email ?  [] : await prisma.article.findMany({
      orderBy: { createdAt: "desc" },
      where:{
        authorId:req.user.email
      },
      include:{
        author:{select:{name:true}},
        _count: {
          select: {likes: true }
        },
      }
    })
    const allArticles=[...Articles];
    res.status(200).json({articles:allArticles});
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: "Internal Server error" });
  }
}

//get published or draft article only.
export const getArticleBySlug=async (req:AuthRequest,res:Response)=>{
  try {
    const { slug } = req.params;
    const resultedArticle = await prisma.article.findFirst({
      where: {
        slug
      },
      include: {
        author: {select:{name:true}},
      },
    });

    const isContentOwner:boolean=resultedArticle?.authorId===req.user?.email;
    if(isContentOwner || resultedArticle?.isPublished ===true)
      return res.status(200).json({article:resultedArticle,isContentOwner});

    return res.status(401).json({article:null});
  } catch (e) {
    console.error("Error fetching article:", e);
    res.status(500).json({ error: "Internal Server error" });
  }
}

export const postArticle=async (req:AuthRequest,res:Response)=>{
  try {
    const { title, contentJson, contentHtml, tags, type, isPublished } = req.body;
    const authorId=req.user!.email;

    if (!title || !contentJson) {
      return res.status(400).json({ error: "Missing fields" });
    }
    // const file=req.file as Express.Multer.File;
    // const url= getLocalFileUrl(req, file.filename);//for local use
    // const fileMetaData=file && await uploadToS3(file,"thumbmail");

    const firstParagraph = contentHtml.match(/<p>(.*?)<\/p>/)?.[1] || contentHtml;
    const desc = extractMetaDescription(firstParagraph,155);
    const metaDescription = desc.length === 155 ? `${desc}…` : desc;

    const article = await prisma.article.create({
      data: {
        title,
        slug: generateCourseSlug(title),
        contentHtml,
        contentJson,
        metaTitle:title,
        metaDescription,
        noIndex:!isPublished,    //isPublished-> true , then noindex will be false to make it google indexable.
        type,
        isPublished,
        authorId,
        tags
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

    res.status(201).json({ message: "30 xpPonits awarded and Content Created Successfully.", article });
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

    const { title, contentJson, contentHtml, tags, type, isPublished } = req.body;
    const authorId=req.user!.email;

    if (!title || !contentJson) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const firstParagraph = contentHtml.match(/<p>(.*?)<\/p>/)?.[1] || contentHtml;
    const desc = extractMetaDescription(firstParagraph,155);
    const metaDescription = desc.length === 155 ? `${desc}…` : desc;

    const updatedArticle = await prisma.article.update({
      where: { id: Number(id),authorId:req.user!.email },
      data: {
        title,
        contentHtml,
        contentJson,
        metaTitle:title,
        metaDescription,
        noIndex:!isPublished,    //isPublished-> true , then noindex will be false to make it google indexable.
        type,
        isPublished,
        authorId,
        tags
      },
    });

    if (!updatedArticle) {
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
