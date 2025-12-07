import express from "express";
import { deleteArticleById, getArticles, getArticlesById, postArticle, updateArticle } from "../controllers/articles";
import {upload} from "../utils/multer";
import { requireRole, verifyToken } from "../middlewares/auth.middleware";
import { deleteMaterialById, getCollegeResources, getMaterials, getMaterialsById, postMaterial, recentContribution, updateMaterialsById } from "../controllers/materials";
import { getCollegePeers } from "../controllers/college_peers";
import {leaderBoard } from "../controllers/leaderboard";
import { uploadS3 } from "../utils/multerS3";
import { dashboardStats, getProfile, updateProfile } from "../controllers/profile";
import { deleteSuggestionById, getSuggestions, postSuggestion, updateStatus_Suggestion, updateSuggestionById } from "../controllers/suggestions";
import { login, sendEmail, verifyOTP } from "../controllers/auth";
import { getContacts, getContactsById, postContact } from "../controllers/contact";
import { getAuthUserCollege, getCollegeById } from "../controllers/college";


const router = express.Router();

//article routes
router.get("/article",getArticles);
router.post("/article",verifyToken,requireRole("Student"),upload.single("thumbnail"),postArticle);

router.get("/article/:id",getArticlesById);
router.put("/article/:id",verifyToken,requireRole("Student"),updateArticle)
router.delete("/article/:id",verifyToken,requireRole("Student"),deleteArticleById);

//college peers route
router.get("/college-peers",verifyToken,requireRole("Student"),getCollegePeers)

//materials routes
router.get("/material",getMaterials);
router.post("/material",verifyToken,requireRole("Student"),uploadS3.array("files",5),postMaterial);
router.get("/recent-contribution",verifyToken,requireRole("Student"),recentContribution);
router.get("/college-resources",verifyToken,requireRole("Student"),getCollegeResources);

router.get("/material/:id",getMaterialsById);
router.put("/material/:id",verifyToken,requireRole("Student"),updateMaterialsById)
router.delete("/material/:id",verifyToken,requireRole("Student"),deleteMaterialById);


//leaderboard route
router.get("/leaderboard",verifyToken,requireRole("Student"),leaderBoard);

//profile route
router.get("/profile",verifyToken,getProfile);
router.get("/profile/:email",verifyToken,getProfile);
router.put("/profile",verifyToken,requireRole("Student"),updateProfile);


//suggestion route
router.get("/suggestion",verifyToken,requireRole("Student"),getSuggestions);
router.get("/suggestion",verifyToken,requireRole("Admin"),getSuggestions);
router.post("/suggestion",verifyToken,requireRole("Student"),postSuggestion);

router.put("/suggestion/:id",verifyToken,requireRole("Student"),updateSuggestionById)
router.put("/suggestion/:id/:status",verifyToken,requireRole("Admin"),updateStatus_Suggestion)
router.delete("/material/:id",verifyToken,requireRole("Student"),deleteSuggestionById);



//register login route
router.post(["/send-email","/register"],sendEmail);
router.post("/verify-otp",verifyOTP); //verifyOTP and Create a User.
router.post("/login",login)

//dashboard-stats
router.get("/dashboard-stats",verifyToken,requireRole("Student"),dashboardStats);

//contact route
router.get("/contact",verifyToken,requireRole("Admin"),getContacts);
router.get("/contact/:id",verifyToken,requireRole("Admin"),getContactsById);
router.post("/contact",postContact);

//college route
router.get("/college",verifyToken,requireRole("Student"),getAuthUserCollege);
router.get("/college/:id",getCollegeById);

export default router;