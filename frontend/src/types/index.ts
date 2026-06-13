export type PricingPlan  = 'FREE' | 'STARTER' | 'PRO' | 'STUDIO'

export type Country      = 'DE' | 'AT' | 'CH'
export type BusinessType = 'SOLO' | 'GBR' | 'GMBH'
export type EmployeeRole = 'FRISEUR' | 'ORGA' | 'AZUBI' | 'CHEF'
export type CostCategory =
  | 'MIETE' | 'NEBENKOSTEN' | 'STROM' | 'WASSER' | 'TELEFON' | 'INTERNET'
  | 'VERSICHERUNG' | 'STEUERBERATUNG' | 'BANKGEBUEHREN' | 'LEASING'
  | 'REPARATUREN' | 'WERBUNG' | 'WEITERBILDUNG' | 'SONSTIGE'
  | 'ZINSEN' | 'TILGUNG' | 'WARENEINSATZ' | 'UNTERNEHMERLOHN'
export type ServiceCategory =
  | 'WASCHEN_SCHNEIDEN_FOENEN' | 'HERRENHAARSCHNITT' | 'FARBE'
  | 'STRAEHNEN' | 'BALAYAGE' | 'VERLAENGERUNG' | 'CUSTOM'

export interface User {
  id: string
  email: string
  name: string
  isAdmin: boolean
  plan: PricingPlan
}

export interface AdminUser {
  id: string
  name: string
  email: string
  isAdmin: boolean
  isActive: boolean
  isDemo: boolean
  plan: PricingPlan
  planExpiresAt: string | null
  notes: string | null
  createdAt: string
  salonCount: number
}

export interface AdminStats {
  totalUsers: number
  totalSalons: number
  totalEmployees: number
  totalServices: number
  activeUsers: number
  planCounts: Record<PricingPlan, number>
  newUsersThisMonth: number
  newSalonsThisMonth: number
}

export interface Salon {
  id: string
  userId: string
  name: string
  country: Country
  businessType: BusinessType
  planStart: string
  planEnd: string
  fullTimeHours: number
  vacationWeeks: number
  createdAt: string
  updatedAt: string
  employees?: Employee[]
  costItems?: CostItem[]
  services?: Service[]
}

export interface Employee {
  id: string
  salonId: string
  name: string
  role: EmployeeRole
  grossSalary: number
  weeklyHours: number
  activeMonths: number[]
  vacationDays: number
  sickDays: number
  trainingDays: number
  christmasBonus: number
  holidayBonus: number
  capitalFormation: number
  taxFreeBonus: number
  createdAt: string
}

export interface CostItem {
  id: string
  salonId: string
  category: CostCategory
  label: string
  amounts: number[]
  createdAt: string
}

export interface Service {
  id: string
  salonId: string
  category: ServiceCategory
  name: string
  durationMinutes: number
  materialCost: number
  utilizationPct: number
  profitMarkup: number
  createdAt: string
}

export interface ActualRevenue {
  id: string
  salonId: string
  employeeId: string
  month: number
  year: number
  actual: number
}

export interface SollUmsatzEntry {
  id: string
  name: string
  sollMonat: number
  sollTag: number
  sollStunde: number
  activeMonths: number
}

export interface ServicePrice {
  id: string
  name: string
  category: ServiceCategory
  selbstkosten: number
  nettopreis: number
  bruttopreis: number
}

export interface CalculationResult {
  country: Country
  employerRate: number
  vatRate: number
  workDaysPerYear: number
  workHoursPerDay: number
  totalPersonalkosten: number
  totalGemeinkosten: number
  unternehmerlohn: number
  wareneinsatzRate: number
  fixedCosts: number
  mindestumsatzNet: number
  bruttolohnsumme: number
  lohnfaktor: number
  pkProMinute: number
  gkProMinute: number
  sollUmsatzPerEmployee: SollUmsatzEntry[]
  servicePrices: ServicePrice[]
}
