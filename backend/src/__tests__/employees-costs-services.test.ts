import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import app from './app'
import { prisma } from '../lib/prisma'
import { makeToken, mockUser, mockSalon } from './helpers'

const prismaMock = prisma as any
const token      = makeToken('user-1')

const mockEmployee = {
  id: 'emp-1',
  salonId: 'salon-1',
  name: 'Anna',
  role: 'FRISEUR',
  grossSalary: 2000,
  weeklyHours: 38,
  activeMonths: Array(12).fill(1),
  vacationDays: 25,
  sickDays: 0,
  trainingDays: 0,
  christmasBonus: 0,
  holidayBonus: 0,
  capitalFormation: 0,
  taxFreeBonus: 0,
  createdAt: new Date(),
}

const mockCost = {
  id: 'cost-1',
  salonId: 'salon-1',
  category: 'MIETE',
  label: 'Ladenmiete',
  amounts: Array(12).fill(1000),
  createdAt: new Date(),
}

const mockService = {
  id: 'svc-1',
  salonId: 'salon-1',
  category: 'HERRENHAARSCHNITT',
  name: 'Herrenhaarschnitt',
  durationMinutes: 30,
  materialCost: 1.5,
  utilizationPct: 85,
  profitMarkup: 10,
  createdAt: new Date(),
}

// ─── Employees ───────────────────────────────────────────────────────────────

describe('Employees routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.user.findUnique.mockResolvedValue(mockUser)
  })

  describe('GET /api/salons/:salonId/employees', () => {
    it('returns employee list for salon owner', async () => {
      prismaMock.salon.findFirst.mockResolvedValue(mockSalon)
      prismaMock.employee.findMany.mockResolvedValue([mockEmployee])

      const res = await request(app)
        .get('/api/salons/salon-1/employees')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(1)
      expect(res.body[0].name).toBe('Anna')
    })

    it('returns 404 when salon not found', async () => {
      prismaMock.salon.findFirst.mockResolvedValue(null)

      const res = await request(app)
        .get('/api/salons/nonexistent/employees')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(404)
    })
  })

  describe('POST /api/salons/:salonId/employees', () => {
    it('creates an employee', async () => {
      prismaMock.salon.findFirst.mockResolvedValue(mockSalon)
      prismaMock.employee.create.mockResolvedValue(mockEmployee)

      const res = await request(app)
        .post('/api/salons/salon-1/employees')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Anna', role: 'FRISEUR', grossSalary: 2000 })

      expect(res.status).toBe(201)
      expect(res.body.name).toBe('Anna')
    })

    it('returns 400 when required fields missing', async () => {
      prismaMock.salon.findFirst.mockResolvedValue(mockSalon)

      const res = await request(app)
        .post('/api/salons/salon-1/employees')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Anna' }) // missing role and grossSalary

      expect(res.status).toBe(400)
    })

    it('returns 404 when salon not found', async () => {
      prismaMock.salon.findFirst.mockResolvedValue(null)

      const res = await request(app)
        .post('/api/salons/nonexistent/employees')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Anna', role: 'FRISEUR', grossSalary: 2000 })

      expect(res.status).toBe(404)
    })
  })

  describe('PATCH /api/salons/:salonId/employees/:id', () => {
    it('updates employee salary', async () => {
      prismaMock.salon.findFirst.mockResolvedValue(mockSalon)
      prismaMock.employee.findFirst.mockResolvedValue(mockEmployee)
      prismaMock.employee.update.mockResolvedValue({ ...mockEmployee, grossSalary: 2500 })

      const res = await request(app)
        .patch('/api/salons/salon-1/employees/emp-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ grossSalary: 2500 })

      expect(res.status).toBe(200)
      expect(res.body.grossSalary).toBe(2500)
    })

    it('returns 404 when employee not found', async () => {
      prismaMock.salon.findFirst.mockResolvedValue(mockSalon)
      prismaMock.employee.findFirst.mockResolvedValue(null)

      const res = await request(app)
        .patch('/api/salons/salon-1/employees/nonexistent')
        .set('Authorization', `Bearer ${token}`)
        .send({ grossSalary: 2500 })

      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /api/salons/:salonId/employees/:id', () => {
    it('deletes employee and returns 204', async () => {
      prismaMock.salon.findFirst.mockResolvedValue(mockSalon)
      prismaMock.employee.findFirst.mockResolvedValue(mockEmployee)
      prismaMock.employee.delete.mockResolvedValue(mockEmployee)

      const res = await request(app)
        .delete('/api/salons/salon-1/employees/emp-1')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(204)
    })

    it('returns 404 when employee not found', async () => {
      prismaMock.salon.findFirst.mockResolvedValue(mockSalon)
      prismaMock.employee.findFirst.mockResolvedValue(null)

      const res = await request(app)
        .delete('/api/salons/salon-1/employees/nonexistent')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(404)
    })
  })
})

// ─── Cost Items ───────────────────────────────────────────────────────────────

describe('Cost Items routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.user.findUnique.mockResolvedValue(mockUser)
  })

  describe('GET /api/salons/:salonId/costs', () => {
    it('returns cost list', async () => {
      prismaMock.salon.findFirst.mockResolvedValue(mockSalon)
      prismaMock.costItem.findMany.mockResolvedValue([mockCost])

      const res = await request(app)
        .get('/api/salons/salon-1/costs')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body[0].label).toBe('Ladenmiete')
    })

    it('returns 404 when salon not found', async () => {
      prismaMock.salon.findFirst.mockResolvedValue(null)
      const res = await request(app)
        .get('/api/salons/none/costs')
        .set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(404)
    })
  })

  describe('POST /api/salons/:salonId/costs', () => {
    it('creates a cost item', async () => {
      prismaMock.salon.findFirst.mockResolvedValue(mockSalon)
      prismaMock.costItem.create.mockResolvedValue(mockCost)

      const res = await request(app)
        .post('/api/salons/salon-1/costs')
        .set('Authorization', `Bearer ${token}`)
        .send({ category: 'MIETE', label: 'Ladenmiete', amounts: Array(12).fill(1000) })

      expect(res.status).toBe(201)
      expect(res.body.category).toBe('MIETE')
    })

    it('returns 400 when category or label missing', async () => {
      prismaMock.salon.findFirst.mockResolvedValue(mockSalon)

      const res = await request(app)
        .post('/api/salons/salon-1/costs')
        .set('Authorization', `Bearer ${token}`)
        .send({ label: 'Ladenmiete' }) // missing category

      expect(res.status).toBe(400)
    })
  })

  describe('PATCH /api/salons/:salonId/costs/:id', () => {
    it('updates cost amounts', async () => {
      prismaMock.salon.findFirst.mockResolvedValue(mockSalon)
      prismaMock.costItem.findFirst.mockResolvedValue(mockCost)
      prismaMock.costItem.update.mockResolvedValue({ ...mockCost, amounts: Array(12).fill(1200) })

      const res = await request(app)
        .patch('/api/salons/salon-1/costs/cost-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ amounts: Array(12).fill(1200) })

      expect(res.status).toBe(200)
    })

    it('returns 404 when cost not found', async () => {
      prismaMock.salon.findFirst.mockResolvedValue(mockSalon)
      prismaMock.costItem.findFirst.mockResolvedValue(null)

      const res = await request(app)
        .patch('/api/salons/salon-1/costs/none')
        .set('Authorization', `Bearer ${token}`)
        .send({ label: 'Updated' })

      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /api/salons/:salonId/costs/:id', () => {
    it('deletes cost and returns 204', async () => {
      prismaMock.salon.findFirst.mockResolvedValue(mockSalon)
      prismaMock.costItem.findFirst.mockResolvedValue(mockCost)
      prismaMock.costItem.delete.mockResolvedValue(mockCost)

      const res = await request(app)
        .delete('/api/salons/salon-1/costs/cost-1')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(204)
    })
  })
})

// ─── Services ────────────────────────────────────────────────────────────────

describe('Services routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.user.findUnique.mockResolvedValue(mockUser)
  })

  describe('POST /api/salons/:salonId/services', () => {
    it('creates a service', async () => {
      prismaMock.salon.findFirst.mockResolvedValue(mockSalon)
      prismaMock.service.create.mockResolvedValue(mockService)

      const res = await request(app)
        .post('/api/salons/salon-1/services')
        .set('Authorization', `Bearer ${token}`)
        .send({ category: 'HERRENHAARSCHNITT', name: 'Herrenhaarschnitt', durationMinutes: 30 })

      expect(res.status).toBe(201)
      expect(res.body.name).toBe('Herrenhaarschnitt')
    })

    it('returns 400 when required fields missing', async () => {
      prismaMock.salon.findFirst.mockResolvedValue(mockSalon)

      const res = await request(app)
        .post('/api/salons/salon-1/services')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Haarschnitt' }) // missing category and durationMinutes

      expect(res.status).toBe(400)
    })

    it('returns 404 when salon not found', async () => {
      prismaMock.salon.findFirst.mockResolvedValue(null)

      const res = await request(app)
        .post('/api/salons/none/services')
        .set('Authorization', `Bearer ${token}`)
        .send({ category: 'HERRENHAARSCHNITT', name: 'Haarschnitt', durationMinutes: 30 })

      expect(res.status).toBe(404)
    })
  })

  describe('PATCH /api/salons/:salonId/services/:id', () => {
    it('updates service name', async () => {
      prismaMock.salon.findFirst.mockResolvedValue(mockSalon)
      prismaMock.service.findFirst.mockResolvedValue(mockService)
      prismaMock.service.update.mockResolvedValue({ ...mockService, name: 'Updated Name' })

      const res = await request(app)
        .patch('/api/salons/salon-1/services/svc-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' })

      expect(res.status).toBe(200)
    })

    it('returns 404 when service not found', async () => {
      prismaMock.salon.findFirst.mockResolvedValue(mockSalon)
      prismaMock.service.findFirst.mockResolvedValue(null)

      const res = await request(app)
        .patch('/api/salons/salon-1/services/none')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated' })

      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /api/salons/:salonId/services/:id', () => {
    it('deletes service and returns 204', async () => {
      prismaMock.salon.findFirst.mockResolvedValue(mockSalon)
      prismaMock.service.findFirst.mockResolvedValue(mockService)
      prismaMock.service.delete.mockResolvedValue(mockService)

      const res = await request(app)
        .delete('/api/salons/salon-1/services/svc-1')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(204)
    })

    it('returns 404 when service not found', async () => {
      prismaMock.salon.findFirst.mockResolvedValue(mockSalon)
      prismaMock.service.findFirst.mockResolvedValue(null)

      const res = await request(app)
        .delete('/api/salons/salon-1/services/none')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(404)
    })
  })
})

// ─── Actuals ─────────────────────────────────────────────────────────────────

describe('Actuals routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.user.findUnique.mockResolvedValue(mockUser)
  })

  const mockActual = {
    id: 'actual-1',
    salonId: 'salon-1',
    employeeId: 'emp-1',
    month: 5,
    year: 2026,
    actual: 6500,
  }

  describe('GET /api/salons/:salonId/actuals', () => {
    it('returns actuals for current year by default', async () => {
      prismaMock.salon.findFirst.mockResolvedValue(mockSalon)
      prismaMock.actualRevenue.findMany.mockResolvedValue([mockActual])

      const res = await request(app)
        .get('/api/salons/salon-1/actuals')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(1)
    })

    it('accepts year query param', async () => {
      prismaMock.salon.findFirst.mockResolvedValue(mockSalon)
      prismaMock.actualRevenue.findMany.mockResolvedValue([mockActual])

      const res = await request(app)
        .get('/api/salons/salon-1/actuals?year=2026')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
    })

    it('returns 404 when salon not found', async () => {
      prismaMock.salon.findFirst.mockResolvedValue(null)
      const res = await request(app)
        .get('/api/salons/none/actuals')
        .set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(404)
    })
  })

  describe('PUT /api/salons/:salonId/actuals', () => {
    it('upserts an actual revenue entry', async () => {
      prismaMock.salon.findFirst.mockResolvedValue(mockSalon)
      prismaMock.actualRevenue.upsert.mockResolvedValue(mockActual)

      const res = await request(app)
        .put('/api/salons/salon-1/actuals')
        .set('Authorization', `Bearer ${token}`)
        .send({ employeeId: 'emp-1', month: 5, year: 2026, actual: 6500 })

      expect(res.status).toBe(200)
      expect(res.body.actual).toBe(6500)
    })

    it('returns 400 when required fields missing', async () => {
      prismaMock.salon.findFirst.mockResolvedValue(mockSalon)

      const res = await request(app)
        .put('/api/salons/salon-1/actuals')
        .set('Authorization', `Bearer ${token}`)
        .send({ actual: 6500 }) // missing employeeId, month, year

      expect(res.status).toBe(400)
    })

    it('returns 404 when salon not found', async () => {
      prismaMock.salon.findFirst.mockResolvedValue(null)

      const res = await request(app)
        .put('/api/salons/none/actuals')
        .set('Authorization', `Bearer ${token}`)
        .send({ employeeId: 'emp-1', month: 5, year: 2026, actual: 6500 })

      expect(res.status).toBe(404)
    })
  })
})
