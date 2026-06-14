import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM ?? 'noreply@vemix.net'
const APP_URL = process.env.FRONTEND_URL ?? 'http://localhost:5174'

export async function sendWelcomeMail(to: string, name: string) {
  await resend.emails.send({
    from: `SALON <${FROM}>`,
    to,
    subject: 'Willkommen bei SALON 💇',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#111">
        <h1 style="font-size:22px;margin-bottom:8px">Hallo ${name} 👋</h1>
        <p style="color:#444;line-height:1.6">
          Schön, dass du dabei bist! Mit <strong>SALON</strong> hast du ab jetzt alles, was du für eine professionelle
          Preiskalkulation und Betriebssteuerung brauchst.
        </p>
        <p style="line-height:1.6;color:#444">
          Starte jetzt und richte deinen Salon ein — es dauert nur wenige Minuten.
        </p>
        <a href="${APP_URL}" style="display:inline-block;margin-top:16px;background:#111;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Jetzt loslegen →
        </a>
        <hr style="margin:32px 0;border:none;border-top:1px solid #eee" />
        <p style="font-size:12px;color:#999">
          SALON · by Peter Lehmann · <a href="${APP_URL}/impressum" style="color:#999">Impressum</a> · <a href="${APP_URL}/datenschutz" style="color:#999">Datenschutz</a>
        </p>
      </div>
    `,
  })
}

export async function sendPasswordResetMail(to: string, name: string, token: string) {
  const link = `${APP_URL}/reset-password?token=${token}`
  await resend.emails.send({
    from: `SALON <${FROM}>`,
    to,
    subject: 'Passwort zurücksetzen',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#111">
        <h1 style="font-size:22px;margin-bottom:8px">Passwort zurücksetzen</h1>
        <p style="color:#444;line-height:1.6">Hallo ${name},</p>
        <p style="color:#444;line-height:1.6">
          du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt.
          Klicke auf den Button, um ein neues Passwort zu vergeben. Der Link ist <strong>1 Stunde</strong> gültig.
        </p>
        <a href="${link}" style="display:inline-block;margin-top:16px;background:#111;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Passwort zurücksetzen →
        </a>
        <p style="margin-top:24px;font-size:13px;color:#999">
          Wenn du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.
        </p>
        <hr style="margin:32px 0;border:none;border-top:1px solid #eee" />
        <p style="font-size:12px;color:#999">
          SALON · by Peter Lehmann · <a href="${APP_URL}/impressum" style="color:#999">Impressum</a>
        </p>
      </div>
    `,
  })
}
