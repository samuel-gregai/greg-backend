import { Router } from "express";
import { signupHandler, signinHandler, googleAuthServer, googleResourceServer, getUserProfile } from "../controllers/auth.controllers.ts";
import { verifyToken } from "../middlewares/verifyToken.ts";


const router = Router();


router.post("/auth/signin", signinHandler);
router.post("/auth/signup", signupHandler);
router.get("/users/me", verifyToken, getUserProfile); // Now includes both middleware and handler
router.get("/auth/google", googleAuthServer)
router.get("/auth/callback", googleResourceServer)

export default router

