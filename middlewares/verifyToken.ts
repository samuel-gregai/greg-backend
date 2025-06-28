import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface JwtPayload {
  userId?: string;
  sub?: string;
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

// Main middleware that handles both JWT and session authentication
export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let token: string | undefined;
  let authMethod: 'jwt' | 'session' = 'jwt';
  
  try {
    // Check Authorization header first (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
      authMethod = 'jwt';
      console.log("Found Bearer token in Authorization header");
    } 
    // Fallback to cookies for session-based auth
    else if (req.headers.cookie) {
      const cookies = parseCookies(req.headers.cookie);
      console.log("Available cookies:", Object.keys(cookies));
      
      // Check for session token in cookies
      token = cookies.session_token || 
              cookies.token || 
              cookies.accessToken ||
              cookies.access_token;
              
      if (token) {
        authMethod = 'session';
        console.log("Found session token in cookies");
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
    console.log(`${authMethod} token verified successfully for user:`, decoded.email);
    
    // Additional validation
    if (!decoded.userId && !decoded.sub) {
      throw new Error("Invalid token payload - missing user ID");
    }
    
    // Normalize the user ID field and add auth method info
    req.user = {
      ...decoded,
      userId: decoded.userId || decoded.sub || '',
      authMethod, // Add this to track how user was authenticated
    } as JwtPayload & { authMethod: 'jwt' | 'session' };
    
    next();
  } catch (error: any) {
    console.error(`${authMethod} verification failed:`, error.message);
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
      authMethod,
    });
  }
};

// Optional: Separate middleware for JWT-only routes
export const verifyJWTOnly = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "JWT token required in Authorization header",
    });
    return;
  }
  
  // Use the main middleware logic but force JWT method
  verifyToken(req, res, next);
};

// Optional: Separate middleware for session-only routes
export const verifySessionOnly = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.headers.cookie) {
    res.status(401).json({
      success: false,
      message: "Session cookie required",
    });
    return;
  }
  
  // Use the main middleware logic but force session method
  verifyToken(req, res, next);
};