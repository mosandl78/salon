# SALON — Technische Dokumentation

> Vollständige Entwicklerdokumentation für das SALON SaaS-Projekt.  
> Zielgruppe: Entwickler, die das Projekt neu aufsetzen, erweitern oder debuggen wollen.

---

## Inhaltsverzeichnis

1. [Projektübersicht](#1-projektübersicht)
2. [Tech Stack](#2-tech-stack)
3. [Projektstruktur](#3-projektstruktur)
4. [Architektur](#4-architektur)
5. [Datenbank](#5-datenbank)
6. [API-Referenz](#6-api-referenz)
7. [Business-Logik & Kalkulationsformeln](#7-business-logik--kalkulationsformeln)
8. [Frontend-Architektur](#8-frontend-architektur)
9. [Demo-Modus](#9-demo-modus)
10. [Test-Suite](#10-test-suite)
11. [Lokale Entwicklung](#11-lokale-entwicklung)
12. [Deployment-Hinweise](#12-deployment-hinweise)

---

## 1. Projektübersicht

**SALON** ist eine SaaS-Webanwendung für Friseursalonbetreiber. Die App hilft dabei, betriebswirtschaftliche Kennzahlen zu berechnen, kostendeckende Dienstleistungspreise zu ermitteln und den Umsatz zu steuern.

**Zielgruppe:** Friseursalon-Inhaber in Deutschland, Österreich und der Schweiz (Einzel- und Kleinstbetriebe bis hin zu GmbH-Strukturen).

**Kernfunktionen:**

- Erfassung von Mitarbeitern mit Gehalt, Boni, Beschäftigungsgrad und Aktivmonaten
- Erfassung laufender Kosten (Miete, Nebenkosten, Versicherungen, etc.) mit monatlicher Granularität
- Automatische Berechnung des Lohnfaktors und des Mindestumsatzes
- Kalkulation kostendeckender Dienstleistungspreise (Netto + MwSt) unter Berücksichtigung von Materialkosten, Auslastung und Gewinnaufschlag
- Controlling: Soll-/Ist-Vergleich je Mitarbeiter und Monat
- BWA-Übersicht, Liquiditätsplanung und Simulator für Szenarien
- Admin-Bereich zur Benutzerverwaltung
- Demo-Modus ohne Registrierung (vorkonfigurierter "Haarsalon Müller")

---

## 2. Tech Stack

### Monorepo-Root

| Paket | Version |
|---|---|
| `@playwright/test` | ^1.60.0 |
| `concurrently` | ^8.2.2 |

### Backend (`backend/`)

**Laufzeitabhängigkeiten:**

| Paket | Version |
|---|---|
| `@prisma/client` | ^5.10.0 |
| `bcryptjs` | ^2.4.3 |
| `cors` | ^2.8.5 |
| `dotenv` | ^16.4.0 |
| `express` | ^4.18.2 |
| `express-rate-limit` | ^7.2.0 |
| `helmet` | ^7.1.0 |
| `jsonwebtoken` | ^9.0.2 |
| `morgan` | ^1.10.0 |
| `zod` | ^3.22.4 |

**Entwicklungsabhängigkeiten:**

| Paket | Version |
|---|---|
| `prisma` | ^5.10.0 |
| `typescript` | ^5.3.3 |
| `ts-node-dev` | ^2.0.0 |
| `vitest` | ^4.1.8 |
| `@vitest/coverage-v8` | ^4.1.8 |
| `supertest` | ^7.2.2 |
| `@types/express` | ^4.17.21 |
| `@types/bcryptjs` | ^2.4.6 |
| `@types/cors` | ^2.8.17 |
| `@types/jsonwebtoken` | ^9.0.5 |
| `@types/morgan` | ^1.9.9 |
| `@types/node` | ^20.11.0 |
| `@types/supertest` | ^7.2.0 |

### Frontend (`frontend/`)

**Laufzeitabhängigkeiten:**

| Paket | Version |
|---|---|
| `react` | ^18.2.0 |
| `react-dom` | ^18.2.0 |
| `react-router-dom` | ^6.22.0 |
| `@tanstack/react-query` | ^5.20.0 |
| `axios` | ^1.6.7 |
| `react-hook-form` | ^7.50.0 |
| `recharts` | ^3.8.1 |
| `lucide-react` | ^0.323.0 |

**Entwicklungsabhängigkeiten:**

| Paket | Version |
|---|---|
| `vite` | ^5.1.0 |
| `@vitejs/plugin-react` | ^4.7.0 |
| `typescript` | ^5.3.3 |
| `tailwindcss` | ^3.4.1 |
| `autoprefixer` | ^10.4.17 |
| `postcss` | ^8.4.35 |
| `vitest` | ^4.1.8 |
| `@vitest/coverage-v8` | ^4.1.8 |
| `@testing-library/react` | ^16.3.2 |
| `@testing-library/jest-dom` | ^6.9.1 |
| `@testing-library/user-event` | ^14.6.1 |
| `jsdom` | ^29.1.1 |

---

## 3. Projektstruktur

```
salon/                              ← Monorepo-Root (npm workspaces)
├── package.json                    ← Root-Scripts (dev, build, test, e2e)
├── playwright.config.ts            ← E2E-Konfiguration
├── TECHNICAL.md                    ← Diese Datei
│
├── backend/                        ← Express-API-Server
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── prisma/
│   │   ├── schema.prisma           ← Datenbankschema
│   │   ├── migrations/             ← SQL-Migrationsdateien
│   │   └── seed.ts                 ← (optional) Seed-Skript
│   └── src/
│       ├── index.ts                ← Express-App-Einstiegspunkt, Port 4000
│       ├── lib/
│       │   └── prisma.ts           ← Prisma-Client-Singleton
│       ├── middleware/
│       │   ├── auth.ts             ← JWT-Authentifizierung (authenticate)
│       │   └── admin.ts            ← Admin-Guard (requireAdmin)
│       ├── routes/
│       │   ├── auth.ts             ← /api/auth
│       │   ├── salon.ts            ← /api/salons
│       │   ├── employees.ts        ← /api/salons/:id/employees
│       │   ├── costs.ts            ← /api/salons/:id/costs
│       │   ├── services.ts         ← /api/salons/:id/services
│       │   ├── actuals.ts          ← /api/salons/:id/actuals
│       │   ├── opening-hours.ts    ← /api/salons/:id/opening-hours
│       │   ├── calculation.ts      ← /api/salons/:id/calculation
│       │   ├── admin.ts            ← /api/admin
│       │   └── demo.ts             ← /api/demo
│       └── __tests__/
│           ├── setup.ts            ← Prisma-Mock, JWT_SECRET
│           ├── app.ts              ← Test-Express-App (ohne listen)
│           ├── helpers.ts          ← makeToken(), mockUser
│           ├── auth.test.ts
│           ├── calculation.test.ts
│           ├── demo.test.ts
│           ├── salon.test.ts
│           ├── admin.test.ts
│           └── employees-costs-services.test.ts
│
├── frontend/                       ← React-SPA (Vite)
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.tsx                ← React-Einstiegspunkt
│       ├── App.tsx                 ← Router-Konfiguration
│       ├── api.ts                  ← Axios-Instanz (baseURL: /api)
│       ├── types/
│       │   └── index.ts            ← Alle TypeScript-Interfaces
│       ├── pages/
│       │   ├── LandingPage.tsx     ← /start
│       │   ├── LoginPage.tsx       ← /login
│       │   ├── RegisterPage.tsx    ← /register
│       │   ├── DemoPage.tsx        ← /demo
│       │   ├── DashboardPage.tsx   ← / (geschützt)
│       │   ├── SalonPage.tsx       ← /salon/:id (geschützt)
│       │   ├── AdminPage.tsx       ← /admin (geschützt)
│       │   └── salon/              ← Tabs innerhalb SalonPage/DemoPage
│       │       ├── SetupGuide.tsx
│       │       ├── UebersichtTab.tsx
│       │       ├── MitarbeiterTab.tsx
│       │       ├── KostenTab.tsx
│       │       ├── LohnfaktorTab.tsx
│       │       ├── PreiseTab.tsx
│       │       ├── PreisWizardModal.tsx
│       │       ├── ControllingTab.tsx
│       │       ├── BwaTab.tsx
│       │       ├── LiquiditaetTab.tsx
│       │       ├── SimulatorTab.tsx
│       │       └── EinstellungenTab.tsx
│       └── __tests__/
│           ├── setup.ts
│           ├── LoginPage.test.tsx
│           ├── RegisterPage.test.tsx
│           ├── SetupGuide.test.tsx
│           ├── LohnfaktorTab.test.tsx
│           └── calcVariants.test.ts
│
└── e2e/                            ← Playwright-Tests
    ├── helpers.ts
    ├── auth-salon.spec.ts
    ├── admin.spec.ts
    ├── landing-demo.spec.ts
    └── setup-calculation.spec.ts
```

---

## 4. Architektur

### Monorepo-Aufbau

Das Projekt verwendet **npm workspaces** mit zwei Paketen (`backend`, `frontend`). Root-Scripts koordinieren beide:

```bash
npm run dev        # startet backend (Port 4000) + frontend (Port 5174) gleichzeitig via concurrently
npm run build      # baut backend (tsc) dann frontend (tsc + vite build)
npm run test       # backend-Tests dann frontend-Tests
npm run test:e2e   # Playwright E2E-Tests
```

### Frontend/Backend-Kommunikation

- Das Frontend läuft auf **Port 5174** (Vite-Devserver).
- Das Backend läuft auf **Port 4000** (Express).
- CORS ist im Backend explizit für `http://localhost:5174` erlaubt (mit `credentials: true`).
- Das Frontend kommuniziert ausschließlich über eine zentrale **Axios-Instanz** (`src/api.ts`) mit `baseURL: /api` (im Prod-Build via Reverse-Proxy, im Dev via Vite-Proxy oder direkter Adresse).
- Alle authentifizierten Requests senden einen `Authorization: Bearer <token>`-Header.

### Auth-Flow (JWT)

1. **Registrierung** (`POST /api/auth/register`): Passwort wird mit `bcryptjs` (Salt 10) gehasht; JWT wird signiert mit `JWT_SECRET`, Laufzeit **30 Tage**.
2. **Login** (`POST /api/auth/login`): Gleiches Token-Schema.
3. **Token-Speicherung im Frontend**: Der Token wird im `localStorage` unter dem Schlüssel `salon_token` abgelegt.
4. **Protected Routes**: `ProtectedRoute`-Komponente in `App.tsx` prüft `localStorage.getItem('salon_token')`; fehlt er, wird auf `/start` weitergeleitet.
5. **Server-seitige Verifizierung**: `authenticate`-Middleware in `backend/src/middleware/auth.ts` prüft den `Authorization`-Header und hängt `req.user` an den Request.

### Demo-Modus

Kein Auth erforderlich; der Demo-User hat einen eigenen JWT mit `isDemo: true` und 2-stündiger Laufzeit. Details siehe [Abschnitt 9](#9-demo-modus).

---

## 5. Datenbank

**Datenbanksystem:** PostgreSQL  
**ORM:** Prisma 5.10  
**Schema-Datei:** `backend/prisma/schema.prisma`

### Enums

| Enum | Werte |
|---|---|
| `Country` | `DE`, `AT`, `CH` |
| `BusinessType` | `SOLO`, `GBR`, `GMBH` |
| `EmployeeRole` | `FRISEUR`, `ORGA`, `AZUBI`, `CHEF` |
| `PricingPlan` | `FREE`, `STARTER`, `PRO`, `STUDIO` |
| `CostCategory` | `MIETE`, `NEBENKOSTEN`, `STROM`, `WASSER`, `TELEFON`, `INTERNET`, `VERSICHERUNG`, `STEUERBERATUNG`, `BANKGEBUEHREN`, `LEASING`, `REPARATUREN`, `WERBUNG`, `WEITERBILDUNG`, `SONSTIGE`, `ZINSEN`, `TILGUNG`, `WARENEINSATZ`, `UNTERNEHMERLOHN` |
| `ServiceCategory` | `WASCHEN_SCHNEIDEN_FOENEN`, `HERRENHAARSCHNITT`, `FARBE`, `STRAEHNEN`, `BALAYAGE`, `VERLAENGERUNG`, `CUSTOM` |

### Modell: `User`

| Feld | Typ | Besonderheiten |
|---|---|---|
| `id` | String (cuid) | Primary Key |
| `email` | String | unique |
| `passwordHash` | String | bcrypt, Salt 10 |
| `name` | String | |
| `isAdmin` | Boolean | Default: false |
| `isActive` | Boolean | Default: true |
| `isDemo` | Boolean | Default: false |
| `plan` | PricingPlan | Default: FREE |
| `planExpiresAt` | DateTime? | optional |
| `notes` | String? | optional, Admin-Notizen |
| `createdAt` | DateTime | auto |
| `updatedAt` | DateTime | auto |

Relation: 1 User → n Salons

### Modell: `Salon`

| Feld | Typ | Besonderheiten |
|---|---|---|
| `id` | String (cuid) | Primary Key |
| `userId` | String | FK → User (onDelete: Cascade) |
| `name` | String | |
| `country` | Country | Default: DE |
| `businessType` | BusinessType | Default: SOLO |
| `planStart` | DateTime | Planungszeitraum-Beginn |
| `planEnd` | DateTime | Planungszeitraum-Ende |
| `fullTimeHours` | Float | Default: 38 (Vollzeit-Stunden/Woche) |
| `vacationWeeks` | Int | Default: 5 |
| `createdAt` | DateTime | auto |
| `updatedAt` | DateTime | auto |

Relationen: 1 Salon → n `Employee`, `OpeningHours`, `CostItem`, `Service`, `ActualRevenue`

### Modell: `OpeningHours`

| Feld | Typ | Besonderheiten |
|---|---|---|
| `id` | String (cuid) | PK |
| `salonId` | String | FK → Salon (Cascade) |
| `weekday` | Int | 0 = Montag, 5 = Samstag |
| `openHours` | Float | Öffnungsstunden an diesem Wochentag |
| `variant` | Int | Default: 1 (für zukünftige Mehrfach-Varianten) |

### Modell: `Employee`

| Feld | Typ | Besonderheiten |
|---|---|---|
| `id` | String (cuid) | PK |
| `salonId` | String | FK → Salon (Cascade) |
| `name` | String | |
| `role` | EmployeeRole | |
| `grossSalary` | Float | Bruttogehalt pro Monat |
| `weeklyHours` | Float | Default: 38 |
| `activeMonths` | Float[] | Array mit 12 Werten (0 = inaktiv, 1 = aktiv) |
| `vacationDays` | Int | Default: 0 |
| `sickDays` | Int | Default: 0 |
| `trainingDays` | Int | Default: 0 |
| `christmasBonus` | Float | Weihnachtsgeld (jährlich) |
| `holidayBonus` | Float | Urlaubsgeld (jährlich) |
| `capitalFormation` | Float | Vermögenswirksame Leistungen (mtl.) |
| `taxFreeBonus` | Float | Steuerfreie Zulagen (mtl.) |
| `createdAt` | DateTime | auto |
| `updatedAt` | DateTime | auto |

### Modell: `CostItem`

| Feld | Typ | Besonderheiten |
|---|---|---|
| `id` | String (cuid) | PK |
| `salonId` | String | FK → Salon (Cascade) |
| `category` | CostCategory | |
| `label` | String | Freitext-Bezeichnung |
| `amounts` | Float[] | 12 monatliche Beträge |
| `createdAt` | DateTime | auto |
| `updatedAt` | DateTime | auto |

**Sonderbehandlung zweier Kategorien in der Kalkulation:**
- `UNTERNEHMERLOHN`: Wird separat als `unternehmerlohn` (nicht als Gemeinkosten) geführt.
- `WARENEINSATZ`: Wird als Anteilssatz (0.0–1.0) interpretiert. Werte > 1 werden durch 100 dividiert.

### Modell: `Service`

| Feld | Typ | Besonderheiten |
|---|---|---|
| `id` | String (cuid) | PK |
| `salonId` | String | FK → Salon (Cascade) |
| `category` | ServiceCategory | |
| `name` | String | |
| `durationMinutes` | Float | Dauer in Minuten |
| `materialCost` | Float | Default: 0 |
| `utilizationPct` | Float | Auslastung 0–100, Default: 80 |
| `profitMarkup` | Float | Gewinnaufschlag in %, Default: 10 |

### Modell: `ActualRevenue`

| Feld | Typ | Besonderheiten |
|---|---|---|
| `id` | String (cuid) | PK |
| `salonId` | String | FK → Salon (Cascade) |
| `employeeId` | String | FK → Employee (Cascade) |
| `month` | Int | 1–12 |
| `year` | Int | |
| `actual` | Float | Ist-Umsatz in Euro |

Unique-Constraint: `(employeeId, month, year)` — upsert-fähig.

**Letzte Migration:** `20260612124645_add_is_demo` — fügt `isDemo`-Feld zum `User`-Modell hinzu.

### Migrations-Workflow

```bash
# Neue Migration anlegen (Development)
npm run db:migrate

# Schema ohne Migration-History pushen (Prototyping)
npm run db:push

# Prisma Studio öffnen
npm run db:studio
```

Alle obigen Befehle delegieren an das `backend`-Workspace:
```bash
# Direkt im backend/-Verzeichnis:
npx prisma migrate dev --name <name>
npx prisma generate
```

---

## 6. API-Referenz

**Base-URL:** `http://localhost:4000/api`  
**Auth:** JWT Bearer Token (`Authorization: Bearer <token>`)  
**Admin:** Zusätzlich `isAdmin: true` im JWT-Payload erforderlich

### Health Check

| Method | Path | Auth | Beschreibung |
|---|---|---|---|
| GET | `/health` | Nein | Gibt `{ ok: true, service: 'salon-api' }` zurück |

### Authentifizierung (`/api/auth`)

| Method | Path | Auth | Request Body | Response |
|---|---|---|---|---|
| POST | `/auth/register` | Nein | `{ email, password, name }` | `{ token, user: { id, email, name, isAdmin, plan } }` |
| POST | `/auth/login` | Nein | `{ email, password }` | `{ token, user: { id, email, name, isAdmin, plan } }` |
| GET | `/auth/me` | Ja | — | `{ id, email, name, isAdmin, plan }` |

Fehler: 400 (Fehlende Felder), 401 (Ungültige Credentials), 409 (E-Mail bereits vergeben)

### Salons (`/api/salons`)

| Method | Path | Auth | Beschreibung |
|---|---|---|---|
| GET | `/salons` | Ja | Alle Salons des eingeloggten Users |
| POST | `/salons` | Ja | Neuen Salon anlegen (`name`, `planStart`, `planEnd` Pflicht; optional: `country`, `businessType`, `fullTimeHours`, `vacationWeeks`) |
| GET | `/salons/:id` | Ja | Einzelner Salon mit allen Relations (employees, openingHours, costItems, services) |
| PATCH | `/salons/:id` | Ja | Salon-Felder aktualisieren (alle optional) |
| DELETE | `/salons/:id` | Ja | Salon löschen (cascaded) |

### Mitarbeiter (`/api/salons/:salonId/employees`)

| Method | Path | Auth | Beschreibung |
|---|---|---|---|
| GET | `/:salonId/employees` | Ja | Alle Mitarbeiter eines Salons |
| POST | `/:salonId/employees` | Ja | Neuen Mitarbeiter anlegen (`name`, `role`, `grossSalary` Pflicht) |
| PATCH | `/:salonId/employees/:id` | Ja | Mitarbeiter aktualisieren |
| DELETE | `/:salonId/employees/:id` | Ja | Mitarbeiter löschen |

### Kosten (`/api/salons/:salonId/costs`)

| Method | Path | Auth | Beschreibung |
|---|---|---|---|
| GET | `/:salonId/costs` | Ja | Alle Kostenpositionen (sortiert nach Kategorie) |
| POST | `/:salonId/costs` | Ja | Neue Position (`category`, `label` Pflicht; `amounts` optional, Default: 12× 0) |
| PATCH | `/:salonId/costs/:id` | Ja | Position aktualisieren |
| DELETE | `/:salonId/costs/:id` | Ja | Position löschen |

### Dienstleistungen (`/api/salons/:salonId/services`)

| Method | Path | Auth | Beschreibung |
|---|---|---|---|
| POST | `/:salonId/services` | Ja | Neue Dienstleistung (`category`, `name`, `durationMinutes` Pflicht) |
| PATCH | `/:salonId/services/:id` | Ja | Dienstleistung aktualisieren |
| DELETE | `/:salonId/services/:id` | Ja | Dienstleistung löschen |

### Öffnungszeiten (`/api/salons/:salonId/opening-hours`)

| Method | Path | Auth | Beschreibung |
|---|---|---|---|
| GET | `/:salonId/opening-hours` | Ja | Alle Öffnungszeiten (sortiert nach variant, weekday) |
| PUT | `/:salonId/opening-hours` | Ja | **Bulk-Ersatz**: erwartet Array `[{ weekday, openHours, variant }]`; löscht erst alle, dann neu anlegen (Transaktion) |

### Ist-Umsätze (`/api/salons/:salonId/actuals`)

| Method | Path | Auth | Beschreibung |
|---|---|---|---|
| GET | `/:salonId/actuals?year=YYYY` | Ja | Alle Ist-Umsätze eines Jahres (Default: aktuelles Jahr) |
| PUT | `/:salonId/actuals` | Ja | Upsert: `{ employeeId, month, year, actual }` — legt an oder aktualisiert |

### Kalkulation (`/api/salons/:salonId/calculation`)

| Method | Path | Auth | Beschreibung |
|---|---|---|---|
| GET | `/:salonId/calculation` | Ja | Vollständige betriebswirtschaftliche Berechnung (Details in Abschnitt 7) |

**Response-Schema:**
```json
{
  "country": "DE",
  "employerRate": 0.2075,
  "vatRate": 0.19,
  "workDaysPerYear": 235,
  "workHoursPerDay": 8,
  "totalPersonalkosten": 29004,
  "totalGemeinkosten": 6000,
  "unternehmerlohn": 24000,
  "wareneinsatzRate": 0.12,
  "fixedCosts": 59004,
  "mindestumsatzNet": 67050,
  "bruttolohnsumme": 24000,
  "lohnfaktor": 2.79,
  "pkProMinute": 0.2571,
  "gkProMinute": 0.0532,
  "sollUmsatzPerEmployee": [
    { "id": "...", "name": "Anna", "sollMonat": 6975, "sollTag": 355.8, "sollStunde": 44.5, "activeMonths": 12 }
  ],
  "servicePrices": [
    { "id": "...", "name": "Damen WSF", "category": "WASCHEN_SCHNEIDEN_FOENEN", "selbstkosten": 18.50, "nettopreis": 20.35, "bruttopreis": 24.22 }
  ]
}
```

### Admin (`/api/admin`)

Alle Routen erfordern `authenticate` + `requireAdmin`.

| Method | Path | Auth | Beschreibung |
|---|---|---|---|
| GET | `/admin/stats` | Admin | Plattform-Statistiken (User-Anzahl, Salons, Pläne, Neuregistrierungen) |
| GET | `/admin/users?search=&plan=` | Admin | Alle User mit Salonanzahl; filterbar nach Name/E-Mail und Plan |
| PATCH | `/admin/users/:id` | Admin | User-Felder ändern: `isAdmin`, `isActive`, `isDemo`, `plan`, `planExpiresAt`, `notes` |
| DELETE | `/admin/users/:id` | Admin | User löschen (nicht sich selbst) |

### Demo (`/api/demo`)

| Method | Path | Auth | Beschreibung |
|---|---|---|---|
| GET | `/demo` | Nein | Gibt Demo-Salondaten + kurzlebigen Demo-JWT zurück; legt Demo-User bei erstem Aufruf an |
| GET | `/demo/calculation` | Nein | Vollständige Kalkulation für den Demo-Salon |

---

## 7. Business-Logik & Kalkulationsformeln

Alle Formeln finden sich in `backend/src/routes/calculation.ts` (und identisch in `demo.ts`).

### Länderspezifische Sätze

| Land | AG-Anteil Sozialversicherung | MwSt |
|---|---|---|
| DE | 20,75 % | 19,0 % |
| AT | 30,40 % | 20,0 % |
| CH | 12,50 % | 7,7 % |

### Schritt 1: Arbeitszeit

```
workDaysPerWeek  = Anzahl Wochentage mit openHours > 0 (Fallback: 5)
workHoursPerDay  = Ø Öffnungsstunden der offenen Tage (Fallback: 8)
weeksPerYear     = 52 - salon.vacationWeeks
workDaysPerYear  = workDaysPerWeek × weeksPerYear
totalMinutesPerYear = workDaysPerYear × workHoursPerDay × 60
```

Nur Öffnungszeiten mit `variant = 1` werden berücksichtigt.

### Schritt 2: Personalkosten

Für jeden Mitarbeiter:
```
activeSum     = Summe(activeMonths)          // z.B. 12 für Vollzeitjahr
annualGross   = grossSalary × activeSum
bonuses       = christmasBonus + holidayBonus + capitalFormation + taxFreeBonus
annualTotal   = annualGross + bonuses
personalkosten_MA = annualTotal × (1 + employerRate)
```

```
totalPersonalkosten = Σ personalkosten_MA aller Mitarbeiter
```

### Schritt 3: Gemeinkosten und Sonderposten

```
totalGemeinkosten = Σ (amounts-Summe aller CostItems)
                    -- ohne UNTERNEHMERLOHN und WARENEINSATZ

unternehmerlohn   = Σ (amounts-Summe aller UNTERNEHMERLOHN-Items)

wareneinsatzRate  = Summe WARENEINSATZ-amounts:
                    - wenn Wert ≤ 1.0 → direkt als Anteilssatz (z.B. 0.12)
                    - wenn Wert > 1.0 → Wert / 100 (Prozenteingabe)
```

### Schritt 4: Mindestumsatz (Netto)

```
fixedCosts       = totalPersonalkosten + totalGemeinkosten + unternehmerlohn
mindestumsatzNet = fixedCosts / (1 - wareneinsatzRate)
```

### Schritt 5: Lohnfaktor

Nur produktive Mitarbeiter (Rollen `FRISEUR` und `CHEF`) fließen ein:

```
bruttolohnsumme = Σ (grossSalary × activeMonths-Summe) aller FRISEUR/CHEF
lohnfaktor      = mindestumsatzNet / bruttolohnsumme
```

### Schritt 6: Soll-Umsatz je Mitarbeiter

```
sollMonat  = grossSalary × lohnfaktor
sollTag    = sollMonat / (workDaysPerYear / 12)
sollStunde = sollTag / workHoursPerDay
```

### Schritt 7: Kosten pro Minute

```
pkProMinute = totalPersonalkosten / totalMinutesPerYear
gkProMinute = totalGemeinkosten   / totalMinutesPerYear
```

### Schritt 8: Dienstleistungspreise

Für jede Dienstleistung:

```
utilizationFactor = utilizationPct / 100          // z.B. 0.80
pkKosten          = pkProMinute × durationMinutes
gkKosten          = (gkProMinute / utilizationFactor) × durationMinutes
selbstkosten      = materialCost + pkKosten + gkKosten
nettopreis        = selbstkosten × (1 + profitMarkup / 100)
bruttopreis       = nettopreis × (1 + vatRate)
```

Die Auslastungskorrektur bei `gkKosten` bewirkt: Bei geringerer Auslastung werden die Gemeinkosten auf weniger Produktivminuten verteilt → höherer Preis.

**Rundung:** Preise auf 2 Dezimalstellen, Lohnfaktor auf 2, PK/GK pro Minute auf 4.

---

## 8. Frontend-Architektur

### Routing (`src/App.tsx`)

| Pfad | Komponente | Auth erforderlich |
|---|---|---|
| `/start` | `LandingPage` | Nein |
| `/login` | `LoginPage` | Nein |
| `/register` | `RegisterPage` | Nein |
| `/demo` | `DemoPage` | Nein |
| `/` | `DashboardPage` | Ja |
| `/salon/:id` | `SalonPage` | Ja |
| `/admin` | `AdminPage` | Ja |

`ProtectedRoute` prüft `localStorage.getItem('salon_token')`. Fehlt der Token, erfolgt `<Navigate to="/start" replace />`.

### SalonPage — Tabs

`SalonPage` rendert eine horizontale Tab-Navigation und zeigt je nach aktivem Tab eine Tab-Komponente:

| Tab-ID | Label | Komponente | Beschreibung |
|---|---|---|---|
| `uebersicht` | Übersicht | `UebersichtTab` + `SetupGuide` | Kennzahlen-Übersicht; SetupGuide wird immer mitgerendert |
| `mitarbeiter` | Mitarbeiter | `MitarbeiterTab` | CRUD für Mitarbeiter |
| `kosten` | Kosten | `KostenTab` | CRUD für Kostenpositionen mit monatlicher Eingabe |
| `lohnfaktor` | Lohnfaktor | `LohnfaktorTab` | Zeigt berechneten Lohnfaktor und Soll-Umsätze |
| `preise` | Preise | `PreiseTab` | Dienstleistungen + kalkulierte Preise |
| `controlling` | Controlling | `ControllingTab` | Soll/Ist-Vergleich je MA und Monat |
| `bwa` | BWA | `BwaTab` | Betriebswirtschaftliche Auswertung |
| `liquiditaet` | Liquidität | `LiquiditaetTab` | Liquiditätsübersicht |
| `simulator` | Simulator | `SimulatorTab` | Szenario-Simulator |
| `einstellungen` | Einstellungen | `EinstellungenTab` | Salon-Stammdaten + Öffnungszeiten |

### LandingPage — Video-Sektion

Zwischen Hero und Features gibt es eine neue Sektion mit dunklem Hintergrund (`bg-gray-950`). Sie enthält aktuell einen Video-Platzhalter (Aspect-Ratio-Div mit Play-Button und Text "Marketing-Video folgt"). Im Quellcode ist ein auskommentierter YouTube-`<iframe>`-Einbettungscode als TODO hinterlegt. Sobald das Video bereit ist, den Platzhalter-Div durch `<iframe src="https://www.youtube.com/embed/VIDEO_ID" ...>` ersetzen.

### Pricing-Messaging

Free-Trial-Kommunikation wurde vollständig entfernt. Aktuell gültige Preisangabe: **99 € / Jahr, netto zzgl. MwSt., sofort aktiv**. Alle CTA-Buttons (LandingPage, RegisterPage, DemoPage) wurden von "Kostenlos testen" / "14 Tage kostenlos starten" auf **"Jetzt kaufen"** / **"Jetzt kaufen & starten"** geändert.

### DemoPage — Tabs

`DemoPage` zeigt dieselben Tabs wie `SalonPage`, aber ohne den Tab `einstellungen`. Demo-Daten sind read-only — Schreib-Requests auf `/api/salons/*` werden serverseitig durch die `requireNotDemo`-Middleware mit HTTP 403 blockiert (siehe [Abschnitt 9](#9-demo-modus)).

### SetupGuide-Logik

`SetupGuide` (`src/pages/salon/SetupGuide.tsx`) zeigt einen Fortschrittsbalken für den Onboarding-Prozess. Es gibt 5 Schritte:

| Schritt-ID | Tab | Pflicht | Abhängigkeiten |
|---|---|---|---|
| `mitarbeiter` | mitarbeiter | Ja | — |
| `kosten` | kosten | Ja | — |
| `oeffnungszeiten` | einstellungen | Nein | — |
| `preise` | preise | Ja | mitarbeiter, kosten |
| `controlling` | controlling | Nein | preise |

- Ein Schritt gilt als erledigt, wenn der entsprechende Datensatz-Count > 0 ist.
- Der SetupGuide wird nur auf dem Tab `uebersicht` gerendert und navigiert via `onNavigate(tabId)` zu anderen Tabs.

### State-Management

- Kein globaler State-Store.
- Server-State via **TanStack Query** (`@tanstack/react-query`): Queries mit `queryKey` und `queryFn`.
- Formulare via **react-hook-form**.
- Authentifizierter User wird nach Login im `localStorage` gespeichert und bei Bedarf von `/api/auth/me` neu geladen.

---

## 9. Demo-Modus

### Server-seitige Demo-Durchsetzung

Neue Middleware `backend/src/middleware/demo.ts` exportiert `requireNotDemo`.

- Blockiert alle **non-GET**-Requests, wenn der User `isDemo: true` hat (geprüft sowohl über `req.user.isDemo` aus dem JWT-Payload als auch direkt aus der DB).
- Gibt HTTP **403** zurück: `"Im Demo-Modus sind keine Änderungen möglich"`.
- Ist in `backend/src/index.ts` auf alle `/api/salons/*`-Routen angewendet: `app.use('/api/salons', requireNotDemo)`.

Zusätzlich wurde die `authenticate`-Middleware (`backend/src/middleware/auth.ts`) um zwei Prüfungen erweitert:
- Liest `isDemo` aus DB und JWT-Payload und setzt `req.user.isDemo`.
- Gibt HTTP **403** `"Konto deaktiviert"` zurück, wenn `user.isActive === false`.

Das `AdminUser`-TypeScript-Interface (`frontend/src/types/index.ts`) enthält nun `isDemo: boolean`. In der Admin-Benutzer-Tabelle (`AdminPage`) gibt es eine neue "Demo"-Spalte mit violettem Badge und eine Checkbox im Bearbeiten-Modal.

### Backend

Der Demo-Modus ist in `backend/src/routes/demo.ts` implementiert.

**Demo-User:**
- E-Mail: `demo@salon-app.de`
- Passwort-Hash: bcrypt(`demo-readonly`) — wird nie für Login genutzt
- Plan: `PRO`
- isActive: true

**Seed-Daten (`seedDemoSalon`):**

Beim ersten Aufruf von `GET /api/demo` wird automatisch angelegt:
- Salon "Haarsalon Müller" (Land: DE, SOLO, planStart 2026-01-01, vacationWeeks: 4)
- 6 Öffnungszeiten (Mo–Sa, 7–9 h/Tag)
- 4 Mitarbeiter: Anja Müller (CHEF, 2800 €), Sarah Klein (FRISEUR, 2200 €), Lena Schmidt (FRISEUR, 2000 €, Teilzeit), Max Brauer (AZUBI, 650 €)
- 13 Kostenpositionen (Miete 1800 €/Monat, Wareneinsatz 12 %, Unternehmerlohn 2500 €/Monat, etc.)
- 8 Dienstleistungen (WSF, Herrenschnitt, Ansatzfarbe, Vollfarbe, Strähnen, Balayage, Kinderschnitt, Olaplex)
- IST-Umsätze für alle vergangenen Monate des aktuellen Jahres (nur Anja, Sarah, Lena)

**Demo-JWT:**
```json
{
  "userId": "<demo-user-id>",
  "isDemo": true,
  "exp": "<now + 2h>"
}
```

### Frontend

`DemoPage` ruft `GET /api/demo` via TanStack Query ab. Sobald der `token` im Response vorhanden ist, wird er via `useEffect` temporär als `Authorization`-Header in die Axios-Instanz injiziert:

```ts
api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
```

Beim Unmount der `DemoPage` wird der vorherige Header wiederhergestellt (oder gelöscht). Dies ermöglicht, dass alle Tab-Komponenten (die dieselbe Axios-Instanz nutzen) API-Calls im Namen des Demo-Users durchführen können, ohne dass der Demo-Token im `localStorage` persistiert wird.

---

## 10. Test-Suite

### Überblick

Das Projekt hat drei Test-Ebenen:

1. **Backend-Unit-Tests** (Vitest + Supertest) — in `backend/src/__tests__/`
2. **Frontend-Unit-Tests** (Vitest + Testing Library) — in `frontend/src/__tests__/`
3. **E2E-Tests** (Playwright) — in `e2e/`

### Backend-Tests

**Setup:** `backend/src/__tests__/setup.ts`
- Setzt `JWT_SECRET=test-secret-key-for-testing` und `NODE_ENV=test`
- Mockt Prisma global via `vi.mock('../lib/prisma', ...)` mit `vi.fn()` für alle Methoden
- Alle Tests sind isoliert — kein echtes Datenbankzugriff

**Test-Dateien:**

| Datei | Was wird getestet |
|---|---|
| `auth.test.ts` | Register, Login, /me — Validierung, doppelte E-Mail, falsche Credentials |
| `salon.test.ts` | CRUD-Operationen für Salons, Ownership-Check |
| `employees-costs-services.test.ts` | CRUD für Mitarbeiter, Kostenpositionen, Dienstleistungen |
| `calculation.test.ts` | Berechnungslogik mit bekannten Fixture-Werten (verifiziert Lohnfaktor, Mindestumsatz, PK/Minute) |
| `demo.test.ts` | Demo-Endpoint, Demo-Token-Generierung |
| `admin.test.ts` | Admin-Stats, User-Liste, PATCH/DELETE; blockiert Nicht-Admins |

**Konfiguration** (`backend/vitest.config.ts`):
- Environment: `node`
- Coverage: v8, Schwellenwerte: 70 % Lines, 70 % Functions, 60 % Branches
- Coverage-Ausschluss: `src/__tests__/**`, `src/index.ts`

**Ausführen:**
```bash
# Im Root:
npm run test:backend

# Im backend/-Verzeichnis:
npx vitest run
npx vitest run --coverage
npx vitest          # Watch-Modus
```

### Frontend-Tests

**Setup:** `frontend/src/__tests__/setup.ts` — jest-dom-Matcher und Axios-Mock

**Test-Dateien:**

| Datei | Was wird getestet |
|---|---|
| `LoginPage.test.tsx` | Login-Formular: Rendering, Validierung, Submit-Verhalten |
| `RegisterPage.test.tsx` | Registrierungsformular |
| `SetupGuide.test.tsx` | Schritt-Anzeige, Fortschrittslogik |
| `LohnfaktorTab.test.tsx` | Lohnfaktor-Anzeige mit Mock-Kalkulationsdaten |
| `calcVariants.test.ts` | Reine Rechenlogik für Kalkulationsvarianten |

**Konfiguration** (`frontend/vitest.config.ts`):
- Environment: `jsdom`
- Coverage-Einschlusspfade explizit definiert (LoginPage, RegisterPage, SetupGuide, LohnfaktorTab, calcVariants)
- Schwellenwerte: 70 % Lines, 70 % Functions, 60 % Branches

**Ausführen:**
```bash
# Im Root:
npm run test:frontend

# Im frontend/-Verzeichnis:
npx vitest run
npx vitest run --coverage
```

### E2E-Tests (Playwright)

**Konfiguration** (`playwright.config.ts`):
- `testDir: './e2e'`
- Browser: Chromium (Desktop Chrome)
- `baseURL: http://localhost:5174`
- `workers: 1` (sequenziell, kein paralleles Ausführen)
- `actionTimeout: 10_000 ms`
- Traces bei erstem Retry; Screenshots nur bei Fehler
- In CI: `forbidOnly: true`, `retries: 2`

**Wichtig:** Die E2E-Tests erwarten, dass beide Dev-Server bereits laufen (`backend` auf 4000, `frontend` auf 5174). Die `webServer`-Konfiguration in `playwright.config.ts` ist auskommentiert.

**Test-Dateien:**

| Datei | Was wird getestet |
|---|---|
| `landing-demo.spec.ts` | Landing Page, Demo-Button, Demo-Ladevorgang |
| `auth-salon.spec.ts` | Register → Login → Salon anlegen → Tabs navigieren |
| `setup-calculation.spec.ts` | Demo-Salon: Übersicht zeigt Lohnfaktor, Personalkosten, Mindestumsatz; Kosten- und Mitarbeiter-Tabs |
| `admin.spec.ts` | Admin-Login, User-Liste im Admin-Bereich |

**Ausführen:**
```bash
# Im Root (beide Server müssen laufen):
npm run test:e2e

# Mit Playwright-UI:
npx playwright test --ui

# Gezielt eine Datei:
npx playwright test e2e/landing-demo.spec.ts
```

### Alle Tests auf einmal

```bash
# Unit-Tests (backend + frontend):
npm run test

# Unit-Tests mit Coverage:
npm run test:coverage

# E2E (Server vorher starten):
npm run dev &
npm run test:e2e
```

---

## 11. Lokale Entwicklung

### Prerequisites

- **Node.js** ≥ 20 (empfohlen: 20 LTS)
- **npm** ≥ 10 (kommt mit Node 20)
- **PostgreSQL** ≥ 15 (lokal oder via Docker)

### Setup-Schritte

```bash
# 1. Repository klonen
git clone <repo-url>
cd salon

# 2. Alle Abhängigkeiten installieren (alle Workspaces)
npm install

# 3. Backend-Environment konfigurieren
cp backend/.env.example backend/.env
# .env bearbeiten (siehe "Umgebungsvariablen" unten)

# 4. Datenbank-Schema anlegen
npm run db:migrate

# 5. Dev-Server starten (Backend + Frontend gleichzeitig)
npm run dev
```

### Umgebungsvariablen (Backend)

Datei: `backend/.env`

| Variable | Beschreibung | Beispiel |
|---|---|---|
| `DATABASE_URL` | PostgreSQL-Connection-String | `postgresql://user:pass@localhost:5432/salon_dev` |
| `JWT_SECRET` | Geheimer Schlüssel für JWT-Signierung (mindestens 32 Zeichen empfohlen) | `mein-sehr-geheimer-schluessel-123` |
| `PORT` | Server-Port (optional, Default: 4000) | `4000` |

Das Frontend hat keine eigene `.env` für die Entwicklung. Die API-URL ist in `frontend/src/api.ts` als `baseURL` konfiguriert.

### Beide Server starten

```bash
# Root-Script (empfohlen):
npm run dev
# → Backend auf http://localhost:4000
# → Frontend auf http://localhost:5174

# Alternativ separat:
npm run dev --workspace=backend   # Backend
npm run dev --workspace=frontend  # Frontend
```

### Prisma Studio (Datenbank-UI)

```bash
npm run db:studio
# → öffnet Browser auf http://localhost:5555
```

---

## 12. Deployment-Hinweise

### Umgebungsvariablen (Produktion)

| Variable | Anforderung |
|---|---|
| `DATABASE_URL` | Produktions-PostgreSQL-URL (mit SSL: `?sslmode=require`) |
| `JWT_SECRET` | Kryptographisch starkes Secret (min. 64 Zeichen); **niemals in Git einchecken** |
| `PORT` | Vom Hosting-Anbieter vorgegeben (z.B. Render, Railway: `PORT`-Env wird automatisch gesetzt) |
| `NODE_ENV` | `production` setzen für optimierten Betrieb |

### CORS

In `backend/src/index.ts` ist CORS aktuell fest auf `http://localhost:5174` konfiguriert:

```ts
app.use(cors({ origin: 'http://localhost:5174', credentials: true }))
```

Für Produktion muss dies auf die echte Frontend-URL geändert werden. Empfehlung: Über Umgebungsvariable steuern:

```ts
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5174', credentials: true }))
```

### Build

```bash
# Backend kompilieren
npm run build --workspace=backend
# Output: backend/dist/

# Frontend kompilieren
npm run build --workspace=frontend
# Output: frontend/dist/ (statische Dateien für CDN oder Nginx)
```

### Migrations bei Deployment

```bash
# In der Produktionsumgebung (nicht db:push!)
cd backend
npx prisma migrate deploy
```

`migrate deploy` wendet nur bereits generierte Migrations an, ohne interaktive Prompts — geeignet für CI/CD.

### Sicherheits-Hinweise

- `helmet()` ist bereits aktiv (setzt sicherheitsrelevante HTTP-Header).
- `express-rate-limit` ist im Paket enthalten; ggf. auf Auth-Routen konfigurieren.
- Demo-User (`demo@salon-app.de`) wird automatisch in der Datenbank angelegt — dies ist gewollt und unbedenklich.
- Admin-Zugänge (`isAdmin: true`) müssen manuell per Datenbank-Seed oder über Prisma Studio gesetzt werden — es gibt keine öffentliche Route zur Admin-Ernennung.
- JWT-Token haben 30 Tage Laufzeit (Demo-Tokens: 2 Stunden). Token-Rotation oder Blacklisting ist aktuell nicht implementiert.
