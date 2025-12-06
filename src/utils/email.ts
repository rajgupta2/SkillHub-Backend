import nodemailer from "nodemailer";

export const sendEmail = async (email: string, subject: string, html: string) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
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
