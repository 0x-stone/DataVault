import { Router, Request, Response } from "express";
import { authenticateUser } from "../middleware/auth.middleware";
import {
  usersVaultCollection,
  tokensCollection,
  logsCollection,
  usersCollection,
  companiesCollection
} from "../config/database";
import { Encryption } from "../services/encryption.service";
import { S3Storage } from "../config/storage";
import { NotificationService } from "../services/notification.service";
import { WebhookService } from "../services/webhook.service";
import { VaultUserData, VaultPersonalData } from "../types";
import { v4 as uuidv4 } from "uuid";
import { validate } from "../middleware/validate";
import {
  DocumentUploadSchema,
  PersonalDataUploadSchema,
} from "../validators/vault.validator";
import { upload } from "../services/file-upload.service";

const router = Router();
const s3Storage = new S3Storage();
const notificationService = new NotificationService();
const webhookService = new WebhookService();

router.post(
  "/documents",
  authenticateUser,
  upload.single("file"),
  validate(DocumentUploadSchema),
  async (req: Request, res: Response) => {
    try {
      const { documentType } = req.body;
      const file = req.file;
      const userId = req.user!.userId;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const fileUrl = await s3Storage.uploadFile(
        userId.slice(-6),
        `${documentType}-${file.originalname}`,
        file.buffer
      );

      await usersVaultCollection.updateOne(
        { userId: userId },
        {
          $set: {
            [`documents.${documentType}`]: fileUrl,
            updatedAt: new Date(),
          },
        }
      );
      res.status(200).json({
        success: true,
        message: "Document uploaded and encrypted successfully",
        data:{documentType},
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.post(
  "/data",
  authenticateUser,
  validate(PersonalDataUploadSchema),
  async (req: Request, res: Response) => {
    try {
      const { bvn, nin, dob, address } = req.body;
      const userId = req.user!.userId;
      const personalData: VaultPersonalData = {};

      if (bvn) personalData.bvn = Encryption.encrypt(bvn);
      if (nin) personalData.nin = Encryption.encrypt(nin);
      if (dob) personalData.dob = Encryption.encrypt(dob);
      if (address) personalData.address = Encryption.encrypt(address);

      const updateFields: Record<string, any> = {};
      for (const [key, value] of Object.entries(personalData)) {
        if (value !== undefined) {
          updateFields[`personalData.${key}`] = value;
        }
      }
      await usersVaultCollection.updateOne(
        { userId: userId },
        {
          $set: {
            ...updateFields,
            upadtedAt: new Date(),
          },
        }
      );
      res.json({
        success: true,
        message: "Personal data encrypted and stored successfully",
        data: {}
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get("/data", authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const userVault = await usersVaultCollection.findOne({ userId });
    const user = await usersCollection.findOne({ userId })
    const decryptedData: Record<string, string> = {};
    for (const [key, value] of Object.entries(userVault!.personalData)) {
      try {
        decryptedData[key] = Encryption.decrypt(value as string);
        if (key === "bvn" || key === "nin") {
          decryptedData[key] = "***" + decryptedData[key].slice(-4);
        }
      } catch (e) {
        decryptedData[key] = "[Encrypted]";
      }
    }
    let documents: Record<string, boolean> ={}
    if (userVault!.documents){
    const documentTypes= ['nin_front', 'nin_back', 'passport', 'driver_license', 'utility_bill'] as const
    documents = Object.fromEntries(
  documentTypes
    .filter(type => userVault?.documents?.[type])
    .map(type => [type, true])
);}
    res.json({
      success: true,
      message: '',
      data: {
        fullname: user!.fullname,
        email: user!.email,
        phone: user!.phone,
        documents,
        personalData: decryptedData,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get(
  "/access-logs",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const logs = await logsCollection
        .find(
          { userId: req.user!.userId },
          {
            projection: {
              _id: 0,
              logId: 1,
              action: 1,
              companyId: 1,
              companyName: 1,
              description: 1,
              dataAccessed: 1,
              timestamp: 1,
            },
          }
        )
        .sort({ timestamp: -1 })
        .limit(100)
        .toArray();

      const formattedLogs = logs.map((log) => ({
        action: log.action,
        companyId: log.companyId,
        companyName: log.companyName ?? "Unknown Company",
        description: log.description,
        dataAccessed: log.dataAccessed ?? [],
        timestamp: log.timestamp,
      }));

      res.json({
        success: true,
        count: formattedLogs.length,
        data: formattedLogs,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get(
  "/active-access",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const activeTokens = await tokensCollection
        .find({
          userId: req.user!.userId,
          status: "active",
          expiresAt: { $gt: new Date() },
        })
        .toArray();
      const tokensWithCompanyInfo = await Promise.all(
        activeTokens.map(async (token) => {
          const daysLeft = Math.ceil(
            (token.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );

          return {
            tokenId: token.tokenId,
            companyName: token.companyName,
            requestedData: token.requestedData,
            grantedAt: token.grantedAt,
            expiresAt: token.expiresAt,
            daysLeft,
            accessCount: token.accessCount,
            lastAccessedAt: token.lastAccessedAt,
            token: token.token.substring(0, 10) + "...",
          };
        })
      );

      res.json({
        success: true,
        data: tokensWithCompanyInfo,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.post(
  "/revoke-access",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { tokenId } = req.body;
      const userId = req.user!.userId;

      if (!tokenId) {
        return res.status(400).json({ error: "Token ID is required" });
      }

      const token = await tokensCollection.findOne(
        { tokenId, userId },
        { projection: { companyName: 1, companyId: 1, status: 1, token: 1 } }
      );

      if (!token) {
        return res
          .status(404)
          .json({ error: "Token not found or not associated with this user" });
      }

      if (token.status !== "active") {
        return res
          .status(400)
          .json({ error: "Token is already expired or revoked" });
      }

      const result = await tokensCollection.updateOne(
        { tokenId, userId, status: "active" },
        { $set: { status: "revoked", revokedAt: new Date() } }
      );

      if (result.modifiedCount === 0) {
        return res
          .status(400)
          .json({
            error: "Failed to revoke token. It may already be revoked.",
          });
      }

      await logsCollection.insertOne({
        logId: uuidv4(),
        companyName: token.companyName,
        companyId: token.companyId,
        userId,
        action: "token_revoked",
        description: `User revoked ${token.companyName}'s access`,
        timestamp: new Date(),
      });
      const companyId= token.companyId
      const company= await companiesCollection.findOne({companyId})
      await webhookService.notifyRevocation(company!, token.token);

      res.json({
        success: true,
        message: `Revoked access`,
        data: {}
      });
    } catch (error: any) {
      console.error("Error revoking token:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// router.get('/pending-requests', authenticateUser, async (req: any, res: Response) => {
//   try {
//     const authRequestsCollection = database.getDB().collection('authorization_requests');

//     const pendingRequests = await authRequestsCollection
//       .find({
//         userId: req.userId,
//         status: 'pending'
//       })
//       .sort({ createdAt: -1 })
//       .toArray();

//     const requestsWithCompanyInfo = await Promise.all(
//       pendingRequests.map(async (request) => {
//         return {
//           requestId: request.requestId,
//           companyName: request.companyName || 'Unknown',
//           requestedData: request.requestedData,
//           purpose: request.purpose,
//           duration: request.duration,
//           createdAt: request.createdAt
//         };
//       })
//     );

//     res.json({
//       success: true,
//       pendingRequests: requestsWithCompanyInfo
//     });

//   } catch (error: any) {
//     res.status(500).json({ error: error.message });
//   }
// });

export default router;
