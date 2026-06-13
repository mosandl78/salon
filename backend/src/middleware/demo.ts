import { Response, NextFunction } from 'express'

// Blockiert alle schreibenden Methoden (POST/PATCH/PUT/DELETE) für Demo-User
export function requireNotDemo(req: any, res: Response, next: NextFunction) {
  if (req.user?.isDemo && req.method !== 'GET') {
    return res.status(403).json({ error: 'Im Demo-Modus sind keine Änderungen möglich' })
  }
  next()
}
