import express from 'express'
import { authRouter }         from '../routes/auth'
import { salonRouter }        from '../routes/salon'
import { employeesRouter }    from '../routes/employees'
import { costsRouter }        from '../routes/costs'
import { servicesRouter }     from '../routes/services'
import { actualsRouter }      from '../routes/actuals'
import { calculationRouter }  from '../routes/calculation'
import { adminRouter }        from '../routes/admin'
import { demoRouter }         from '../routes/demo'

const app = express()
app.use(express.json())

app.use('/api/auth',   authRouter)
app.use('/api/salons', salonRouter)
app.use('/api/salons', employeesRouter)
app.use('/api/salons', costsRouter)
app.use('/api/salons', servicesRouter)
app.use('/api/salons', actualsRouter)
app.use('/api/salons', calculationRouter)
app.use('/api/admin',  adminRouter)
app.use('/api/demo',   demoRouter)

app.get('/api/health', (_, res) => res.json({ ok: true }))

export default app
