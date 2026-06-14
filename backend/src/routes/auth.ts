import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { prisma } from '../lib/prisma'
import { sendWelcomeMail, sendPasswordResetMail } from '../lib/email'

export const authRouter = Router()

authRouter.post('/register', async (req: Request, res: Response) => {
  const { email, password, name } = req.body
  if (!email || !password || !name) return res.status(400).json({ error: 'Alle Felder sind Pflichtfelder' })

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return res.status(409).json({ error: 'E-Mail bereits vergeben' })

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({ data: { email, passwordHash, name } })
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '30d' })

  // Welcome-Mail — fire & forget
  sendWelcomeMail(email, name).catch(err => console.error('Welcome mail error:', err))

  res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin, plan: user.plan } })
})

authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'E-Mail und Passwort erforderlich' })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(401).json({ error: 'Ungültige Anmeldedaten' })

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return res.status(401).json({ error: 'Ungültige Anmeldedaten' })

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '30d' })
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin, plan: user.plan } })
})

authRouter.get('/me', async (req: any, res: Response) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Nicht authentifiziert' })
  try {
    const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET!) as { userId: string }
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { id: true, email: true, name: true, isAdmin: true, plan: true } })
    if (!user) return res.status(404).json({ error: 'Nicht gefunden' })
    res.json(user)
  } catch {
    res.status(401).json({ error: 'Ungültiger Token' })
  }
})

// POST /api/auth/forgot-password
authRouter.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'E-Mail erforderlich' })

  const user = await prisma.user.findUnique({ where: { email } })
  // Immer 200 zurückgeben — kein Hinweis ob User existiert
  if (!user) return res.json({ ok: true })

  const token = crypto.randomBytes(32).toString('hex')
  const expiry = new Date(Date.now() + 60 * 60 * 1000) // 1 Stunde

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: token, resetTokenExpiry: expiry },
  })

  sendPasswordResetMail(email, user.name, token).catch(err => console.error('Reset mail error:', err))

  res.json({ ok: true })
})

// POST /api/auth/reset-password
authRouter.post('/reset-password', async (req: Request, res: Response) => {
  const { token, password } = req.body
  if (!token || !password) return res.status(400).json({ error: 'Token und Passwort erforderlich' })

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date() },
    },
  })

  if (!user) return res.status(400).json({ error: 'Ungültiger oder abgelaufener Link' })

  const passwordHash = await bcrypt.hash(password, 10)
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpiry: null },
  })

  res.json({ ok: true })
})
