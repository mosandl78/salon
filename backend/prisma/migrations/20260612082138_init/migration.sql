-- CreateEnum
CREATE TYPE "Country" AS ENUM ('DE', 'AT', 'CH');

-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('SOLO', 'GBR', 'GMBH');

-- CreateEnum
CREATE TYPE "EmployeeRole" AS ENUM ('FRISEUR', 'ORGA', 'AZUBI', 'CHEF');

-- CreateEnum
CREATE TYPE "CostCategory" AS ENUM ('MIETE', 'NEBENKOSTEN', 'STROM', 'WASSER', 'TELEFON', 'INTERNET', 'VERSICHERUNG', 'STEUERBERATUNG', 'BANKGEBUEHREN', 'LEASING', 'REPARATUREN', 'WERBUNG', 'WEITERBILDUNG', 'SONSTIGE', 'ZINSEN', 'TILGUNG', 'WARENEINSATZ', 'UNTERNEHMERLOHN');

-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('WASCHEN_SCHNEIDEN_FOENEN', 'HERRENHAARSCHNITT', 'FARBE', 'STRAEHNEN', 'BALAYAGE', 'VERLAENGERUNG', 'CUSTOM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Salon" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" "Country" NOT NULL DEFAULT 'DE',
    "businessType" "BusinessType" NOT NULL DEFAULT 'SOLO',
    "planStart" TIMESTAMP(3) NOT NULL,
    "planEnd" TIMESTAMP(3) NOT NULL,
    "fullTimeHours" DOUBLE PRECISION NOT NULL DEFAULT 38,
    "vacationWeeks" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Salon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpeningHours" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "openHours" DOUBLE PRECISION NOT NULL,
    "variant" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "OpeningHours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "EmployeeRole" NOT NULL,
    "grossSalary" DOUBLE PRECISION NOT NULL,
    "weeklyHours" DOUBLE PRECISION NOT NULL DEFAULT 38,
    "activeMonths" DOUBLE PRECISION[],
    "vacationDays" INTEGER NOT NULL DEFAULT 0,
    "sickDays" INTEGER NOT NULL DEFAULT 0,
    "trainingDays" INTEGER NOT NULL DEFAULT 0,
    "christmasBonus" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "holidayBonus" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "capitalFormation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxFreeBonus" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostItem" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "category" "CostCategory" NOT NULL,
    "label" TEXT NOT NULL,
    "amounts" DOUBLE PRECISION[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "category" "ServiceCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "durationMinutes" DOUBLE PRECISION NOT NULL,
    "materialCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "utilizationPct" DOUBLE PRECISION NOT NULL DEFAULT 80,
    "profitMarkup" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActualRevenue" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "actual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActualRevenue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ActualRevenue_employeeId_month_year_key" ON "ActualRevenue"("employeeId", "month", "year");

-- AddForeignKey
ALTER TABLE "Salon" ADD CONSTRAINT "Salon_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpeningHours" ADD CONSTRAINT "OpeningHours_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostItem" ADD CONSTRAINT "CostItem_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActualRevenue" ADD CONSTRAINT "ActualRevenue_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActualRevenue" ADD CONSTRAINT "ActualRevenue_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
