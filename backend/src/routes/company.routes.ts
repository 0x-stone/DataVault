import { Router, Request, Response } from 'express'
import { CompanyModel } from '../models/Company';
import { S3Storage } from '../config/storage';
import { validate } from '../middleware/validate'
import { authenticateCompany } from '../middleware/company.middleware'
import { companyRegisterSchema, companySaveData, apiKeySchema } from '../validators/company.validators'
import { database, usersVaultCollection, tokensCollection, logsCollection, usersCollection} from '../config/database'
import { Encryption } from '../services/encryption.service';
import { v4 as uuidv4 } from 'uuid';
import { NotificationService } from '../services/notification.service';
import { AuthService } from "../services/auth.service";
import { upload } from '../services/file-upload.service'
import { z } from "zod";

const notificationService = new NotificationService();
const companyRouter = Router();
const companyModel= new CompanyModel();
const s3Storage = new S3Storage();
const authService = new AuthService();

const loginSchema = z.object({
  email: z.email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

companyRouter.post('/register', validate(companyRegisterSchema),  async (req: Request, res: Response) => {
  try {
    const { companyName, email,password } = req.body;
    const companyId = uuidv4()
    const { company } = await companyModel.registerCompany({
      companyId,
      companyName,
      email,
      password
    });

    res.json({
      success: true,
      message: 'success',
      companyId: company.companyId,
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

companyRouter.post(
  "/login",
  validate(loginSchema),
  async (req: Request, res: Response) => {
    try {
      const {email, password} = req.body;

      const company = await companyModel.getCompanyByEmail(email);
      if (!company) {
        return res.status(401).json({
          success: false,
          error: "Invalid email or password",
        });
      }

      const isValidPassword = await AuthService.comparePassword(
        password,
        company.password
      );

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: "Invalid email or password",
        });
      }

      const token = AuthService.generateCompanyToken({
        companyId: company.companyId
      });
      console.log(token)

      const response = {
        success: true,
        data: {company: {
          companyId: company.companyId,
          email: company.email,
          companyName: company.companyName,
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

const fileSchema = z.object({
  originalname: z.string(),
  mimetype: z.string().refine((val) => ["image/png", "image/jpeg"].includes(val), {
    message: "Only PNG or JPEG files allowed",
  }),
  size: z.number().max(2 * 1024 * 1024, { message: "File size must be <= 2MB" }),
  path: z.string(),
});


companyRouter.put('/data', upload.single('file'), authenticateCompany, validate(companySaveData),  async (req: Request, res: Response) => {
  try {
    const { companyName, email, redirectUris, webhookUrl} = req.body;
    const companyId= req.company.companyId
    const logo = req.file
    console.log(logo)
    let logoUrl = null
    if (logo){
    logoUrl= await s3Storage.uploadFile(companyId.slice(-6), `logos/${logo!.originalname}`, logo!.buffer, false)
    console.log(logoUrl)
    }
    await companyModel.updateCompanyData(companyId, {
      companyName,
      email,
      logo:logoUrl,
      redirectUris,
      webhookUrl,
    });

    res.json({
      success: true,
      message: 'Data successfuly updated',
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


companyRouter.post('/keys', authenticateCompany, validate(apiKeySchema), async (req: Request, res: Response) => {
  try {
    const companyId = req.company.companyId
    const { name } = req.body;

    const count = await companyModel.apiKeysCount(companyId);
    if (count >= 5) {
      return res.status(400).json({ success: false, message: 'API key limit (5) reached' });
    }

    const { clientId, secretKey } = await companyModel.createAPIKey(companyId, name);
    res.json({
      success: true,
      message: 'Save your secret key securely. It will not be shown again.',
      data: { clientId, secretKey },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});


companyRouter.get('/keys', authenticateCompany, async (req: Request, res: Response) => {
  try {
    const companyId = req.company.companyId
    const keys = await companyModel.listAPIKeys(companyId);
    res.json({ success: true, data: keys });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});


companyRouter.delete('/keys/:keyId',authenticateCompany, async (req: Request, res: Response) => {
  try {
    const companyId = req.company.companyId
    const { keyId } = req.params;
    const deleted = await companyModel.deleteAPIKey(companyId, keyId);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'API key not found' });
    }

    res.json({ success: true, message: 'API key deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

companyRouter.get("/me", authenticateCompany, async (req: Request, res: Response) => {
  try {
    const company = await companyModel.getCompany(req.company.companyId);
    if (!company) {
      return res.status(404).json({ success: false, error: "company not found" });
    }

    res.json({
      success: true,
      data:{
        company: {
        companyId: company.companyId,
        email: company.email,
        companyName: company.companyName,
        logo: company.logo || null,
        redirectUris: company.redirectUris || [],
        webhookUrl: company.webhookUrl || null,
      },
    }});
  } catch (error: any) {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});


// ========================================
// REQUEST NEW ACCESS (After Revocation)
// ========================================

/**
 * POST /api/company/request-access
 * Headers: x-company-id, x-secret-key
 * Body: {
 *   userId: "chioma@email.com",
 *   requestedData: ["nin_front", "bvn"],
 *   purpose: "Account verification",
 *   duration: 30
 * }
 */

// companyRouter.post('/request-access', validateCompany, async (req: any, res: any) => {
//   try {
//     const { userId, requestedData, purpose, duration } = req.body;
//     const company = req.company;

//     // Verify user exists
//     const user = await usersCollection.findOne({ userId });
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     // Create authorization request
//     const requestId = uuidv4();
//     const authRequest = {
//       requestId,
//       companyId: company.companyId,
//       userId,
//       requestedData,
//       purpose,
//       duration: duration || 30,
//       redirectUri: company.redirectUris[0], // Use first registered URI
//       status: 'pending',
//       createdAt: new Date()
//     };

//     await authRequestsCollection.insertOne(authRequest);

//     // Notify user
//     await notificationService.notifyAccessRequest(
//       { email: user.email, phone: user.phone, name: user.name },
//       { companyName: company.companyName },
//       requestedData
//     );

//     res.json({
//       success: true,
//       requestId,
//       message: 'Access request sent to user. You will receive a webhook when user responds.',
//       authorizationUrl: `https://datavault.ng/authorize/consent?request_id=${requestId}`
//     });

//   } catch (error: any) {
//     res.status(500).json({ error: error.message });
//   }
// });

export default companyRouter;