# 🛡️ DataVault Nigeria

[Live Demo](https://datavault-bay.vercel.app/)

**OAuth-Powered Personal Data Infrastructure for NDPR Compliance**

> Building trust in Nigeria's digital economy by giving citizens control over their personal data while helping organizations stay NDPR compliant.

---

## 📦 How to Run the DataVault Chrome Extension

```bash
# Clone the repository
git clone https://github.com/0x-stone/DataVault.git

# Open Chrome extension management:
# 1. Go to chrome://extensions
# 2. Enable Developer Mode
# 3. Click "Load unpacked" and select this project's extension folder
```

---

## 🎯 Overview

**DataVault Nigeria** is a production-ready personal data infrastructure platform that implements OAuth 2.0-style authorization for identity verification, combined with military-grade encryption and AI-powered NDPR compliance checking.

We enable Nigerian citizens to:
- ✅ Upload their identity documents **once**, encrypted and secure
- ✅ Control **exactly** who accesses their data and for how long
- ✅ Get **real-time notifications** every time their data is accessed
- ✅ **Revoke access** instantly with one click

We enable Nigerian businesses to:
- ✅ Integrate KYC verification in **under 10 minutes**
- ✅ Stay **automatically NDPR compliant**
- ✅ Eliminate data storage **liability**
- ✅ Receive **time-limited access tokens** instead of storing sensitive data

---

## 💔 The Problem

### For Citizens:
- **No Control**: Once you share your BVN or NIN, it's gone forever
- **No Visibility**: You don't know who's accessing your data or when
- **No Recourse**: You can't revoke access even if you want to
- **Data Breaches**: Over 2 million Nigerians affected by data breaches in 2024

### For Companies:
- **NDPR Fines**: Up to ₦10 million per violation
- **Compliance Burden**: Complex regulations, difficult to implement
- **Data Liability**: Storing sensitive data creates security risks
- **Poor UX**: 45% drop-off during lengthy KYC forms

---

## 🚀 Our Solution

DataVault Nigeria is the **first OAuth-powered personal data vault** built specifically for Nigerian NDPR regulations.

### How It Works:

```
1. Citizen uploads data ONCE → Encrypted with AES-256 → Stored securely

2. Company requests access → OAuth authorization → User approves/denies

3. User grants time-limited access → Company gets temporary token → Data accessed

4. User gets notified in real-time → Via Email + WhatsApp

5. Access automatically expires OR user revokes → Company loses access
```

**Think of it as:** *"OAuth for personal data"* or *"Plaid meets GDPR consent management"*

---

## ⭐ Key Features

### 🔐 For Citizens

#### 1. **Encrypted Data Vault**
- Upload identity documents (NIN, BVN, passport, etc.)
- Everything encrypted with **AES-256-GCM** before storage
- **Zero-knowledge architecture**: Even we can't see your data

#### 2. **OAuth Authorization**
- Companies redirect to DataVault for data access
- You see exactly what they want and why
- Approve or deny with one click

#### 3. **Complete Transparency**
- Real-time notifications (Email + WhatsApp)
- Full audit log of every data access
- See who accessed what, when, and how many times

#### 4. **Instant Revocation**
- Revoke company access anytime
- Company immediately locked out
- Logged and auditable

#### 5. **Chrome Extension**
- Automatically scans privacy policies
- Checks NDPR compliance in seconds
- Shows violations and recommendations

#### 6. **WhatsApp AI Assistant**
- Ask questions about NDPR rights
- Get answers from official NDPR 2023 regulation
- Cited sources with section numbers

---

### 🏢 For Companies

#### 1. **Simple OAuth Integration**
```javascript
// Just 3 steps:

// 1. Redirect to DataVault
window.location.href = `https://datavault-bay.vercel.app/authorize?
  company_id=your_id&
  requested_data=nin,bvn&
  purpose=KYC&
  redirect_uri=your_callback`;

// 2. Receive auth code
// User approves → redirected back with code

// 3. Exchange code for token
const response = await fetch('https://datavault.0xstone.xyz/authorize/authorize/token', {
  method: 'POST',
  headers: { 'x-vault-key': 'your_secret_key' },
  body: JSON.stringify({ company_id, code })
});

const { access_token } = await response.json();

// 4. Access data
const data = await fetch('https://datavault.0xstone.xyz/authorize/data', {
  headers: { 'Authorization': `Bearer ${access_token}` }
});
```

#### 2. **Time-Limited Access**
- Tokens expire after specified duration (7-180 days)
- Automatic cleanup of expired tokens
- No long-term data storage liability

#### 3. **Webhooks**
- Real-time notifications on approval/denial/revocation
- Standard webhook payload format
- Retry logic for failed deliveries

#### 4. **NDPR Compliance**
- Check your privacy policy compliance
- AI-powered analysis with specific recommendations
- Automated compliance reporting


---

## 🏗️ System Architecture

### Detailed Component Architecture

```
FRONTEND APPLICATIONS:
├── Web Dashboard (React + TypeScript)
│   ├── Citizen Portal
│   │   ├── Data Upload
│   │   ├── Access Management
│   │   ├── Audit Logs
│   │   └── Settings
│   └── Company Portal
│       ├── API Key Management
│       ├── Usage Analytics
│       ├── Compliance Checker
│       └── Webhook Configuration
│
├── Chrome Extension (Vanilla JS)
│   ├── Content Script (Policy Detection)
│   ├── Popup UI (Results Display)
│   └── NDPR Compliance Engine
│
└── WhatsApp Bot (wwebjs.dev)
    ├── Message Handler
    ├── RAG System (NDPR 2023 PDF)
    └── Response Generator

BACKEND SERVICES:
├── API Gateway
│   ├── Load Balancer (AWS ALB)
│   ├── Rate Limiting (Redis)
│   ├── CORS Handler
│   └── Request Logging
│
├── Auth Service
│   ├── JWT Generation/Verification
│   ├── Password Hashing (bcrypt)
│   ├── Session Management
│   └── 2FA (Future)
│
├── Vault Service
│   ├── Data Encryption (AES-256-GCM)
│   ├── File Upload Handler
│   ├── S3 Integration
│   └── Access Control
│
├── OAuth Service
│   ├── Authorization Flow
│   ├── Code Generation (5-min expiry)
│   ├── Token Management
│   └── Scope Validation
│
├── Company Service
│   ├── Registration
│   ├── API Key Management
│   ├── Data Access (with tokens)
│   └── Usage Tracking
│
├── NDPR Service
│   ├── Policy Scraping (Playwright)
│   ├── AI Analysis (Gemini + RAG)
│   ├── Compliance Scoring
│   └── Recommendation Engine
│
├── Notification Service
│   ├── Email (SendGrid)
│   ├── WhatsApp (Twilio)
│   ├── SMS (Future)
│   └── Push Notifications (Future)
│
└── Webhook Service


DATA LAYER:
├── MongoDB Collections
│   ├── users (auth credentials)
│   ├── vault_data (encrypted personal data)
│   ├── companies (API credentials, hashed)
│   ├── authorization_requests (OAuth requests)
│   ├── access_tokens (time-limited tokens)
│   └── access_logs (complete audit trail)
│
├── AWS S3 Buckets
│   ├── user-documents/ (encrypted NIN, BVN, etc.)
│   ├── company-logos/
│   └── backups/
│


EXTERNAL INTEGRATIONS:
├── Google Gemini (AI/RAG for NDPR)
├── Playwright (Web scraping)
├── AWS Services (EC2, S3, CloudWatch)
└── GitHub Actions (CI/CD)

```

---

## 🔄 OAuth Authorization Flow

### Complete Flow Diagram

```
┌──────────┐                                          ┌──────────┐
│          │                                          │          │
│   USER   │                                          │  KUDA    │
│ (Chioma) │                                          │  BANK    │
│          │                                          │          │
└─────┬────┘                                          └────┬─────┘
      │                                                    │
      │ 1. "I want to open a bank account"                │
      ├───────────────────────────────────────────────────>│
      │                                                    │
      │ 2. Redirect to DataVault OAuth                    │
      │    https://datavault-bay.vercel.app/authorize?                │
      │    company_id=kuda&                               │
      │    requested_data=nin,bvn&                        │
      │    purpose=KYC&                                   │
      │    duration=30&                                   │
      │    redirect_uri=kuda.com/callback                 │
      │<───────────────────────────────────────────────────┤
      │                                                    │
      ▼                                                    │
┌──────────────────┐                                      │
│                  │                                      │
│   DATAVAULT      │                                      │
│   AUTHORIZATION  │                                      │
│   PAGE           │                                      │
│                  │                                      │
│ ┌──────────────┐ │                                      │
│ │ Kuda wants:  │ │                                      │
│ │              │ │                                      │
│ │ ✓ NIN        │ │                                      │
│ │ ✓ BVN        │ │                                      │
│ │              │ │                                      │
│ │ Purpose: KYC │ │                                      │
│ │ Duration:    │ │                                      │
│ │ 30 days      │ │                                      │
│ │              │ │                                      │
│ │ [Approve]    │ │                                      │
│ └──────────────┘ │                                      │
└────────┬─────────┘                                      │
         │                                                 │
         │ 3. User clicks "Approve"                       │
         │                                                 │
         ▼                                                 │
┌──────────────────┐                                      │
│  DATAVAULT API   │                                      │
│                  │                                      │
│  • Generate auth │                                      │
│    code (5-min)  │                                      │
│  • Send Email    │──> 📧 Chioma@email.com              │
│  • Send WhatsApp │──> 📱 +234 803 123 4567             │
│  • Log approval  │                                      │
│                  │                                      │
└────────┬─────────┘                                      │
         │                                                 │
         │ 4. Redirect with code                          │
         │    kuda.com/callback?code=abc123               │
         ├─────────────────────────────────────────────────>│
         │                                                 │
         │                                                 ▼
         │                                    ┌─────────────────────┐
         │                                    │ Kuda Backend        │
         │                                    │                     │
         │                                    │ 5. Exchange code    │
         │                                    │    for token        │
         │ POST /authorize/token              │                     │
         │ Headers:                           │                     │
         │   x-vault-key: dv_sk_xyz           │                     │
         │ Body:                              │                     │
         │   { code, company_id }             │                     │
         │<───────────────────────────────────┤                     │
         │                                    │                     │
         │ Response:                          │                     │
         │ {                                  │                     │
         │   access_token: "dvt_xyz",         │                     │
         │   expires_in: 2592000              │                     │
         │ }                                  │                     │
         ├────────────────────────────────────>│                     │
         │                                    └─────────────────────┘
         │                                                 │
         │                                                 │
         │                                                 │ 6. Access data
         │                                                 │    with token
         │ GET /authorize/data                              │
         │ Authorization: Bearer dvt_xyz                  │
         │<───────────────────────────────────────────────┤
         │                                                 │
         ▼                                                 │
┌──────────────────┐                                      │
│  DATAVAULT API   │                                      │
│                  │                                      │
│  • Verify token  │                                      │
│  • Check expiry  │                                      │
│  • Get vault     │                                      │
│  • Decrypt data  │                                      │
│  • Log access    │                                      │
│  • Notify user   │──> 📧📱 "Kuda accessed your data"  │
│                  │                                      │
│ Response:        │                                      │
│ {                │                                      │
│   nin: "123...", │                                      │
│   bvn: "221..."  │                                      │
│ }                │                                      │
└────────┬─────────┘                                      │
         │                                                 │
         ├─────────────────────────────────────────────────>│
         │                                                 │
         │                                                 ▼
         │                                    ┌─────────────────────┐
         │                                    │ Kuda completes KYC  │
         │                                    │ ✅ Account created  │
         │                                    └─────────────────────┘
         │                                                 
         │ [30 DAYS LATER OR USER REVOKES]                
         │                                                 
         ▼                                                 
    Token expires OR revoked                              
    Kuda loses access ✗                                   
```

### Step-by-Step Breakdown

**STEP 1: Company Initiates**
```
Company redirects user to:
https://datavault.ng/authorize?
  company_id=kuda-001
  &requested_data=nin_front,nin_back,bvn
  &purpose=KYC+verification
  &duration=30
  &redirect_uri=https://kuda.com/callback
  &state=random_csrf_token
```

**STEP 2: User Sees Authorization**
- DataVault shows clean UI
- Lists exactly what data is requested
- Shows why and for how long
- User can approve or deny

**STEP 3: User Approves**
- System generates authorization code (5-min expiry)
- Sends email + WhatsApp notifications
- Logs approval event
- Redirects back to company with code

**STEP 4: Company Exchanges Code**
```bash
POST /authorize/token
Headers:
  x-vault-key: dv_sk_company_secret_key
Body:
  {
    "company_id": "kuda-001",
    "code": "abc123xyz"
  }

Response:
  {
    "access_token": "dvt_xyz789...",
    "token_type": "Bearer",
    "expires_in": 2592000,  # 30 days in seconds
    "expires_at": "2025-12-01T14:30:00Z"
  }
```

**STEP 5: Company Accesses Data**
```bash
GET /api/company/data
Headers:
  Authorization: Bearer dvt_xyz789...

Response:
  {
    "success": true,
    "data": {
      "nin_front": "base64_encoded_image...",
      "nin_back": "base64_encoded_image...",
      "bvn": "22145678901"
    },
    "accessedAt": "2025-11-01T14:30:00Z"
  }
```

**STEP 6: User Gets Notified**
- Email: "Kuda Bank accessed your NIN & BVN at 2:30 PM"
- WhatsApp: Same notification
- Logged in audit trail

**STEP 7: User Can Revoke**
```bash
POST /api/vault/revoke-access
Headers:
  Authorization: Bearer user_jwt_token
Body:
  {
    "tokenId": "token_id_to_revoke"
  }

Response:
  {
    "success": true,
    "message": "Access revoked"
  }
```

Company immediately loses access. Next API call returns:
```json
{
  "error": "Invalid, expired, or revoked access token",
  "errorCode": "TOKEN_INVALID"
}
```

---

## 🛠️ Technology Stack

### Backend
- **Runtime:** Node.js 20.x
- **Framework:** Express.js + TypeScript
- **Database:** MongoDB 7.0 (with replica set)
- **Cache:** Redis (session + rate limiting)
- **Storage:** AWS S3 (encrypted documents)
- **Queue:** RabbitMQ (async jobs)

### Frontend
- **Framework:** React 18 + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** React Query + Zustand
- **Forms:** React Hook Form + Zod validation

### Chrome Extension
- **Manifest:** V3
- **Tech:** Vanilla JavaScript + Tailwind
- **APIs:** Chrome Storage, Tabs, Scripting

### Security
- **Encryption:** AES-256-GCM (data at rest)
- **Transport:** TLS 1.3
- **Auth:** JWT (HS256)
- **Passwords:** bcrypt (10 rounds)
- **Secrets:** AWS Secrets Manager

### AI/ML
- **Model:** Google Gemini Pro
- **Framework:** LangChain
- **RAG:** Vector embeddings on NDPR 2023 PDF
- **Scraping:** Playwright (headless browser)

### DevOps
- **Containers:** Docker + Docker Compose
- **Orchestration:** AWS ECS (production)
- **CI/CD:** GitHub Actions
- **Monitoring:** AWS CloudWatch + Sentry
- **Load Balancer:** AWS ALB
