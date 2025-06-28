import { Router } from "express";
import { signupHandler, signinHandler, googleAuthServer, googleResourceServer, getUserProfile } from "../controllers/auth.controllers";
import { verifyToken } from "../middlewares/verifyToken";


const router = Router();


router.post("/auth/signin", signinHandler);
router.post("/auth/signup", signupHandler);
router.get("/users/me", verifyToken, getUserProfile); 
router.get("/auth/google", googleAuthServer)
router.get("/auth/callback", googleResourceServer)

export default router

