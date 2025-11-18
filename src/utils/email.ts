import nodemailer from "nodemailer";

export const sendEmail = async (email: string, subject: string, html: string) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"SkillHub" <${process.env.MAIL_USER}>`,
    to: email,
    subject,
    html,
  });
};
