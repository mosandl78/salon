import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'

export async function authenticate(req: any, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Nicht authentifiziert' })
  }
  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; isDemo?: boolean }
    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user) return res.status(401).json({ error: 'Benutzer nicht gefunden' })
    if (!user.isActive) return res.status(403).json({ error: 'Konto deaktiviert' })
    // isDemo kommt aus DB-Feld oder JWT-Payload (Demo-Token aus /api/demo)
    req.user = { ...user, isDemo: user.isDemo || payload.isDemo || false }
    next()
  } catch {
    return res.status(401).json({ error: 'Ungültiger Token' })
  }
}
