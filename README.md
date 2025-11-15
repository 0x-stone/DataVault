<p align="center">
  <img width="120" alt="datavault" src="https://github.com/user-attachments/assets/ab805470-c752-4dcf-b2c6-cdbddf74b500" />
</p>

<h1 align="center">DataVault Nigeria</h1>

<p align="center">
  <strong>OAuth-Powered Personal Data Infrastructure for NDPR & NDPA Compliance</strong>
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-20.x-green.svg" alt="Node.js"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.3-blue.svg" alt="TypeScript"></a>
  <a href="https://www.mongodb.com/"><img src="https://img.shields.io/badge/MongoDB-7.0-green.svg" alt="MongoDB"></a>
  <a href="https://www.dataverseconsultingsolutions.com/94b039b8"><img src="https://img.shields.io/badge/Privacy_Hackathon-2025-gold.svg" alt="Hackathon"></a>
</p>

<p align="center">
  <a href="https://datavault-bay.vercel.app/">🌐 Live Demo</a> • 
  <a href="#-demo-video">📹 Demo Video</a> • 
</p>

<p align="center">
  Building trust in Nigeria's digital economy by giving citizens control over their personal data while helping organizations stay NDPR & NDPA compliant.
</p>

---

## 🎬 Demo Video

https://github.com/user-attachments/assets/50804fe0-e2ea-4874-a9c5-50ca7de62cbb

*Watch our 2-minute demo showing OAuth flow, encryption, real-time notifications, and NDPR compliance checking.*

---

## 🎯 Overview

**DataVault Nigeria** is an OAuth-powered personal data infrastructure platform that gives citizens complete control over their identity documents while helping businesses stay automatically NDPR compliant.

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
- **Data Liability**: Storing sensitive data creates massive security risks
- **Poor UX**: 45% drop-off during lengthy KYC forms

---

## 🚀 Our Solution

DataVault Nigeria is an **OAuth-powered personal data vault** built specifically for Nigerian NDPR & NDPA regulations.

### How It Works:

```
1. Citizen uploads data ONCE → Encrypted with AES-256 → Stored securely

2. Company requests access → OAuth authorization → User approves/denies

3. User grants time-limited access → Company gets temporary token → Data accessed

4. User gets notified in real-time → Via Email + WhatsApp

5. Access automatically expires OR user revokes → Company loses access
```

**Think of it as:** *"OAuth for personal data"*

---

## 🏆 What Makes DataVault Different

| Feature | Traditional KYC | DataVault Nigeria |
|---------|----------------|-------------------|
| **Data Storage** | Company stores forever | Time-limited tokens (7-180 days) |
| **User Control** | None | Full transparency + instant revocation |
| **Compliance** | Manual, error-prone | AI-powered, automatic |
| **Integration Time** | Weeks/months | Under 10 minutes |
| **Data Breaches** | Company liability | Zero liability (we store, they access) |
| **Notifications** | None | Real-time Email + WhatsApp |
| **NDPR Compliance** | Uncertain | Built-in by design |
| **User Experience** | Multiple forms | One-click authorization |

---

## ⭐ Key Features

### 🔐 For Citizens

#### 1. **Encrypted Data Vault**
- Upload identity documents (NIN, BVN, passport, driver's license, etc.)
- Everything encrypted with **AES-256-GCM** before storage
- **Zero-knowledge architecture**: Even we can't see your data

#### 2. **OAuth Authorization**
- Companies redirect to DataVault for data access
- You see exactly what they want and why
- Approve or deny with one click
- Set custom access durations

#### 3. **Complete Transparency**
- Real-time notifications via Email + WhatsApp
- Full audit log of every data access
- See who accessed what, when, and how many times
- Export your complete access history

#### 4. **Instant Revocation**
- Revoke company access anytime from your dashboard
- Company immediately locked out
- All actions logged and auditable

#### 5. **Chrome Extension**
- Automatically scans privacy policies on any website
- Checks NDPR compliance in seconds
- Shows violations and specific recommendations
- One-click compliance reports

#### 6. **WhatsApp AI Assistant**
- Ask questions about your NDPA rights
- Get answers from official NDPA 2023 regulation
- Cited sources with exact section numbers
- 24/7 availability

---

### 🏢 For Companies

#### 1. **Simple OAuth Integration**
```javascript
// Just 4 easy steps to integrate DataVault:

// Step 1: Register your company
// Visit: https://datavault-bay.vercel.app/company/register

// Step 2: Redirect user to DataVault
window.location.href = `https://datavault-bay.vercel.app/authorize?
  client_id=your_client_id&
  requested_data=nin,bvn&
  purpose=KYC+verification&
  duration=30&
  redirect_uri=https://yoursite.com/callback`;

// Step 3: Receive authorization code
// User approves → redirected back with code parameter

// Step 4: Exchange code for access token
const response = await fetch('https://datavault.0xstone.xyz/authorize/authorize/token', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'x-vault-key': 'your_secret_key' 
  },
  body: JSON.stringify({ 
    client_id: 'your_client_id',
    code: authCode 
  })
});
const data= await response.json()
const { access_token, expires_in } = data.data;

// Step 5: Access user data
const userData = await fetch(`https://datavault.0xstone.xyz/authorize/data?client_id=your_client_id`, {
  headers: { 
    'Authorization': `Bearer ${access_token}`,
    'x-vault-key': 'your_secret_key'
  }
});

const data = await userData.json();
// Returns: { nin, bvn, etc. }
```

#### 2. **Time-Limited Access**
- Tokens expire after specified duration (1-180 days)
- Automatic cleanup of expired tokens
- No long-term data storage liability
- Renewal requests sent automatically before expiry

#### 3. **Webhooks & Real-Time Updates**
- Get notified when users approve/deny/revoke access
- Standard webhook payload format
- Built-in retry logic for failed deliveries
- Test webhooks in dashboard

#### 4. **AI-Powered NDPR Compliance**
- Upload your privacy policy for instant analysis
- Get specific violation warnings and recommendations
- Track compliance score over time
- Automated compliance reporting for audits

---

## 📸 Screenshots

### Citizen Dashboard
<img width="1919" height="895" alt="Citizen Dashboard" src="https://github.com/user-attachments/assets/0e4dcf83-fcfb-4d7b-975d-8af76c08421f" />
<img width="1914" height="927" alt="Citizen Dashboard" src="https://github.com/user-attachments/assets/79f6f123-e50d-4107-a157-dae7bbae5590" />

*Complete control over your data with real-time access logs*

### OAuth Authorization Flow
<img width="1885" height="920" alt="authorization" src="https://github.com/user-attachments/assets/b421a69e-1efa-4c28-ba55-988a2b31ea3f" />

*Clean, transparent authorization screen showing exactly what's requested*

### Chrome Extension in Action
<img width="1893" height="909" alt="extension" src="https://github.com/user-attachments/assets/cde78f15-62ef-4dcd-956c-28da7ea06a1f" />

*Instant NDPR compliance checking on any website*

### WhatsApp Bot Assistant
<img width="1499" height="955" alt="whatsapp" src="https://github.com/user-attachments/assets/8a7696b3-95da-432b-a315-cda24661c5fe" />

*AI-powered legal assistance 24/7*

---

## 🔄 Complete OAuth Authorization Flow

```
┌──────────┐                                          ┌──────────┐
│  CITIZEN │                                          │  COMPANY │
│ (Chioma) │                                          │  (Kuda)  │
└─────┬────┘                                          └────┬─────┘
      │                                                    │
      │ 1. "Open bank account"                            │
      ├───────────────────────────────────────────────────>│
      │                                                    │
      │ 2. Redirect to DataVault                          │
      │<───────────────────────────────────────────────────┤
      ▼                                                    │
┌──────────────────┐                                      │
│   DATAVAULT      │                                      │
│   AUTHORIZATION  │                                      │
│                  │                                      │
│  Kuda wants:     │                                      │
│  ✓ NIN           │                                      │
│  ✓ BVN           │                                      │
│  Purpose: KYC    │                                      │
│  Duration: 30d   │                                      │
│                  │                                      │
│  [Approve]       │                                      │
└────────┬─────────┘                                      │
         │                                                 │
         │ 3. User approves                               │
         ├─────────────────────────────────────────────────>│
         │    Returns: auth_code                          │
         │                                                 │
         │ 4. Exchange code for token                     │
         │<───────────────────────────────────────────────┤
         │    Returns: access_token                       │
         │                                                 │
         │ 5. Access data with token                      │
         │<───────────────────────────────────────────────┤
         │    Returns: encrypted data                     │
         │                                                 │
         │ 6. Send notification                           │
         ├──> 📧 Email + 📱 WhatsApp                      │
```


---

## 🏗️ System Architecture

### High-Level Architecture
```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Citizen   │◄────►│  DataVault   │◄────►│  Companies  │
│  Frontend   │      │    Backend   │      │    (API)    │
└─────────────┘      └──────┬───────┘      └─────────────┘
                            │
                     ┌──────┴───────┐
                     ▼              ▼
              ┌─────────┐    ┌──────────┐
              │ MongoDB │    │  AWS S3  │
              │  (Meta) │    │(Encrypted│
              │         │    │Documents)│
              └─────────┘    └──────────┘
```

### Security Architecture
```
User Data Flow:
1. Upload → AES-256-GCM Encryption → S3 Storage
2. Access Request → JWT Auth → Token Validation → Decryption
3. Every step logged for audit trails
```

**[View Detailed Architecture Documentation →](ARCHITECTURE.md)**

---

## 🔒 Security Features

✅ **AES-256-GCM Encryption** - Military-grade encryption for all data at rest  
✅ **Zero-Knowledge Architecture** - Even we can't see user data  
✅ **JWT Authentication** - Secure session management with short expiry  
✅ **bcrypt Password Hashing** - Industry standard (10 rounds)  
✅ **Time-Limited Tokens** - Automatic expiry after specified duration  
✅ **Complete Audit Logs** - Every access tracked with timestamps  
✅ **Instant Revocation** - Users control access in real-time  
✅ **HTTPS Only** - All traffic encrypted in transit (TLS 1.3)  
✅ **Rate Limiting** - Protection against brute force attacks  
✅ **CORS Protection** - Strict origin validation  
✅ **Input Validation** - Zod schema validation on all inputs  
✅ **SQL Injection Protection** - Parameterized queries only


---

## 🛠️ Technology Stack

### Backend
- **Runtime:** Node.js 20.x
- **Framework:** Express.js + TypeScript 
- **Database:** MongoDB 7.0 
- **Storage:** AWS S3 
- **Auth:** JWT + bcrypt
- **Encryption:** Node.js Crypto (AES-256-GCM)

### Frontend
- **Framework:** React 18 + TypeScript
- **Styling:** Tailwind CSS 3.4 
- **State Management:** React Query + Zustand
- **Forms:** React Hook Form + Zod validation
- **Routing:** React Router v6

### Chrome Extension
- **Manifest:** V3
- **Tech:** Vanilla JavaScript + Tailwind CSS
- **Backend:** FastAPI (Python)
- **AI:** Google Gemini Pro

### WhatsApp Bot
- **Platform:** WhatsApp Business API
- **AI:** Google Gemini Pro + LangChain
- **RAG:** Vector embeddings on NDPA 2023 PDF
- **Framework:** Node.js + Express

### AI/ML
- **Model:** Google Gemini Pro
- **Framework:** LangChain.js
- **RAG Pipeline:** Vector embeddings + similarity search
- **Web Scraping:** Playwright (headless browser)

### DevOps & Infrastructure
- **Containers:** Docker + Docker Compose
- **Hosting:** AWS EC2 (backend), Vercel (frontend)
- **Monitoring:** AWS CloudWatch



---

## 🚀 Quick Start

### For Citizens
1. Visit **[datavault-bay.vercel.app](https://datavault-bay.vercel.app/)**
2. Create your free account
3. Upload your identity documents (NIN, BVN, etc.)
4. Start controlling who accesses your data!

### For Companies
1. Register at **[datavault-bay.vercel.app/company/register](https://datavault-bay.vercel.app/company/register)**
2. Get your API credentials (client_id + secret_key)
3. Integrate OAuth flow (just 4 API calls)
4. Start verifying users instantly!

### For Developers (Local Setup)

#### Prerequisites
- Node.js 20.x or higher
- MongoDB 7.0
- AWS account (for S3)
- Git

#### Backend Setup
```bash
# Clone repository
git clone https://github.com/0x-stone/DataVault.git
cd DataVault/


# Setup environment variables
nano .env

# Start containers
docker compose up

# Backend runs on http://localhost:3000
```

#### Frontend Setup
```bash
# Navigate to frontend directory
cd DataVault/app/frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Add VITE_API_URL=http://localhost:3000

# Start development server
npm run dev

# Frontend runs on http://localhost:5173
```

#### Chrome Extension Setup
```bash
# Navigate to extension directory
cd DataVault/extension/frontend

# Open Chrome and go to chrome://extensions
# Enable "Developer Mode"
# Click "Load unpacked"
# Select the extension/frontend folder
```

#### Environment Variables
```env
# Backend (.env)
BACKEND_SERVICE_PORT=3000
MONGODB_URL=mongodb://admin:password@mongodb:27017/datavault?authSource=admin
SMTP_PASS=
SMTP_MAIL=
WHATSAPP_SERVICE_URL=http://whatsapp:6000
USER_JWT_SECRET=
JWT_EXPIRES_IN=
COMPANY_JWT_SECRET=
ENCRYPTION_KEY=
USE_S3=true
STORAGE_PATH=
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET=
MONGO_INITDB_ROOT_USERNAME= admin
MONGO_INITDB_ROOT_PASSWORD= password
MONGO_INITDB_DATABASE= datavault
GOOGLE_API_KEY=
GOOGLE_API_KEYS=[]
RAG_SERVICE_URL=http://ndpa-extension:8000
WHATSAPP_SERVICE_PORT=6000

# Frontend (.env)
VITE_API_URL=http://localhost:5000
VITE_OAUTH_REDIRECT_URI=http://localhost:5173/callback
```

---


<p align="center">
  <strong>🏆 Built for DataVerse Solutions Data Privacy Hackathon 2025 🏆</strong>
</p>

---

<p align="center">
  <strong>DataVault Nigeria - Your Data, Your Control</strong>
</p>

<p align="center">
  Making Nigeria's digital economy safer, one authorization at a time. 🇳🇬
</p>
