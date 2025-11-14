import { Router, Request, Response } from "express";
import { z } from "zod";
import { AuthService } from "../services/auth.service";
import { SignupRequest, LoginRequest, AuthResponse } from "../types/auth";
import { VaultUserData } from "../types/vault";
import { authenticateUser } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate";
import { usersVaultCollection } from "../config/database";

const router = Router();
const authService = new AuthService();

const signupSchema = z.object({
  email: z.email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullname: z.string().min(2, "Name must be at least 2 characters long"),
  phone: z
    .string()
    .regex(
      /^\+?[1-9]\d{1,14}$/,
      "Invalid phone number format (E.164 required)"
    ),
});

const loginSchema = z.object({
  email: z.email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

router.post(
  "/signup",
  validate(signupSchema),
  async (req: Request, res: Response) => {
    try {
      const signupData: SignupRequest = req.body;

      const exists = await authService.userExists(signupData.email);
      if (exists) {
        return res.status(409).json({
          success: false,
          error: "User with this email already exists",
        });
      }

      const user = await authService.createUser(signupData);

      const token = AuthService.generateUserToken({
        userId: user.userId,
      });
      const userVault: VaultUserData = {
        userId: user.userId,
        documents: {},
        personalData: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await usersVaultCollection.insertOne(userVault);

      const response: AuthResponse = {
        success: true,
        data: { user:{
          userId: user.userId,
          email: user.email,
          fullname: user.fullname,
          phone: user.phone,
        },token },
        message: "User registered successfully",
      };

      res.status(201).json(response);
    } catch (error: any) {
      console.error("Signup error:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }
);

router.post(
  "/login",
  validate(loginSchema),
  async (req: Request, res: Response) => {
    try {
      const loginData: LoginRequest = req.body;

      const user = await authService.getUserByEmail(loginData.email);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Invalid email or password",
        });
      }

      const isValidPassword = await AuthService.comparePassword(
        loginData.password,
        user.passwordHash
      );

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: "Invalid email or password",
        });
      }

      await authService.updateLastLogin(user.email);

      const token = AuthService.generateUserToken({
        userId: user.userId
      });

      const response: AuthResponse = {
        success: true,
        data: {user: {
          userId: user.userId,
          email: user.email,
          fullname: user.fullname,
          phone: user.phone,
        },
        token,
      },
        message: "Login successful",
      };

      res.json(response);
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }
);

router.get("/me", authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = await authService.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({
      success: true,
      data:{
        user: {
        userId: user.userId,
        email: user.email,
        fullname: user.fullname,
        phone: user.phone,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    }});
  } catch (error: any) {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export default router;
