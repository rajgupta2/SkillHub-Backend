export const PREMIUM_EMAIL_TEMPLATE = (
  otp: string,
  platformName = process.env.PLATFORM_NAME!,
  platformLink = process.env.PLATFORM_LINK!,
  youtubeLink = process.env.PLATFORM_YOUTUBE_LINK!
) => `
<!DOCTYPE html>
<html lang="en" style="font-family: 'Segoe UI', sans-serif;">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <style>
    body {
      margin: 0;
      background: #f5f5f5;
      padding: 0;
      font-family: 'Segoe UI', sans-serif;
    }
    .container {
      max-width: 480px;
      margin: auto;
      background: #ffffff;
      border-radius: 14px;
      padding: 25px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.07);
    }
    .logo {
      text-align: center;
      margin-bottom: 18px;
    }
    .otp-box {
      font-size: 26px;
      font-weight: 700;
      background: #f0f0f0;
      padding: 12px 20px;
      letter-spacing: 6px;
      text-align: center;
      border-radius: 10px;
      margin: 20px 0;
    }
    .btn {
      display: inline-block;
      font-size: 16px;
      background: #4f46e5;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 20px;
      border-radius: 10px;
      margin-top: 20px;
      transition: 0.25s ease;
    }
    .btn:hover {
      opacity: 0.9;
    }
    .footer {
      margin-top: 25px;
      text-align: center;
      font-size: 13px;
      color: #777;
    }
    @media (max-width: 480px) {
      .container { padding: 18px; }
      .otp-box { font-size: 22px; }
    }
  </style>
</head>

<body>
  <div class="container">

    <div class="logo">
      <!-- Lucide Graduation Cap SVG (Email-Safe, 48px, SkillHub Blue) -->
      <img src="${platformLink}/graduation-cap.svg" style="margin:2px" />
      <h2 style="font-size:20px; font-weight:700; color:#2563eb;">
        ${platformName}
      </h2>
    </div>

    <p>Hello,</p>
    <p>Here is your OTP to verify your email:</p>

    <div class="otp-box">${otp}</div>

    <p>This OTP will expire in <strong>5 minutes</strong>.</p>

    <a href="${platformLink}" class="btn">Visit ${platformName}</a>

    <div class="footer">
      <p>Watch our tutorials:
        <a href="${youtubeLink}" style="color:#4f46e5; text-decoration:none;">
          YouTube Channel
        </a>
      </p>
      <p>© ${new Date().getFullYear()} ${platformName}. All rights reserved.</p>
    </div>

  </div>
</body>
</html>
`;
