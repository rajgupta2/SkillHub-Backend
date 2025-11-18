import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const uploadToS3 = async (file: Express.Multer.File,type:string) => {
  const fileKey = `${type}/${uuidv4()}-${file.originalname}`;

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  await s3.send(new PutObjectCommand(params));

  return {
    s3Key: fileKey,
    originalName: file.originalname,
    contentType: file.mimetype,
    url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`
   };
};


export const createSignedUrl=async (fileKey:string,seconds:number)=>{
  const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: fileKey,
      // optionally force browser to download with suggested filename:
     // ...(download === "true" && { ResponseContentDisposition: `attachment; filename="${file.originalName || key.split('/').pop()}"` })
  });
  // expiresIn is in seconds (e.g., 60)
  const url = await getSignedUrl(s3, command, { expiresIn: seconds });
  return url;
}

