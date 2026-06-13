import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import app from './app'
import { prisma } from '../lib/prisma'

const prismaMock = prisma as any

const demoUser = {
  id: 'demo-user',
  email: 'demo@salon-app.de',
  name: 'Demo',
  isAdmin: false,
  plan: 'PRO',
  isActive: true,
}

const demoSalon = {
  id: 'demo-salon',
  userId: 'demo-user',
  name: 'Haarsalon Müller',
  country: 'DE',
  vacationWeeks: 4,
  employees: [],
  openingHours: [],
  costItems: [],
  services: [],
}

describe('GET /api/demo', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns salon and token for existing demo user', async () => {
    prismaMock.user.findUnique.mockResolvedValue(demoUser)
    prismaMock.salon.findFirst.mockResolvedValue(demoSalon)

    const res = await request(app).get('/api/demo')

    expect(res.status).toBe(200)
    expect(res.body.salon).toBeDefined()
    expect(res.body.token).toBeDefined()
    expect(res.body.salon.name).toBe('Haarsalon Müller')
  })

  it('creates demo user if not exists', async () => {
    // First call returns null (no existing user), then returns created user
    prismaMock.user.findUnique.mockResolvedValueOnce(null)
    prismaMock.user.create.mockResolvedValue(demoUser)
    prismaMock.salon.create.mockResolvedValue(demoSalon)
    prismaMock.openingHours.createMany.mockResolvedValue({})
    prismaMock.employee.create.mockResolvedValue({ id: 'emp-1', salonId: 'demo-salon' })
    prismaMock.costItem.createMany.mockResolvedValue({})
    prismaMock.service.createMany.mockResolvedValue({})
    prismaMock.actualRevenue.createMany.mockResolvedValue({})
    prismaMock.salon.findFirst.mockResolvedValue(demoSalon)

    const res = await request(app).get('/api/demo')

    expect(res.status).toBe(200)
    expect(prismaMock.user.create).toHaveBeenCalledOnce()
  })

  it('returns 404 when demo salon is not found after seeding', async () => {
    prismaMock.user.findUnique.mockResolvedValue(demoUser)
    prismaMock.salon.findFirst.mockResolvedValue(null)

    const res = await request(app).get('/api/demo')

    expect(res.status).toBe(404)
  })

  it('demo token is a valid JWT', async () => {
    prismaMock.user.findUnique.mockResolvedValue(demoUser)
    prismaMock.salon.findFirst.mockResolvedValue(demoSalon)

    const res = await request(app).get('/api/demo')

    const jwt = await import('jsonwebtoken')
    const payload = jwt.default.verify(res.body.token, 'test-secret-key-for-testing') as any
    expect(payload.userId).toBe('demo-user')
    expect(payload.isDemo).toBe(true)
  })
})
