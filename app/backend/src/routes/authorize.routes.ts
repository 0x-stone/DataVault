import { Router, Request, Response } from 'express';
import { authRequestsCollection, tokensCollection, companiesCollection, logsCollection, usersCollection, usersVaultCollection  } from '../config/database'
import { authenticateUser } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate'
import { VaultAuthorizationRequestSchema, VaultAuthorizationTokenSchema, VaultAuthorizationDataSchema } from '../validators/vault.validator'
import { CompanyModel } from '../models/Company';
import { NotificationService } from '../services/notification.service';
import { WebhookService } from '../services/webhook.service';
import { S3Storage } from "../config/storage";
import { Encryption } from '../services/encryption.service';
import {VaultDocuments, VaultPersonalData} from '../types'
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const router = Router();
const companyModel = new CompanyModel();
const notificationService = new NotificationService();
const webhookService = new WebhookService();
const s3Storage = new S3Storage();



router.get('/authorize', authenticateUser, async (req: Request, res: Response) => {
  try {
    const {
      client_id,
      requested_data,
      purpose,
      duration,
      redirect_uri,
      state
    } = VaultAuthorizationRequestSchema.parse(req.query);

    const companyId = await companyModel.validateAPIKey(client_id);
    if (!companyId) {
      return res.status(404).json({ message: 'Invalid client ID' });
    }

    const company= await companyModel.getCompany(companyId)
    if (!company){
       return res.status(404).json({ message: 'Invalid client ID' });
    }
    if (!company.redirectUris){
       return res.status(404).json({ message: 'Invalid redirect_uri' });
    }
    if (!company.redirectUris.includes(redirect_uri as string)) {
      return res.status(400).json({ message: 'Invalid redirect_uri' });
    }

    res.json({
      success:true,
      message:'',
      data: {
      company: {
        name: company.companyName,
        logo: company.logo
      },
      requestedData: requested_data,
      purpose: purpose,
      duration: duration,
    }});

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


router.post('/authorize/consent', authenticateUser, async (req: Request, res: Response) => {
  try {
    const {
      client_id,
      requested_data,
      purpose,
      duration,
      redirect_uri,
      state
    } = VaultAuthorizationRequestSchema.parse(req.body);

    const userId = req.user!.userId;

    const companyId = await companyModel.validateAPIKey(client_id);
    if (!companyId) {
      return res.status(404).json({ message: 'Invalid client ID' });
    }

    const company= await companyModel.getCompany(companyId)
    if (!company){
       return res.status(404).json({ message: 'Invalid client ID' });
    }
    if (!company.redirectUris){
       return res.status(404).json({ message: 'Invalid redirect_uri' });
    }
    if (!company.redirectUris.includes(redirect_uri as string)) {
      return res.status(400).json({ message: 'Invalid redirect_uri' });
    }

    const accessCode = crypto.randomBytes(32).toString('hex');
    
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 5);



    await authRequestsCollection.insertOne({
      requestId: uuidv4(),
      companyId: companyId,
      companyName: company.companyName, 
      userId,
      requestedData: requested_data,
      purpose,
      duration,
      redirectUri: redirect_uri,
      state,
      status: "pending",
      createdAt: new Date(),
      accessCode,
      expiry
    });

    res.json({
      success: true,
      message:'',
      data:{redirectUrl: `${redirect_uri}?code=${accessCode}&state=${state}`},
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/authorize/token', async (req: Request, res: Response) => {
  try {
    const secretKey = req.headers['x-vault-key'] as string;
    const { client_id, code } = VaultAuthorizationTokenSchema.parse(req.body)

    if (!secretKey) {
      return res.status(401).json({ error: 'Missing X-VAULT-KEY header' });
    }

    if (!client_id || !code) {
      return res.status(400).json({ error: 'Missing company_id or code' });
    }

    const companyId = await companyModel.validateAPIKey(client_id, secretKey);
    if (!companyId) {
      return res.status(401).json({ error: 'Invalid secret key or client_id' });
    }
    const company = await companyModel.getCompany(companyId)
    if (!company){
      return res.status(401).json({ error: 'Invalid secret key or client_id' });
    }
    const authRequest = await authRequestsCollection.findOne({ 
      accessCode: code,
      companyId: companyId,
      status: 'pending'
    });

    if (!authRequest) {
      return res.status(404).json({ error: 'Invalid or expired authorization code' });
    }

    if (authRequest.expiry && new Date() > new Date(authRequest.expiry)) {
      await authRequestsCollection.deleteOne(
        { id: authRequest.requestId },
      );
      return res.status(400).json({ message: 'Authorization code has expired' });
    }

    const userVault = await usersVaultCollection.findOne({ userId: authRequest.userId });
    if (!userVault) {
      return res.status(404).json({ error: 'User Vault not found' });
    }

    const accessToken = Encryption.generateToken()
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + authRequest.duration);
    
    const tokenId = uuidv4()

    await tokensCollection.insertOne({
      token: accessToken,
      tokenId,
      companyId: authRequest.companyId,
      companyName: company.companyName,
      userId: authRequest.userId,
      requestedData: authRequest.requestedData,
      grantedAt: new Date(),
      expiresAt,
      status: 'active',
      accessCount: 0
    });

    await authRequestsCollection.updateOne(
      { id: authRequest.requestId },
      { $set: { status: 'approved', decidedAt: new Date() } }
    );
    const user= await usersCollection.findOne({userId:userVault.userId})

    if (user) notificationService.notifyAccessRequest(
      { email: user.email, phone: user.phone, name: user.fullname },
      { companyName: company.companyName },
      authRequest.requestedData
    );
    await logsCollection.insertOne({
      logId: uuidv4(),
      companyId: authRequest.companyId,
      companyName: company.companyName,
      userId: authRequest.userId,
      action: 'request_approved',
      description: `User approved ${company.companyName}'s request for ${authRequest.requestedData.join(', ')}`,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: '',
      data: {access_token: accessToken,
      token_type: 'Bearer',
      expires_in: Math.floor((expiresAt.getTime() - Date.now()) / 1000),
      expires_at: expiresAt}
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


router.get('/data', async (req: Request, res: Response) => {
  try {
    const { client_id } = VaultAuthorizationDataSchema.parse(req.query);
    const secretKey = req.headers["x-vault-key"] as string
    if (!secretKey) {
      return res.status(401).json({ error: 'Missing X-VAULT-KEY header' });
    }
    const authHeader = req.headers['authorization'];
    const access_token = authHeader!.split(' ')[1]
        if (!access_token) {
      return res.status(400).json({ error: 'Access token required' });
    }

    const companyId = await companyModel.validateAPIKey(client_id, secretKey);

    if (!companyId) {
      return res.status(401).json({ error: 'Invalid secret key or client_id' });
    }
    const company = await companyModel.getCompany(companyId)

    const token = await tokensCollection.findOne({
      token: access_token,
      status: 'active',
      expiresAt: { $gt: new Date() }
    });

    if (!token) {
      return res.status(403).json({
        error: 'Invalid, expired, or revoked access token',
        errorCode: 'TOKEN_INVALID'
      });
    }

    const userVault = await usersVaultCollection.findOne({ userId: token.userId });
    const user= await usersCollection.findOne({ userId: token.userId })
    if (!userVault) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(JSON.stringify(token.requestedData))
type AllowedFields = 
  'fullname' | 'email' | 'phone' | 
  keyof VaultDocuments | 
  keyof VaultPersonalData;

const responseData: Record<string, any> = {};

for (const field of token.requestedData as AllowedFields[]) {
  // user base data
  if (['fullname', 'email', 'phone'].includes(field)) {
    const key = field as 'fullname' | 'email' | 'phone';
    responseData[field] = user?.[key];
    continue;
  }

  // vault documents
  else if (userVault.documents && field in userVault.documents) {
    const fileKey = userVault.documents[field as keyof VaultDocuments];
    if (fileKey) {
      const fileBuffer = await s3Storage.getFile(fileKey);
      responseData[field] = fileBuffer.toString('base64');
      continue;
    }
  }

  // personal data
  else if (userVault.personalData && field in userVault.personalData) {
    const encryptedValue = userVault.personalData[field as keyof VaultPersonalData];
    if (encryptedValue) {
      responseData[field] = Encryption.decrypt(encryptedValue);
    }
  }
}


    
    await logsCollection.insertOne({
      logId: uuidv4(),
      companyId: token.companyId,
      userId: token.userId,
      companyName: token.companyName, 
      action: 'read',
      dataAccessed: token.requestedData,
      description: `${company!.companyName} accessed ${token.requestedData.join(', ')}`,
      timestamp: new Date(),
    });

    await tokensCollection.updateOne(
      { token: access_token },
      { 
        $inc: { accessCount: 1 },
        $set: { lastAccessedAt: new Date() }
      }
    );

    await notificationService.notifyDataAccess(
      { email: user!.email, phone: user!.phone, name: user!.fullname },
      { companyName: company!.companyName},
      token.requestedData
    );

    res.json({
      success: true,
      data: responseData,
      accessedAt: new Date()
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


export default router;