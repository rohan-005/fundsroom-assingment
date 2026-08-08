# Industrial Mini ERP + CRM Monorepo Application

A production-grade, full-stack B2B Enterprise Resource Planning (ERP) and Customer Relationship Management (CRM) system engineered with React, Express, TypeScript, and Neon PostgreSQL.

Designed with a sharp, high-contrast industrial black/white/red visual aesthetic, floating bottom navigation, zero-rounded border styling, pixel-font stats metrics, and strict role-based access control (RBAC).

---

## 🛠️ Technology Stack

### Frontend (`/client`)
- **Core Library**: React 18 with TypeScript & Vite
- **Routing**: React Router v6
- **State & Data Fetching**: TanStack React Query v5 & Axios
- **Form Validation**: React Hook Form with Zod validation schemas
- **Styling**: Tailwind CSS v3 (enforced `border-radius: 0px !important`, custom black/white/red palette, Press Start 2P & Inter typography)

### Backend (`/server`)
- **Runtime**: Node.js & TypeScript (`ts-node-dev` for development)
- **Framework**: Express.js REST API architecture
- **Database & ORM**: Neon PostgreSQL with Prisma ORM v5
- **Authentication**: JSON Web Tokens (JWT) with HTTP-only Authorization header pattern
- **Unit Testing**: Jest & Supertest integration test suite

---

## 💼 Core Business Modules

1. **Authentication & RBAC**:
   - Secure JWT authentication with role authorization middleware (`ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`).
   - Quick-fill single-click role presets on the login screen for instant demo switching.

2. **Customer CRM**:
   - Searchable customer directory with filtering by Customer Type (`Wholesale`, `Retail`, `Distributor`) and Status (`Lead`, `Active`, `Inactive`).
   - Customer follow-up timeline logger with automatic next follow-up date calculation.

3. **Products & Inventory Catalog**:
   - Product catalog with unique SKU enforcement, category tagging, unit pricing, current stock levels, and minimum stock threshold alerts.
   - Low-stock visual badges and quick filter toggle.

4. **Stock Movement Auditing**:
   - Real-time `IN` (stock intake) and `OUT` (dispatches/adjustments) movement ledger.
   - ACID interactive transaction locks (`prisma.$transaction`) enforcing negative stock prevention.

5. **Sales Challan Management**:
   - Auto-generated sequential challan numbers (`CH-YYYY-XXXX`).
   - Snapshot fields (`productNameSnapshot`, `skuSnapshot`, `unitPrice`) preserving historical transaction integrity even if product catalog records are modified later.
   - Challan confirmation triggers atomic stock deduction and creates corresponding `OUT` stock movements inside database transactions.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18.x or higher)
- npm (v9.x or higher)
- Neon PostgreSQL connection URI (`DATABASE_URL`)

### 1. Repository Setup & Dependencies Installation
```bash
# Clone the repository
git clone <repository-url>
cd fundsroom-assingment

# Install dependencies across monorepo workspace
npm run install:all
```

### 2. Environment Configuration

Create a `.env` file inside the `server/` directory:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@ep-sample-neon.neon.tech/neondb?sslmode=require"
JWT_SECRET="super-secret-jwt-key-min-32-chars-length"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:5173"
```

Create a `.env` file inside the `client/` directory:
```env
VITE_API_BASE_URL="http://localhost:5000/api"
```

### 3. Database Schema Push & Seed

Push the Prisma schema to your Neon PostgreSQL instance and populate demo seed data:
```bash
# Push schema to database
npm --prefix server run db:push

# Run seed script (seeds users, customers, products, and draft challans)
npm --prefix server run db:seed
```

### 4. Running the Development Application

Run both client and server concurrently using the root workspace command:
```bash
npm run dev
```

- **Frontend Application**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api`

---

## 🧪 Testing

Run the full integration unit test suite covering authentication, CRM workflows, stock limits, snapshot fields, and transaction locks:

```bash
npm --prefix server test
```

---

## 📡 API Endpoint Matrix

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticate user & receive JWT |
| `GET` | `/api/auth/profile` | All Roles | Fetch current user profile & role |
| `GET` | `/api/customers` | Admin, Sales, Warehouse, Accounts | List customers with search & filter |
| `POST` | `/api/customers` | Admin, Sales | Create customer record |
| `PUT` | `/api/customers/:id` | Admin, Sales | Update customer details |
| `DELETE`| `/api/customers/:id` | Admin | Delete customer record |
| `POST` | `/api/customers/:id/follow-up` | Admin, Sales | Log follow-up timeline entry |
| `GET` | `/api/products` | All Roles | List products with low stock filter |
| `POST` | `/api/products` | Admin, Warehouse | Create product record |
| `PUT` | `/api/products/:id` | Admin, Warehouse | Update product or stock threshold |
| `GET` | `/api/stock-movements` | All Roles | View inventory movement audit trail |
| `POST` | `/api/stock-movements` | Admin, Warehouse | Record manual stock intake/intake OUT |
| `GET` | `/api/challans` | All Roles | List Sales Challans with filters |
| `POST` | `/api/challans` | Admin, Sales | Create Sales Challan (Draft/Confirmed) |
| `POST` | `/api/challans/:id/confirm` | Admin, Sales | Atomically confirm challan & reduce stock |
| `PUT` | `/api/challans/:id` | Admin, Sales | Update DRAFT or cancel challan |

---

## 🗄️ Database Entity Schema Architecture

```
User (id, email, passwordHash, name, role)
 ├── Customer (id, name, mobile, customerType, status, followUpDate)
 │    ├── FollowUp (id, note, date, createdById)
 │    └── SalesChallan (id, challanNumber, totalQuantity, status, createdById)
 │         └── SalesChallanItem (id, quantity, unitPrice, productNameSnapshot, skuSnapshot)
 └── Product (id, productName, sku, category, unitPrice, currentStock, minimumStock)
      └── StockMovement (id, quantity, movementType [IN/OUT], reason, createdById)
```

---

## 📁 Repository Workspace Structure

```
fundsroom-assingment/
├── client/                 # React + Vite TypeScript Frontend
│   ├── src/
│   │   ├── components/     # UI Design System (Modal, Badge, Header, BottomNav)
│   │   ├── context/        # AuthContext & state providers
│   │   ├── pages/          # Login, Dashboard, Customers, Products, Challans, Profile
│   │   ├── services/       # Axios API client modules
│   │   ├── index.css       # Zero-radius industrial theme & styling overrides
│   │   └── App.tsx         # React Router & Role Protection setup
│   ├── package.json
│   └── tailwind.config.js  # Color palette & font definitions
├── server/                 # Express + Prisma Node.js Backend
│   ├── prisma/
│   │   ├── schema.prisma   # PostgreSQL Database Schema
│   │   └── seed.ts         # Database Seeding Script
│   ├── src/
│   │   ├── controllers/    # API Request Controllers
│   │   ├── services/       # Business Logic & Database Transactions
│   │   ├── middlewares/    # Auth JWT & Role Authorization Guards
│   │   ├── validators/     # Zod DTO Validation Schemas
│   │   ├── tests/          # Jest Integration Test Suite
│   │   └── server.ts       # Application Entry Point
│   ├── package.json
│   └── tsconfig.json
└── package.json            # Monorepo Workspace Configuration
```

---

## 📄 License

This repository is created for technical evaluation. All rights reserved.
