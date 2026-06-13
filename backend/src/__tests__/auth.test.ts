import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import app from './app'
import { prisma } from '../lib/prisma'

const prismaMock = prisma as any

describe('POST /api/auth/register', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a new user and returns token', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)
    prismaMock.user.create.mockResolvedValue({
      id: 'user-1', email: 'test@example.com', name: 'Test User',
      isAdmin: false, plan: 'FREE',
    })

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123', name: 'Test User' })

    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe('test@example.com')
    expect(res.body.user.name).toBe('Test User')
  })

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com' })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/Pflichtfelder/)
  })

  it('returns 409 when email already exists', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'existing', email: 'taken@example.com' })

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'taken@example.com', password: 'password123', name: 'Someone' })

    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/bereits vergeben/)
  })
})

describe('POST /api/auth/login', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns token on valid credentials', async () => {
    const hash = await bcrypt.hash('correctpassword', 10)
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1', email: 'user@example.com', name: 'User',
      passwordHash: hash, isAdmin: false, plan: 'FREE',
    })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'correctpassword' })

    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe('user@example.com')
  })

  it('returns 401 when password is wrong', async () => {
    const hash = await bcrypt.hash('correctpassword', 10)
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1', email: 'user@example.com', passwordHash: hash,
    })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'wrongpassword' })

    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/Ungültige/)
  })

  it('returns 401 when user does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'any' })

    expect(res.status).toBe(401)
  })

  it('returns 400 when fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com' })

    expect(res.status).toBe(400)
  })
})

describe('GET /api/auth/me', () => {
  it('returns user data with valid token', async () => {
    const token = jwt.sign({ userId: 'user-1' }, 'test-secret-key-for-testing')
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1', email: 'me@example.com', name: 'Me', isAdmin: false, plan: 'FREE',
    })

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.email).toBe('me@example.com')
  })

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken')

    expect(res.status).toBe(401)
  })
})
