import express, { Request, Response } from "express";
import {
  deleteArticleById,
  getAllArticles,
  getArticleBySlug,
  getStudentArticles,
  postArticle,
  updateArticle,
} from "../controllers/articles.js";
import { requireRole, verifyToken } from "../middlewares/auth.middleware.js";
import {
  deleteMaterialById,
  getCollegeResources,
  getMaterials,
  getMaterialsById,
  postMaterial,
  recentContribution,
  updateMaterialsById,
} from "../controllers/materials.js";
import { getCollegePeers } from "../controllers/college_peers.js";
import { leaderBoard } from "../controllers/leaderboard.js";
import { uploadS3 } from "../utils/multerS3.js";
import {
  dashboardStats,
  getProfile,
  updateProfile,
} from "../controllers/profile.js";
import {
  deleteSuggestionById,
  getSuggestions,
  postSuggestion,
  updateStatus_Suggestion,
  updateSuggestionById,
} from "../controllers/suggestions.js";
import { login, register, verifyOTP } from "../controllers/auth.js";
import {
  getContacts,
  getContactsById,
  postContact,
} from "../controllers/contact.js";
import {
  deleteCollegeById,
  deleteCollegeCourseById,
  getAllCollegeCourses,
  getAllColleges,
  getAuthUserCollege,
  getCollegeById,
} from "../controllers/college.js";
import { createSignedUrl } from "../utils/s3Upload.js";
import {
  getCourse,
  getCourseBySlug,
  postCourse,
  deleteTutorialBySlug,
  getAllUserTutorials,
  getTutorialBySlug,
  postTutorial,
  updateTutorialBySlug,
} from "../controllers/tutorials.js";

const router = express.Router();

//article routes
router.get("/article", getAllArticles);
router.get("/article/:slug", getArticleBySlug);
router.get("/student/article", verifyToken, getStudentArticles);
router.get("/student/article/:slug", verifyToken, getArticleBySlug);
router.post("/article", verifyToken, postArticle);

router.put("/article/:id", verifyToken, updateArticle);
router.delete("/article/:id", verifyToken, deleteArticleById);

//college peers route
router.get("/college-peers", verifyToken, getCollegePeers);

//materials routes
router.get("/material", getMaterials);
router.post("/material", verifyToken, uploadS3.array("files", 5), postMaterial);
router.get("/recent-contribution", verifyToken, recentContribution);
router.get(
  "/college-resources",
  verifyToken,
  requireRole("Student"),
  getCollegeResources,
);

router.get("/material/:id", getMaterialsById);
router.put("/material/:id", verifyToken, updateMaterialsById);
router.delete("/material/:id", verifyToken, deleteMaterialById);

//leaderboard route
router.get("/leaderboard", verifyToken, requireRole("Student"), leaderBoard);

//profile route
router.get("/profile", verifyToken, getProfile);
router.get("/profile/:email", verifyToken, getProfile);
router.put("/profile", verifyToken, updateProfile);

//suggestion route
router.get("/suggestion", verifyToken, requireRole("Student"), getSuggestions);
router.post("/suggestion", verifyToken, requireRole("Student"), postSuggestion);

router.put(
  "/suggestion/:id",
  verifyToken,
  requireRole("Student"),
  updateSuggestionById,
);
router.put(
  "/suggestion/:id/:status",
  verifyToken,
  requireRole("Admin"),
  updateStatus_Suggestion,
);
router.delete(
  "/material/:id",
  verifyToken,
  requireRole("Student"),
  deleteSuggestionById,
);

//register login route
router.post(["/send-email", "/register"], register);
router.post("/verify-otp", verifyOTP); //verifyOTP and Create a User.
router.post("/login", login);

//dashboard-stats
router.get("/dashboard-stats", verifyToken, dashboardStats);

//contact route
router.get("/contact", verifyToken, requireRole("Admin"), getContacts);
router.get("/contact/:id", verifyToken, requireRole("Admin"), getContactsById);
router.post("/contact", postContact);

//college route
router.get("/colleges", getAllColleges);
router.get("/college", verifyToken, requireRole("Student"), getAuthUserCollege);
router.get("/college/:id", getCollegeById);
router.delete(
  "/college/:id",
  verifyToken,
  requireRole("Admin"),
  deleteCollegeById,
);

router.get("/colleges-courses", getAllCollegeCourses);
router.delete(
  "/college-course/:id",
  verifyToken,
  requireRole("Admin"),
  deleteCollegeCourseById,
);

//Tutorial route
router.get("/courses", getCourse);
router.get("/courses/:slug", getCourseBySlug);
router.post("/courses", verifyToken, postCourse);

router.get("/tutorial/user", verifyToken, getAllUserTutorials);
router.get("/tutorial/draft/:courseSlug/:linkSlug", verifyToken, getTutorialBySlug);
router.get("/tutorial/:courseSlug/:linkSlug", getTutorialBySlug);

router.post("/tutorial/:courseSlug", verifyToken, postTutorial);
router.put("/tutorial/:courseSlug/:linkSlug", verifyToken, updateTutorialBySlug);
router.delete("/tutorial/:courseSlug/:linkSlug", verifyToken, deleteTutorialBySlug);

router.get("/download",async (req:Request,res:Response)=>{
  const s3Key=req.query.s3Key as string;
  const fileName=req.query.fileName as string;
  const url=await createSignedUrl(s3Key,fileName);
  return res.redirect(url);
});

export default router;
