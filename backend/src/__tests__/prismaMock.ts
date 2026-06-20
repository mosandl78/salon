/**
 * Zentraler Prisma-Mock für alle Backend-Tests.
 *
 * Warum vi.hoisted?  vi.hoisted() läuft VOR dem Hoisting von vi.mock(), sodass
 * die Mock-Instanzen sowohl in der vi.mock-Factory als auch im Testcode dieselben
 * vi.fn()-Objekte referenzieren. Ohne hoisted besteht das Risiko, dass Factory und
 * Test unterschiedliche vi.fn()-Instanzen bekommen.
 *
 * Verwendung in jedem Test-File:
 *   import { prismaMock, setupPrismaMock } from './prismaMock'
 *   setupPrismaMock()   // ruft vi.mock + vi.hoisted intern auf
 */
import { vi } from 'vitest'

export const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique:  vi.fn(),
    findMany:    vi.fn(),
    create:      vi.fn(),
    update:      vi.fn(),
    delete:      vi.fn(),
    count:       vi.fn(),
    groupBy:     vi.fn(),
  },
  salon: {
    findFirst:   vi.fn(),
    findMany:    vi.fn(),
    create:      vi.fn(),
    update:      vi.fn(),
    delete:      vi.fn(),
    count:       vi.fn(),
  },
  employee: {
    findMany:    vi.fn(),
    findFirst:   vi.fn(),
    create:      vi.fn(),
    update:      vi.fn(),
    delete:      vi.fn(),
    count:       vi.fn(),
  },
  costItem: {
    findMany:    vi.fn(),
    findFirst:   vi.fn(),
    create:      vi.fn(),
    update:      vi.fn(),
    delete:      vi.fn(),
    createMany:  vi.fn(),
  },
  service: {
    findMany:    vi.fn(),
    findFirst:   vi.fn(),
    create:      vi.fn(),
    update:      vi.fn(),
    delete:      vi.fn(),
    count:       vi.fn(),
    createMany:  vi.fn(),
  },
  openingHours: {
    findMany:    vi.fn(),
    createMany:  vi.fn(),
    deleteMany:  vi.fn(),
    upsert:      vi.fn(),
  },
  actualRevenue: {
    findMany:    vi.fn(),
    upsert:      vi.fn(),
    createMany:  vi.fn(),
  },
}))

vi.mock('../lib/prisma', () => ({ prisma: prismaMock }))
