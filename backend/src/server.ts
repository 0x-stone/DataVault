import express, { Express, Response, Request, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { database, usersCollection, usersVaultCollection, tokensCollection,
initCollections,
companiesCollection, } from './config/database'

dotenv.config()

const app: Express = express()
const PORT = process.env.BACKEND_SERVICE_PORT|| 3000

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-vault-key']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'DataVault Nigeria API',
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'DataVault Nigeria API is running',
  });
});



async function startServer() {
  try {
    await database.connect()
    await initCollections()
    
    const authRoutes = (await import('./routes/userAuth.routes')).default;
    const vaultRoutes = (await import('./routes/vault.routes')).default;
    const companyRoutes = (await import('./routes/company.routes')).default;
    const authorizeRoutes = (await import('./routes/authorize.routes')).default;
    
    app.use('/api/v1/auth', authRoutes);
    app.use('/api/v1/vault', vaultRoutes);
    app.use('/api/v1/company', companyRoutes);
    app.use('/api/v1/authorize', authorizeRoutes);
    
    app.listen(PORT, () => {
      console.log(`Server runnin on ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

startServer();

export default app;