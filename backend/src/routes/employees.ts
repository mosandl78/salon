import { Router, Response } from 'express'
import { authenticate } from '../middleware/auth'
import { prisma } from '../lib/prisma'

export const employeesRouter = Router()

async function getSalon(salonId: string, userId: string) {
  return prisma.salon.findFirst({ where: { id: salonId, userId } })
}

employeesRouter.get('/:salonId/employees', authenticate, async (req: any, res: Response) => {
  const salon = await getSalon(req.params.salonId, req.user.id)
  if (!salon) return res.status(404).json({ error: 'Salon nicht gefunden' })

  const employees = await prisma.employee.findMany({
    where: { salonId: salon.id },
    orderBy: { createdAt: 'asc' },
  })
  res.json(employees)
})

employeesRouter.post('/:salonId/employees', authenticate, async (req: any, res: Response) => {
  const salon = await getSalon(req.params.salonId, req.user.id)
  if (!salon) return res.status(404).json({ error: 'Salon nicht gefunden' })

  const { name, role, grossSalary, weeklyHours, activeMonths, vacationDays, sickDays,
          trainingDays, christmasBonus, holidayBonus, capitalFormation, taxFreeBonus } = req.body
  if (!name || !role || !grossSalary) return res.status(400).json({ error: 'Name, Rolle und Gehalt sind Pflichtfelder' })

  const employee = await prisma.employee.create({
    data: {
      salonId: salon.id,
      name,
      role,
      grossSalary: parseFloat(grossSalary),
      weeklyHours: weeklyHours ? parseFloat(weeklyHours) : salon.fullTimeHours,
      activeMonths: activeMonths ?? Array(12).fill(1),
      vacationDays: vacationDays ? parseInt(vacationDays) : 0,
      sickDays: sickDays ? parseInt(sickDays) : 0,
      trainingDays: trainingDays ? parseInt(trainingDays) : 0,
      christmasBonus: christmasBonus ? parseFloat(christmasBonus) : 0,
      holidayBonus: holidayBonus ? parseFloat(holidayBonus) : 0,
      capitalFormation: capitalFormation ? parseFloat(capitalFormation) : 0,
      taxFreeBonus: taxFreeBonus ? parseFloat(taxFreeBonus) : 0,
    },
  })
  res.status(201).json(employee)
})

employeesRouter.patch('/:salonId/employees/:id', authenticate, async (req: any, res: Response) => {
  const salon = await getSalon(req.params.salonId, req.user.id)
  if (!salon) return res.status(404).json({ error: 'Salon nicht gefunden' })

  const existing = await prisma.employee.findFirst({ where: { id: req.params.id, salonId: salon.id } })
  if (!existing) return res.status(404).json({ error: 'Mitarbeiter nicht gefunden' })

  const { name, role, grossSalary, weeklyHours, activeMonths, vacationDays, sickDays,
          trainingDays, christmasBonus, holidayBonus, capitalFormation, taxFreeBonus } = req.body

  const employee = await prisma.employee.update({
    where: { id: existing.id },
    data: {
      ...(name ? { name } : {}),
      ...(role ? { role } : {}),
      ...(grossSalary != null ? { grossSalary: parseFloat(grossSalary) } : {}),
      ...(weeklyHours != null ? { weeklyHours: parseFloat(weeklyHours) } : {}),
      ...(activeMonths ? { activeMonths } : {}),
      ...(vacationDays != null ? { vacationDays: parseInt(vacationDays) } : {}),
      ...(sickDays != null ? { sickDays: parseInt(sickDays) } : {}),
      ...(trainingDays != null ? { trainingDays: parseInt(trainingDays) } : {}),
      ...(christmasBonus != null ? { christmasBonus: parseFloat(christmasBonus) } : {}),
      ...(holidayBonus != null ? { holidayBonus: parseFloat(holidayBonus) } : {}),
      ...(capitalFormation != null ? { capitalFormation: parseFloat(capitalFormation) } : {}),
      ...(taxFreeBonus != null ? { taxFreeBonus: parseFloat(taxFreeBonus) } : {}),
    },
  })
  res.json(employee)
})

employeesRouter.delete('/:salonId/employees/:id', authenticate, async (req: any, res: Response) => {
  const salon = await getSalon(req.params.salonId, req.user.id)
  if (!salon) return res.status(404).json({ error: 'Salon nicht gefunden' })

  const existing = await prisma.employee.findFirst({ where: { id: req.params.id, salonId: salon.id } })
  if (!existing) return res.status(404).json({ error: 'Mitarbeiter nicht gefunden' })

  await prisma.employee.delete({ where: { id: existing.id } })
  res.status(204).end()
})
