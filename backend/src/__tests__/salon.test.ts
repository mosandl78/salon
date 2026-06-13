import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import app from './app'
import { prisma } from '../lib/prisma'
import { makeToken, mockUser, mockSalon } from './helpers'

const prismaMock = prisma as any

describe('Salon routes', () => {
  const token = makeToken('user-1')

  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.user.findUnique.mockResolvedValue(mockUser)
  })

  describe('GET /api/salons', () => {
    it('returns list of salons for authenticated user', async () => {
      prismaMock.salon.findMany.mockResolvedValue([mockSalon])

      const res = await request(app)
        .get('/api/salons')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(1)
      expect(res.body[0].name).toBe('Test Salon')
    })

    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/salons')
      expect(res.status).toBe(401)
    })
  })

  describe('POST /api/salons', () => {
    it('creates a new salon', async () => {
      prismaMock.salon.create.mockResolvedValue(mockSalon)

      const res = await request(app)
        .post('/api/salons')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Salon', planStart: '2026-01-01', planEnd: '2026-12-31' })

      expect(res.status).toBe(201)
      expect(res.body.name).toBe('Test Salon')
    })

    it('returns 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/salons')
        .set('Authorization', `Bearer ${token}`)
        .send({ planStart: '2026-01-01', planEnd: '2026-12-31' })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/salons/:id', () => {
    it('returns salon by id for owner', async () => {
      prismaMock.salon.findFirst.mockResolvedValue(mockSalon)

      const res = await request(app)
        .get('/api/salons/salon-1')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.id).toBe('salon-1')
    })

    it('returns 404 when salon not found or wrong user', async () => {
      prismaMock.salon.findFirst.mockResolvedValue(null)

      const res = await request(app)
        .get('/api/salons/nonexistent')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(404)
    })
  })

  describe('PATCH /api/salons/:id', () => {
    it('updates salon name', async () => {
      prismaMock.salon.findFirst.mockResolvedValue(mockSalon)
      prismaMock.salon.update.mockResolvedValue({ ...mockSalon, name: 'Updated Salon' })

      const res = await request(app)
        .patch('/api/salons/salon-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Salon' })

      expect(res.status).toBe(200)
      expect(res.body.name).toBe('Updated Salon')
    })

    it('returns 404 when salon not found', async () => {
      prismaMock.salon.findFirst.mockResolvedValue(null)

      const res = await request(app)
        .patch('/api/salons/nonexistent')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated' })

      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /api/salons/:id', () => {
    it('deletes salon and returns 204', async () => {
      prismaMock.salon.findFirst.mockResolvedValue(mockSalon)
      prismaMock.salon.delete.mockResolvedValue(mockSalon)

      const res = await request(app)
        .delete('/api/salons/salon-1')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(204)
    })

    it('returns 403 when trying to delete another user\'s salon', async () => {
      prismaMock.salon.findFirst.mockResolvedValue(null)

      const res = await request(app)
        .delete('/api/salons/salon-other')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(404)
    })
  })
})
