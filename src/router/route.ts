import express from "express";
import { deleteArticleById, getAllArticles, getArticleBySlug, getStudentArticles, postArticle, updateArticle } from "../controllers/articles.js";
import {upload} from "../utils/multer.js";
import { requireRole, verifyToken } from "../middlewares/auth.middleware.js";
import { deleteMaterialById, getCollegeResources, getMaterials, getMaterialsById, postMaterial, recentContribution, updateMaterialsById } from "../controllers/materials.js";
import { getCollegePeers } from "../controllers/college_peers.js";
import {leaderBoard } from "../controllers/leaderboard.js";
import { uploadS3 } from "../utils/multerS3.js";
import { dashboardStats, getProfile, updateProfile } from "../controllers/profile.js";
import { deleteSuggestionById, getSuggestions, postSuggestion, updateStatus_Suggestion, updateSuggestionById } from "../controllers/suggestions.js";
import { login, register, verifyOTP } from "../controllers/auth.js";
import { getContacts, getContactsById, postContact } from "../controllers/contact.js";
import { deleteCollegeById, deleteCollegeCourseById, getAllCollegeCourses, getAllColleges, getAuthUserCollege, getCollegeById } from "../controllers/college.js";
import { deleteCourseById, getAllDraftCourse, getCourse, getCourseById, getCourseByLinkId, getCourseByLinkSlug, getCourseBySlug, isCourseOwner, postCourse, postCourseByLinkId, updateCourseById, updateCourseByLinkId, updateCourseBySlugLinkId} from "../controllers/course.js";
import { getAllJobs, getJobBySlug, postJob } from "../controllers/jobs.js";


const router = express.Router();

//article routes
router.get("/article",getAllArticles);
router.get("/article/:slug",getArticleBySlug);
router.get("/student/article",verifyToken,getStudentArticles);
router.get("/student/article/:slug",verifyToken,getArticleBySlug);
router.post("/article",verifyToken,postArticle);

router.put("/article/:id",verifyToken,updateArticle)
router.delete("/article/:id",verifyToken,deleteArticleById);

//college peers route
router.get("/college-peers",verifyToken,getCollegePeers)

//materials routes
router.get("/material",getMaterials);
router.post("/material",verifyToken,uploadS3.array("files",5),postMaterial);
router.get("/recent-contribution",verifyToken,recentContribution);
router.get("/college-resources",verifyToken,requireRole("Student"),getCollegeResources);

router.get("/material/:id",getMaterialsById);
router.put("/material/:id",verifyToken,updateMaterialsById)
router.delete("/material/:id",verifyToken,deleteMaterialById);


//leaderboard route
router.get("/leaderboard",verifyToken,requireRole("Student"),leaderBoard);

//profile route
router.get("/profile",verifyToken,getProfile);
router.get("/profile/:email",verifyToken,getProfile);
router.put("/profile",verifyToken,updateProfile);


//suggestion route
router.get("/suggestion",verifyToken,requireRole("Student"),getSuggestions);
router.post("/suggestion",verifyToken,requireRole("Student"),postSuggestion);

router.put("/suggestion/:id",verifyToken,requireRole("Student"),updateSuggestionById)
router.put("/suggestion/:id/:status",verifyToken,requireRole("Admin"),updateStatus_Suggestion)
router.delete("/material/:id",verifyToken,requireRole("Student"),deleteSuggestionById);



//register login route
router.post(["/send-email","/register"],register);
router.post("/verify-otp",verifyOTP); //verifyOTP and Create a User.
router.post("/login",login)

//dashboard-stats
router.get("/dashboard-stats",verifyToken,dashboardStats);

//contact route
router.get("/contact",verifyToken,requireRole("Admin"),getContacts);
router.get("/contact/:id",verifyToken,requireRole("Admin"),getContactsById);
router.post("/contact",postContact);

//college route
router.get("/colleges",getAllColleges);
router.get("/college",verifyToken,requireRole("Student"),getAuthUserCollege);
router.get("/college/:id",getCollegeById);
router.delete("/college/:id",verifyToken,requireRole("Admin"),deleteCollegeById);

router.get("/colleges-courses",getAllCollegeCourses);
router.delete("/college-course/:id",verifyToken,requireRole("Admin"),deleteCollegeCourseById);

//Tutorial route
router.get("/courses",getCourse);
router.get("/draft/courses",verifyToken,getAllDraftCourse);
router.get("/draft/courses/:slug",verifyToken,getCourseBySlug);
router.get("/courses/:slug",getCourseBySlug);

//router.get("/courses/:id",getCourseById);
router.get("/iscourseowner/:courseSlug",verifyToken,isCourseOwner);

router.post("/courses",verifyToken,postCourse);
router.post("/courses/:courseId/:linkId",verifyToken,postCourseByLinkId);
router.put("/courses/:id",verifyToken,updateCourseById);
router.put("/courses/:courseId/:linkId",verifyToken,updateCourseByLinkId);
router.put("/courses/slug/:courseSlug/:linkSlug",verifyToken,updateCourseBySlugLinkId);
router.delete("/courses/:id",verifyToken,deleteCourseById);

//jobs route
router.get("/jobs",getAllJobs);
router.get("/jobs/:slug",getJobBySlug);
router.post("/jobs",verifyToken,requireRole("Admin"),postJob);

export default router;