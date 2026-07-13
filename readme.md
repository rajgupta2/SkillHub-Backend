# 🚀 SkillHub Backend

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-22.x-green?logo=node.js" />
  <img src="https://img.shields.io/badge/Express.js-Backend-black?logo=express" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql" />
  <img src="https://img.shields.io/badge/MongoDB-Database-47A248?logo=mongodb" />
  <img src="https://img.shields.io/badge/Docker-Supported-2496ED?logo=docker" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" />
</p>

A scalable **Node.js + Express + TypeScript** REST API powering the **SkillHub** learning platform. It provides secure authentication, study resource management, tutorials, articles, AWS S3 file uploads, and admin APIs.

---

# ✨ Features

- 🔐 JWT Authentication & Authorization
- 👤 User & Profile Management
- 🏫 College Management
- 📚 Study Resources (Notes, PYQs, Assignments, Projects)
- 🎓 Tutorials & Courses
- 📰 Articles & Blog Management
- 📁 AWS S3 File Uploads
- 🔍 Search & Filtering
- 📊 Admin Dashboard APIs
- 🛡️ Role-Based Access Control (RBAC)
- ⚡ Prisma ORM
- 🐘 PostgreSQL Database
- 🍃 MongoDB Integration
- 🐳 Docker Support
- ☁️ AWS Ready

---

# 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Runtime | Node.js |
| Language | TypeScript |
| Framework | Express.js |
| ORM | Prisma |
| Database | PostgreSQL, MongoDB |
| Authentication | JWT |
| File Storage | AWS S3 |
| Password Hashing | bcrypt |
| API | REST |
| Package Manager | npm |
| Containerization | Docker |

---

# 📂 Project Structure

```text
skillhub-backend/
│
├── prisma/
│   └── schema.prisma
│
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── router/
│   ├── utils/
│   ├── app.ts
│
├── package.json
├── tsconfig.json
├── prisma.config.ts
├── Dockerfile
├── .dockerignore
├── .gitignore
├── .env
└── README.md
```

---

# ⚙️ Installation

Clone the repository

```bash
git clone https://github.com/rajgupta2/skillhub-backend.git
```

Move into the project directory

```bash
cd skillhub-backend
```

Install dependencies

```bash
npm install
```

---

# 🔑 Environment Variables

Create a `.env` file in the project root.

```env
# Server
PORT=5000
CLIENT_URL=https://skillhub-student.vercel.app

# PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/skillhub"

# MongoDB
MONGODB_URI=mongodb://localhost:27017/skillhubDB

# Lambda
LAMBDA_SEND_EMAIL_API=your-lambda-url
LAMBDA_API_KEY=your-lambda-api-key

# AWS S3
AWS_REGION=your-region
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_BUCKET_NAME=your-bucket-name

# Email
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password

# Platform
PLATFORM_NAME=SkillHub
PLATFORM_LINK=https://skillhub-student.vercel.app
PLATFORM_YOUTUBE_LINK=https://youtube.com/@skillhubstudent

# JWT
JWT_SECRET=your-secret-key
```

---

# ▶️ Running the Application

You can run the backend either **locally** or **using Docker**.

---

<details>
<summary><strong>🚀 Option 1: Run Without Docker</strong></summary>
<br>


### 🗄️ Database Setup

Generate Prisma Client

```bash
npx prisma generate
```

Push the Prisma schema

```bash
npx prisma db push
```

### ⚡Development

```bash
npm run dev
```

#### Build the project

```bash
npm run build
```

#### Start the production server

```bash
npm start
```

The API will be available at:

```
http://localhost:5000
```

</details>

---

<details>
<summary><strong>🐳 Option 2: Run With Docker</strong></summary>
<br>

## 🐳 Option 2: Run With Docker

### Build the Docker image

```bash
docker build -t skillhub-backend .
```

### Run the Docker container

```bash
docker run -d --env-file .env -p 5000:5000 --name skillhub-backend skillhub-backend
```

The API will be available at:

```
http://localhost:5000
```

</details>

---

# 📜 Available Scripts

| Command | Description |
|----------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build the TypeScript project |
| `npm start` | Start the production server |
| `npx prisma generate` | Generate Prisma Client |
| `npx prisma db push` | Push schema changes to the database |
| `npx prisma migrate dev` | Create and apply database migrations |

---

# 🔐 Authentication

The API uses **JWT (JSON Web Token)** authentication.

Include the access token in every protected request.

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

# 📁 File Uploads

Uploaded files are stored securely in **Amazon S3**.

Supported file types:

- PDF
- DOC / DOCX
- PPT / PPTX
- Images

---

# 🛡️ Security

- JWT Authentication
- Password Hashing using bcrypt
- Role-Based Authorization
- Input Validation
- Environment Variables
- Secure File Uploads
- CORS Protection

---

# 📈 Future Enhancements

- 📧 Email Notifications
- 🔔 Push Notifications
- 💬 Real-time Chat
- 🤖 AI Content Recommendations
- 📊 Analytics Dashboard

---

# 📄 License

This project is proprietary software.

- Copyright (c) 2026 Raj Gupta
- All rights reserved.

The source code is provided for viewing and educational purposes only.

---

# 👨‍💻 Author

**Raj Gupta**

- 🌐 GitHub: https://github.com/rajgupta2
- 💻 AWS | MERN | TypeScript | Docker | PostgreSQL | MongoDB

---

# ⭐ Support

If you found this project helpful, consider giving it a **⭐ Star** on GitHub.

It helps others discover the project and motivates further development.

---
