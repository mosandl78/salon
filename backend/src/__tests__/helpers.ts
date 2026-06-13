import jwt from 'jsonwebtoken'

export const JWT_SECRET = 'test-secret-key-for-testing'

export function makeToken(userId: string, extra: Record<string, unknown> = {}) {
  return jwt.sign({ userId, ...extra }, JWT_SECRET)
}

export const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  passwordHash: 'hash',
  isAdmin: false,
  isActive: true,
  plan: 'PRO',
  planExpiresAt: null,
  notes: null,
  createdAt: new Date(),
}

export const mockAdminUser = {
  ...mockUser,
  id: 'admin-1',
  email: 'admin@example.com',
  isAdmin: true,
}

export const mockSalon = {
  id: 'salon-1',
  userId: 'user-1',
  name: 'Test Salon',
  country: 'DE',
  businessType: 'SOLO',
  planStart: new Date('2026-01-01'),
  planEnd: new Date('2026-12-31'),
  fullTimeHours: 38,
  vacationWeeks: 5,
  createdAt: new Date(),
  employees: [],
  openingHours: [],
  costItems: [],
  services: [],
}
