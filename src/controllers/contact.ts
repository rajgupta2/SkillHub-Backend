import { Request,Response } from "express";
import prisma  from "../config/db.js";

export const getContacts=async (req: Request, res:Response) => {
  try {

    const contacts = await prisma.help.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch contacts.",error });
  }
}

export const getContactsById=async (req: Request, res:Response) => {
  try {

    const contact = await prisma.help.findUnique({
      where:{
        id:Number(req.params.id)
      },
    });

    res.status(200).json(contact);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch contacts.",error });
  }
}

export const postContact=async (req:Request, res:Response) => {
  try {
    const {fullname, email, subject, message } = req.body;
    const help = await prisma.help.create({
         data: { fullname, email, subject, message },
    });

    res.status(201).json({ message: "Form Submitted Successfully.", help });
  } catch (error) {
    res.status(500).json({ message: "Server Error",error });
  }
}

