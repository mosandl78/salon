import { vi } from 'vitest'

export const prisma = {
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
}
