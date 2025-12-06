import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { Request } from "express";
import { Express } from "express";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export interface MulterS3File extends Express.Multer.File {
  key: string;        // S3 object key
  location: string;   // Public file URL
  bucket: string;     // Bucket name
  etag: string;       // S3 etag
}

export const uploadS3 = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME!,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    contentDisposition: "inline",   //For pdf previes otherwise auto-downloaded
    metadata: function (req:Request, file:Express.Multer.File, cb:(error: any, metadata?: any) => void) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req:Request, file:Express.Multer.File, cb:(error: any, key?: string) => void) {
      const type = req.body.type
      const fileKey = `${type}/${Date.now()}-${uuidv4()}-${file.originalname}`;
      cb(null, fileKey);
    },
  }),
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB per file
  }
});
