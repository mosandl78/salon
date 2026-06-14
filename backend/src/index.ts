import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { authRouter }         from './routes/auth'
import { salonRouter }        from './routes/salon'
import { employeesRouter }    from './routes/employees'
import { costsRouter }        from './routes/costs'
import { servicesRouter }     from './routes/services'
import { actualsRouter }      from './routes/actuals'
import { openingHoursRouter } from './routes/opening-hours'
import { calculationRouter }  from './routes/calculation'
import { adminRouter }        from './routes/admin'
import { demoRouter }         from './routes/demo'
import { contactRouter }      from './routes/contact'
import { requireNotDemo }     from './middleware/demo'

const app  = express()
const PORT = process.env.PORT || 4000

app.use(helmet())
const allowedOrigins = [
  'http://localhost:5174',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[]
app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(morgan('dev'))
app.use(express.json())

app.use('/api/auth',   authRouter)
// Alle /api/salons-Mutations werden für Demo-User blockiert
app.use('/api/salons', requireNotDemo)
app.use('/api/salons', salonRouter)
app.use('/api/salons', employeesRouter)
app.use('/api/salons', costsRouter)
app.use('/api/salons', servicesRouter)
app.use('/api/salons', actualsRouter)
app.use('/api/salons', openingHoursRouter)
app.use('/api/salons', calculationRouter)
app.use('/api/admin',   adminRouter)
app.use('/api/demo',    demoRouter)
app.use('/api/contact', contactRouter)

app.get('/api/health', (_, res) => res.json({ ok: true, service: 'salon-api' }))

app.listen(PORT, () => console.log(`🪒 Salon API läuft auf Port ${PORT}`))
