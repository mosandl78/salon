import { Response, NextFunction } from 'express'

export function requireAdmin(req: any, res: Response, next: NextFunction) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Kein Zugriff — Admin erforderlich' })
  }
  next()
}
