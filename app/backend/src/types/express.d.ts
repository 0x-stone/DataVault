import { UserJWTPayload, CompanyJWTPayload } from "./auth";
import { File } from 'multer';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
      company: CompanyJWTPayload
      file?: File;
      files?: File[];
    }
  }
}