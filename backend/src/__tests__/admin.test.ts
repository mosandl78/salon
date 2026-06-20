import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../lib/prisma', async () => await import('../lib/__mocks__/prisma'))

import request from 'supertest'
import app from './app'
import { prisma } from '../lib/prisma'
import { makeToken, mockUser, mockAdminUser } from './helpers'

const prismaMock = prisma as any

describe('Admin routes', () => {
  const userToken  = makeToken('user-1')
  const adminToken = makeToken('admin-1')

  beforeEach(() => vi.clearAllMocks())

  it('returns 401 for unauthenticated requests', async () => {
    const res = await request(app).get('/api/admin/stats')
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-admin users', async () => {
    prismaMock.user.findUnique.mockResolvedValue(mockUser) // isAdmin: false

    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${userToken}`)

    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/Admin/)
  })

  it('GET /api/admin/stats returns stats for admin', async () => {
    prismaMock.user.findUnique.mockResolvedValue(mockAdminUser)
    prismaMock.user.count.mockResolvedValue(10)
    prismaMock.salon.count.mockResolvedValue(5)
    prismaMock.employee.count.mockResolvedValue(20)
    prismaMock.service.count.mockResolvedValue(30)
    prismaMock.user.groupBy.mockResolvedValue([
      { plan: 'FREE', _count: { plan: 3 } },
      { plan: 'PRO', _count: { plan: 7 } },
    ])

    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.body.totalUsers).toBeDefined()
    expect(res.body.totalSalons).toBeDefined()
    expect(res.body.planCounts).toBeDefined()
  })

  it('GET /api/admin/users returns user list for admin', async () => {
    prismaMock.user.findUnique.mockResolvedValue(mockAdminUser)
    prismaMock.user.findMany.mockResolvedValue([
      { ...mockAdminUser, _count: { salons: 1 } },
    ])

    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('PATCH /api/admin/users/:id updates user', async () => {
    prismaMock.user.findUnique.mockResolvedValue(mockAdminUser)
    prismaMock.user.update.mockResolvedValue({ ...mockUser, plan: 'PRO' })

    const res = await request(app)
      .patch('/api/admin/users/user-1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ plan: 'PRO' })

    expect(res.status).toBe(200)
  })

  it('admin cannot demote themselves', async () => {
    prismaMock.user.findUnique.mockResolvedValue(mockAdminUser)

    const res = await request(app)
      .patch('/api/admin/users/admin-1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isAdmin: false })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/selbst/)
  })

  it('DELETE /api/admin/users/:id deletes a user', async () => {
    prismaMock.user.findUnique.mockResolvedValue(mockAdminUser)
    prismaMock.user.delete.mockResolvedValue(mockUser)

    const res = await request(app)
      .delete('/api/admin/users/user-1')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(204)
  })

  it('admin cannot delete own account', async () => {
    prismaMock.user.findUnique.mockResolvedValue(mockAdminUser)

    const res = await request(app)
      .delete('/api/admin/users/admin-1')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(400)
  })
})
