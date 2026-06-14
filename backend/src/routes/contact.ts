import { Router, Request, Response } from 'express'
import { sendContactMail } from '../lib/email'

export const contactRouter = Router()

contactRouter.post('/', async (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Alle Felder sind Pflichtfelder' })
  }
  if (message.length > 5000) {
    return res.status(400).json({ error: 'Nachricht zu lang' })
  }

  try {
    await sendContactMail(name, email, subject, message)
    res.json({ ok: true })
  } catch (err) {
    console.error('Contact mail error:', err)
    res.status(500).json({ error: 'E-Mail konnte nicht gesendet werden' })
  }
})
