import express from "express";
import { deleteArticleById, getAllArticles, getArticleBySlug, getArticleByStudentZone, getArticles, postArticle, updateArticle } from "../controllers/articles";
import {upload} from "../utils/multer";
import { requireRole, verifyToken } from "../middlewares/auth.middleware";
import { deleteMaterialById, getCollegeResources, getMaterials, getMaterialsById, postMaterial, recentContribution, updateMaterialsById } from "../controllers/materials";
import { getCollegePeers } from "../controllers/college_peers";
import {leaderBoard } from "../controllers/leaderboard";
import { uploadS3 } from "../utils/multerS3";
import { dashboardStats, getProfile, updateProfile } from "../controllers/profile";
import { deleteSuggestionById, getSuggestions, postSuggestion, updateStatus_Suggestion, updateSuggestionById } from "../controllers/suggestions";
import { login, register, verifyOTP } from "../controllers/auth";
import { getContacts, getContactsById, postContact } from "../controllers/contact";
import { deleteCollegeById, deleteCollegeCourseById, getAllCollegeCourses, getAllColleges, getAuthUserCollege, getCollegeById } from "../controllers/college";
import { deleteCourseById, getCourse, getCourseById, getCourseByLinkId, getCourseByLinkSlug, getCourseBySlug, isCourseOwner, postCourse, postCourseByLinkId, updateCourseById, updateCourseByLinkId, updateCourseBySlugLinkId} from "../controllers/course";
import { getAllJobs, getJobBySlug, postJob } from "../controllers/jobs";


const router = express.Router();

//article routes
router.get("/article",getArticles);
router.get("/article/slug/:slug",getArticleBySlug);
router.get("/student/article/:slug",verifyToken,getArticleByStudentZone);
router.get("/student/article",verifyToken,getAllArticles);
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
router.get("/suggestion",verifyToken,requireRole("Admin"),getSuggestions);
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
router.post("/courses",verifyToken,postCourse);
router.post("/courses/:courseId/:linkId",verifyToken,postCourseByLinkId);
router.get("/iscourseowner/:courseSlug",verifyToken,isCourseOwner);

router.get("/courses/:id",getCourseById);
router.get("/courses/slug/:slug",getCourseBySlug);
router.get("/courses/:id/:linkId",getCourseByLinkId);
router.get("/courses/slug/:courseSlug/:linkSlug",getCourseByLinkSlug);
router.put("/courses/:id",verifyToken,updateCourseById);
router.put("/courses/:courseId/:linkId",verifyToken,updateCourseByLinkId);
router.put("/courses/slug/:courseSlug/:linkSlug",verifyToken,updateCourseBySlugLinkId);
router.delete("/courses/:id",verifyToken,deleteCourseById);

//jobs route
router.get("/jobs",getAllJobs);
router.get("/jobs/:slug",getJobBySlug);
router.post("/jobs",verifyToken,requireRole("Admin"),postJob);

export default router;