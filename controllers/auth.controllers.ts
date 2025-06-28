import type { Request, Response } from "express";
import { User } from "../models/users.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";
import { Account } from "../models/accounts.model";

interface OAUTHJWTPAYLOAD {
  email: string;
  given_name: string;
  family_name: string;
  email_verified: boolean;
  name: string;
  picture: string;
  iat: number;
  exp: number;
}
const signinHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const userCredentials = req.body;
    const user = await User.findOne({ email: userCredentials.email });

    if (!user || typeof user.password !== "string") {
      res.status(404).json({ message: "User does not exist" });
      return;
    }

    const isPasswordMatch = await bcrypt.compare(
      userCredentials.password,
      user.password
    );
    if (!isPasswordMatch) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const jwt_secret = process.env.JWT_SECRET!;
    const payload = {
      userId: user?.id,
      email: userCredentials.email,
    };

    const token = jwt.sign(payload, jwt_secret, {
      expiresIn: "1h",
    });

    res.status(200).json({ message: "Login successful", user, token });
  } catch (error) {
    console.error("Error getting user", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const googleAuthServer = async (req: Request, res: Response): Promise<void> => {
  const CLIENT_ID = process.env.CLIENT_ID;
  if (!CLIENT_ID) res.status(500).send("Missing CLIENT_ID");

  const redirectUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  redirectUrl.searchParams.set("client_id", CLIENT_ID!);
  redirectUrl.searchParams.set(
    "redirect_uri",
    "https://greg-backend.onrender.com/auth/callback"
  );
  redirectUrl.searchParams.set("response_type", "code");
  redirectUrl.searchParams.set("scope", "email profile");
  redirectUrl.searchParams.set("access_type", "offline");
  redirectUrl.searchParams.set("prompt", "consent");
  redirectUrl.searchParams.set("state", "random_csrf_token");
  res.redirect(redirectUrl.toString());
};

const googleResourceServer = async (req: Request, res: Response): Promise<void> => {
  const code = req.query.code as string;
  const CLIENT_ID = process.env.CLIENT_ID!;
  const CLIENT_SECRET = process.env.CLIENT_SECRET!;
  const JWT_SECRET = process.env.JWT_SECRET!; // Use the same secret as verifyToken

  console.log("code", code)


  if (!code) {
    res.status(400).send("No code provided");
    return;
  }

  try {
    // Exchange code for tokens
    const tokenRes = await axios.post("https://oauth2.googleapis.com/token", null, {
      params: {
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: "https://greg-backend.onrender.com/auth/callback",
        grant_type: "authorization_code",
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const { access_token, id_token, refresh_token } = tokenRes.data;

    // Decode id_token (JWT with user info)
    const decoded = jwt.decode(id_token) as any;
    const { email, given_name, family_name, picture, email_verified } = decoded;

    // Create or find user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        firstName: given_name,
        lastName: family_name,
      });
    }

    // Create or update account
    let account = await Account.findOne({ userId: user.id });
    if (!account) {
      account = await Account.create({
        userId: user.id,
        access_token,
        refresh_token,
        email_verified,
        picture,
      });
    } else {
      // Update existing account
      account.access_token = access_token;
      account.refresh_token = refresh_token;
      account.email_verified = email_verified;
      account.picture = picture;
      await account.save();
    }

    // Use the same JWT_SECRET as verifyToken middleware
    const sessionToken = jwt.sign(
      { email: user.email, userId: user.id },
      JWT_SECRET, // Changed from hardcoded "SECRET"
      { expiresIn: "7d" }
    );

    res.cookie("session_token", sessionToken, {
      httpOnly: true,
      sameSite: "none",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    //Redirect to frontend
    res.redirect('http://localhost:1856/actions');

  } catch (error:any) {
    console.error("Error during OAuth callback:", error.response?.data || error.message || error);
    res.status(500).send("Authentication failed");
  }
};


const signupHandler = async (req: Request, res: Response): Promise<void> => {
  const userCredentials = req.body;
  console.log(userCredentials)
  try {
    const existingUser = await User.findOne({ email: userCredentials.email });
    if (existingUser) {
      res
        .status(409)
        .json({ message: "Account with this email already exists" });
    }
    const salt = 10;
    const hashPassword = await bcrypt.hash(userCredentials.password, salt);
    
    const newUser = await User.create({
      ...userCredentials,
      password: hashPassword,
    });
    console.log(newUser);
    res.status(201).json({ message: "Signup Successful" });
  } catch (error) {
    console.error("Error creating account", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

 const user = await User.findOne({ id: req.user.userId });
 if (!user) {
   res.status(404).json({ message: "User not found" });
   return;
 }

    // Return user data in the format expected by frontend
    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstname: user.firstName,
        lastname: user.lastName,
        name: `${user.firstName} ${user.lastName}`.trim(),
      }
    });
  } catch (error) {
    console.error("Error getting user profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export { signinHandler, signupHandler, googleAuthServer, googleResourceServer, getUserProfile };



