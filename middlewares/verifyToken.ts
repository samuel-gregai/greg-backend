import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface JwtPayload {
  userId?: string;
  sub?: string; // Some JWTs use 'sub' instead of 'userId'
  email: string;
  iat: number;
  exp: number;
  [key: string]: any;
}

declare module "express" {
  export interface Request {
    user?: JwtPayload;
  }
}

// Helper function to parse cookies more robustly
const parseCookies = (cookieHeader: string): Record<string, string> => {
  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .reduce((acc, cookie) => {
      const [key, ...valueParts] = cookie.split("=");
      if (key && valueParts.length > 0) {
        acc[key] = decodeURIComponent(valueParts.join("="));
      }
      return acc;
    }, {} as Record<string, string>);
};

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let token: string | undefined;
  try {
    
    // Check Authorization header first (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
      console.log("Found Bearer token in Authorization header");
    } 
    // Fallback to cookies - look for multiple possible cookie names
    else if (req.headers.cookie) {
      const cookies = parseCookies(req.headers.cookie);
      console.log("Available cookies:", Object.keys(cookies));
      
      // Check for various cookie names that might contain the token
      token = cookies.session_token || // Your session token name
              cookies.token || 
              cookies.accessToken ||
              cookies.access_token;
              
      if (token) {
        console.log("Found token in cookies");
      }
    }

    if (!token) {
      console.log("No token found in Authorization header or cookies");
      console.log("Authorization header:", req.headers.authorization);
      console.log("Cookie header:", req.headers.cookie);
      res.status(401).json({
        success: false,
        message: "Access denied. No authentication token provided.",
      });
      return;
    }

    // Validate JWT_SECRET exists
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET environment variable is not configured");
      res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
      return;
    }

    // Verify and decode token
    const decoded = jwt.verify(token, secret) as JwtPayload;
    console.log("Token verified successfully for user:", decoded.email);
    
    // Additional validation (optional)
    if (!decoded.userId && !decoded.sub) {
      throw new Error("Invalid token payload - missing user ID");
    }
    
    // Normalize the user ID field (handle both userId and sub)
    req.user = {
      ...decoded,
      userId: decoded.userId || decoded.sub || '',
    } as JwtPayload;
    
    next();
  } catch (error: any) {
    console.error("JWT verification failed:", error.message);
    console.error("Token that failed:", token ? `${token.substring(0, 20)}...` : 'undefined');
    
    // More specific error messages based on JWT errors
    let message = "Authentication failed";
    if (error.name === "TokenExpiredError") {
      message = "Token has expired";
    } else if (error.name === "JsonWebTokenError") {
      message = "Invalid token";
    } else if (error.name === "NotBeforeError") {
      message = "Token not active yet";
    }
    
    res.status(401).json({
      success: false,
      message,
    });
  }
};