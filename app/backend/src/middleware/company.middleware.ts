import { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services/auth.service'


export const authenticateCompany = (
  req: Request,
  res: Response, 
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Access token required'
    })
    return
  }
  const payload = AuthService.verifyCompanyToken(token)
  if (!payload) {
    res.status(403).json({
      success: false,
      error: 'Invalid or expired token'
    })
    return
  }

  req.company = {
    companyId: payload.companyId,
  }

  next()
}