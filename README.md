# Matic Platform# Matic Platform# Matic Platform# Matic Platform - Complete Documentation



> A modern, full-stack Airtable-inspired platform with advanced data tables, dynamic forms, and integrated barcode scanning



[![Go](https://img.shields.io/badge/Go-1.21+-00ADD8?style=flat&logo=go)](https://go.dev/)**Full-stack Airtable-like platform with forms, data tables, and barcode scanner**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)](https://nextjs.org/)

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-316192?style=flat&logo=postgresql)](https://www.postgresql.org/)

[![License](https://img.shields.io/badge/License-Private-red?style=flat)](LICENSE)

Built with Next.js 14 (frontend) and Go + Gin (backend)**Full-stack Airtable-like platform with forms, data tables, and barcode scanner****Full-stack Airtable-like platform with forms, data tables, and barcode scanner**

---



## 📖 Table of Contents

---

- [Overview](#-overview)

- [Features](#-features)

- [Architecture](#-architecture)

- [Quick Start](#-quick-start)## 🚀 Quick StartBuilt with Next.js 14 (frontend) and Go + Gin (backend)Built with Next.js 14, Supabase Direct, and PostgreSQL

- [Project Structure](#-project-structure)

- [API Reference](#-api-reference)

- [Development](#-development)

- [Deployment](#-deployment)### Prerequisites

- [Configuration](#-configuration)

- [Contributing](#-contributing)- Node.js 18+

- [License](#-license)

- Go 1.21+------

---

- PostgreSQL (Supabase)

## 🎯 Overview

- Git

Matic Platform is a production-ready, full-stack application that brings Airtable-like functionality with:



- **Data Tables**: Flexible tables with 20+ column types and 6 view modes

- **Forms**: Dynamic form builder with conditional logic and validation### Setup## 🚀 Quick Start## 📋 Table of Contents

- **Barcode Scanner**: Real-time scanning with instant data matching

- **Workspaces**: Multi-tenant architecture with role-based access

- **Request Hubs**: Centralized request management system

```bash

**Tech Stack**: Go (Gin) + Next.js 14 + PostgreSQL (Supabase) + TypeScript

# Clone repository

---

git clone https://github.com/Jsanchez767/matic-platform.git### Prerequisites1. [Quick Start](#quick-start)

## ✨ Features

cd matic-platform

### 📊 Advanced Data Tables

- **20+ Column Types**: Text, number, select, multi-select, date, datetime, checkbox, URL, email, phone, attachment, user, lookup, rollup, formula, autonumber, rating, duration, currency, progress- Node.js 18+2. [Architecture Overview](#architecture-overview)

- **6 View Types**: Grid, Kanban, Calendar, Gallery, Timeline, Form

- **Relationships**: Link tables, lookup fields, rollup calculations# Install frontend dependencies

- **Formulas**: Excel-like formula engine

- **Real-time Collaboration**: Live updates across all usersnpm install- Go 1.21+3. [Tech Stack](#tech-stack)

- **Filtering & Sorting**: Advanced query capabilities

- **Import/Export**: CSV and Excel support



### 📝 Dynamic Forms# Set up frontend environment- PostgreSQL (Supabase)4. [Project Structure](#project-structure)

- **Visual Builder**: Drag-and-drop form designer

- **Conditional Logic**: Show/hide fields based on responsescp .env.local.example .env.local

- **Validation Rules**: Built-in and custom validators

- **Multi-page Forms**: Break long forms into steps# Edit .env.local with your Supabase credentials- Git5. [Features](#features)

- **Submissions**: Auto-populate data tables

- **Embeddable**: Share forms via public links

- **Response Management**: Track and analyze submissions

# Set up backend environment6. [Database Setup](#database-setup)

### 📱 Barcode Scanner

- **Real-time Scanning**: Instant barcode/QR code recognitioncd go-backend

- **Auto-matching**: Search and match against table data

- **Multiple Formats**: EAN, UPC, Code128, QR codes, and morecp .env.example .env### Setup7. [Development](#development)

- **Mobile Optimized**: Camera controls, torch, device switching

- **History Tracking**: Complete scan audit trail# Edit .env with your database credentials

- **Batch Operations**: Scan multiple items rapidly

8. [Deployment](#deployment)

### 🏢 Workspace Management

- **Multi-tenant**: Isolated workspaces with separate data# Install Go dependencies

- **Team Collaboration**: Invite members with role-based permissions

- **Access Control**: Owner, Admin, Member, Viewer rolesgo mod download```bash9. [Performance](#performance)

- **Customization**: Custom icons, colors, descriptions

- **Activity Logs**: Track all workspace changes



### 🔍 Request Hubs# Start backend server# Clone repository10. [Migration History](#migration-history)

- **Centralized Management**: Single location for all requests

- **Multi-tab Interface**: Organize by status, priority, or custom criteriago run main.go

- **Custom Workflows**: Define your own request lifecycle

- **Tab Reordering**: Drag-and-drop tab management# Backend runs on http://localhost:8000git clone https://github.com/Jsanchez767/matic-platform.git

- **Filtering**: Advanced request filtering and search



---

# In new terminal, start frontendcd matic-platform---

## 🏗️ Architecture

cd ..

### System Design

npm run dev

```

┌─────────────────────────────────────────────────────────────┐# Frontend runs on http://localhost:3000

│                       CLIENT LAYER                          │

│                                                             │```# Install frontend dependencies## 🚀 Quick Start

│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │

│  │   Browser    │  │    Mobile    │  │   Desktop    │    │

│  │   (React)    │  │  (Future)    │  │  (Future)    │    │

│  └──────────────┘  └──────────────┘  └──────────────┘    │---npm install

└─────────────────────────────────────────────────────────────┘

                           │

                           │ HTTPS/REST

                           ▼## 🏗️ Architecture### Prerequisites

┌─────────────────────────────────────────────────────────────┐

│                    FRONTEND LAYER                           │

│                  Next.js 14 (App Router)                    │

│                                                             │```# Set up frontend environment- Node.js 18+

│  • Server-Side Rendering (SSR)                             │

│  • Client Components with React 18                         │┌──────────────────────────────────────┐

│  • TypeScript for type safety                              │

│  • Tailwind CSS + shadcn/ui                                ││         FRONTEND                     │cp .env.local.example .env.local- Supabase account

│  • Supabase Auth integration                               │

└─────────────────────────────────────────────────────────────┘│      Next.js 14 App Router           │

                           │

                           │ REST API│       (localhost:3000)               │# Edit .env.local with your Supabase credentials- Git

                           ▼

┌─────────────────────────────────────────────────────────────┐└──────────────────────────────────────┘

│                     BACKEND LAYER                         │

│                   Go 1.21+ (Gin Framework)                │              │

│                                                           │

│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │              ▼

│  │  Handlers   │  │  Services   │  │ Middleware  │        │

│  │  (Routes)   │  │  (Logic)    │  │ (Auth/CORS) │        │┌──────────────────────────────────────┐# Set up backend environment### Setup

│  └─────────────┘  └─────────────┘  └─────────────┘        │

│                                                             ││         BACKEND API                  │

│  • RESTful API (32 endpoints)                              │

│  • GORM for database operations                            ││      Go + Gin Framework              │cd go-backend

│  • JWT token validation                                    │

│  • Request validation & error handling                     ││       (localhost:8000)               │

│  • CORS configuration                                      │

└─────────────────────────────────────────────────────────────┘│                                      │cp .env.example .env```bash

                           │

                           │ SQL│  All Operations:                     │

                           ▼

┌─────────────────────────────────────────────────────────────┐│  - CRUD for workspaces               │# Edit .env with your database credentials# Clone repository

│                     DATABASE LAYER                          │

│                PostgreSQL 15 (Supabase)                     ││  - CRUD for request-hubs             │

│                                                             │

│  • 18 core tables                                          ││  - CRUD for tables & rows            │git clone https://github.com/Jsanchez767/matic-platform.git

│  • Row-Level Security (RLS)                                │

│  • JSONB for flexible data                                 ││  - CRUD for forms & submissions      │

│  • Indexes for performance                                 │

│  • Real-time subscriptions                                 ││  - Validation & transactions         │# Install Go dependenciescd matic-platform

│  • Automated backups                                       │

└─────────────────────────────────────────────────────────────┘└──────────────────────────────────────┘

```

              │go mod download

### Data Flow

              ▼

```

User Action → Next.js Component → API Client → Go Backend Handler ┌──────────────────────────────────────┐# Install dependencies

     → GORM Model → PostgreSQL → Response → JSON → UI Update

```│      DATABASE                        │



### Key Design Decisions│   PostgreSQL (Supabase)              │# Start backend servernpm install



1. **Go Backend**: High performance, strong typing, excellent concurrency│   - 18 core tables                   │

2. **GORM**: Type-safe ORM with migrations and relationship management

3. **Next.js 14**: Modern React with App Router for optimal performance│   - Row Level Security               │go run main.go

4. **Supabase**: Managed PostgreSQL with auth and real-time features

5. **Monorepo**: Single repository for frontend and backend│   - Real-time updates                │



---└──────────────────────────────────────┘# Backend runs on http://localhost:8000# Set up environment variables



## 🚀 Quick Start```



### Prerequisitescp .env.local.example .env.local



Ensure you have the following installed:**All data operations (reads AND writes) go through the Go backend API.**



- **Node.js** 18.0 or higher ([Download](https://nodejs.org/))# In new terminal, start frontend# Edit .env.local with your Supabase credentials

- **Go** 1.21 or higher ([Download](https://go.dev/dl/))

- **Git** ([Download](https://git-scm.com/))---

- **Supabase Account** ([Sign up](https://supabase.com/))

cd ..

### Installation

## 🛠️ Tech Stack

#### 1. Clone the Repository

npm run dev# Run database setup

```bash

git clone https://github.com/Jsanchez767/matic-platform.git### Frontend

cd matic-platform

```- **Framework**: Next.js 14.2.5 (App Router)# Frontend runs on http://localhost:3000# Go to Supabase Dashboard → SQL Editor



#### 2. Set Up the Database- **Language**: TypeScript 5.x



1. Create a new project in [Supabase Dashboard](https://app.supabase.com/)- **Styling**: Tailwind CSS 3.4```# Run: setup_complete_rls.sql

2. Go to **SQL Editor**

3. Run the schema from `001_initial_schema.sql`- **UI Components**: shadcn/ui

4. Note your database credentials

- **State**: React hooks, Context API

#### 3. Configure Environment Variables

- **Auth**: Supabase Auth (JWT tokens)

**Frontend** (create `.env.local` in root):

```bash---# Start development server

cp .env.local.example .env.local

```### Backend



Edit `.env.local`:- **Language**: Go 1.21+npm run dev

```bash

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co- **Framework**: Gin v1.10.0

NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1- **ORM**: GORM v1.25.12## 🏗️ Architecture```

```

- **Database Driver**: PostgreSQL (pgx)

**Backend** (create `.env` in `go-backend/`):

```bash- **CORS**: gin-contrib/cors

cd go-backend

cp .env.example .env- **Config**: godotenv

```

```Access at http://localhost:3000

Edit `go-backend/.env`:

```bash### Database

DATABASE_URL=postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres

PORT=8000- **Provider**: Supabase (PostgreSQL 15)┌──────────────────────────────────────┐

GIN_MODE=debug

CORS_ORIGINS=http://localhost:3000,https://your-production-domain.com- **Connection**: Direct (port 5432 with IPv4 add-on)

SUPABASE_URL=https://your-project.supabase.co

SUPABASE_ANON_KEY=your-anon-key- **Schema**: 18 tables (organizations, workspaces, tables, forms, etc.)│         FRONTEND                     │---

SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

```



#### 4. Install Dependencies---│      Next.js 14 App Router           │



**Frontend**:

```bash

npm install## 📁 Project Structure│       (localhost:3000)               │## 🏗️ Architecture Overview

```



**Backend**:

```bash```└──────────────────────────────────────┘

cd go-backend

go mod downloadmatic-platform/

```

├── go-backend/                    # Go API server              │### Current Architecture (Supabase Direct + FastAPI Hybrid)

#### 5. Start Development Servers

│   ├── main.go                   # Application entry point

**Terminal 1** - Backend:

```bash│   ├── .env                      # Environment configuration              ▼

cd go-backend

go run main.go│   ├── config/

```

│   │   └── config.go            # Config loader┌──────────────────────────────────────┐```

**Terminal 2** - Frontend:

```bash│   ├── database/

npm run dev

```│   │   └── database.go          # GORM connection│         BACKEND API                  │┌─────────────────────────────────────────────────────────────┐



#### 6. Access the Application│   ├── models/



- **Frontend**: http://localhost:3000│   │   └── models.go            # 13 database models│      Go + Gin Framework              ││                        FRONTEND                              │

- **Backend API**: http://localhost:8000/api/v1

- **Health Check**: http://localhost:8000/health│   ├── handlers/



---│   │   ├── workspaces.go        # Workspace CRUD│       (localhost:8000)               ││                    Next.js 14 App Router                     │



## 📁 Project Structure│   │   ├── request_hubs.go      # Request Hub CRUD



```│   │   ├── data_tables.go       # Table CRUD│                                      ││                      (Vercel Hosted)                         │

matic-platform/

││   │   └── forms.go             # Form CRUD

├── 📂 go-backend/                    # Go API Server

│   ├── main.go                      # Application entry point│   └── router/│  Routes:                             │└─────────────────────────────────────────────────────────────┘

│   ├── .env                         # Environment variables (not in git)

│   ├── .env.example                 # Environment template│       └── router.go            # API routes

│   ├── go.mod                       # Go dependencies

│   ├── go.sum                       # Dependency checksums││  - /api/v1/workspaces               │                            │

│   │

│   ├── 📂 config/                   # Configuration├── src/                          # Next.js frontend

│   │   └── config.go               # Load env vars

│   ││   ├── app/                     # App Router pages│  - /api/v1/request-hubs             │                ┌───────────┴───────────┐

│   ├── 📂 database/                 # Database layer

│   │   └── database.go             # GORM connection & setup│   │   ├── scan/               # Barcode scanner

│   │

│   ├── 📂 models/                   # Data models│   │   ├── workspaces/         # Workspace list│  - /api/v1/tables                   │                │                       │

│   │   └── models.go               # 13 GORM models

│   ││   │   ├── workspace/[slug]/   # Workspace detail

│   ├── 📂 handlers/                 # Request handlers

│   │   ├── workspaces.go           # Workspace CRUD│   │   ├── login/              # Authentication│  - /api/v1/forms                    │        READ OPERATIONS          WRITE OPERATIONS

│   │   ├── request_hubs.go         # Request hub CRUD + tabs

│   │   ├── data_tables.go          # Table & row CRUD│   │   └── signup/             # Registration

│   │   └── forms.go                # Form & submission CRUD

│   ││   ││  - /health                          │         (Supabase Direct)        (FastAPI Backend)

│   └── 📂 router/                   # Routing

│       └── router.go               # API routes & middleware│   ├── components/              # React components

│

├── 📂 src/                          # Next.js Frontend│   │   ├── NavigationLayout.tsx└──────────────────────────────────────┘                │                       │

│   ├── 📂 app/                      # Next.js 14 App Router

│   │   ├── layout.tsx              # Root layout│   │   ├── WorkspaceTabProvider.tsx

│   │   ├── page.tsx                # Home page

│   │   ├── globals.css             # Global styles│   │   ├── TabBar/              │                ▼                       ▼

│   │   ├── providers.tsx           # React context providers

│   │   ││   │   └── Tables/

│   │   ├── 📂 login/               # Authentication

│   │   │   └── page.tsx│   │              ▼┌─────────────────────────┐  ┌──────────────────────┐

│   │   │

│   │   ├── 📂 signup/              # Registration│   ├── lib/

│   │   │   └── page.tsx

│   │   ││   │   ├── api/                 # API clients (call Go backend)┌──────────────────────────────────────┐│  Supabase PostgreSQL    │  │   FastAPI + SQLAlchemy│

│   │   ├── 📂 workspaces/          # Workspace list

│   │   │   └── page.tsx│   │   │   ├── workspaces-client.ts

│   │   │

│   │   ├── 📂 workspace/           # Workspace detail│   │   │   ├── request-hubs-client.ts│      DATABASE                        ││  - Row Level Security   │  │   (Render Hosted)     │

│   │   │   └── [slug]/

│   │   │       └── page.tsx│   │   │   ├── data-tables-client.ts

│   │   │

│   │   └── 📂 scan/                # Barcode scanner│   │   │   ├── forms-client.ts│   PostgreSQL (Supabase)              ││  - Real-time Updates    │  │   - Complex Logic     │

│   │       └── page.tsx

│   ││   │   │   └── pulse-client.ts

│   ├── 📂 components/               # React components

│   │   ├── NavigationLayout.tsx    # Main app shell│   │   ││   - 18 core tables                   ││  - Instant Queries      │  │   - Validation        │

│   │   ├── WorkspaceTabProvider.tsx # Tab state management

│   │   ├── TabContentRouter.tsx    # Tab routing logic│   │   ├── supabase.ts         # Supabase auth client

│   │   │

│   │   ├── 📂 TabBar/              # Tab navigation│   │   └── utils.ts            # Utilities│   - Row Level Security               ││  - <100ms latency       │  │   - Transactions      │

│   │   ├── 📂 Canvas/              # Main content area

│   │   ├── 📂 Tables/              # Data table components│   │

│   │   ├── 📂 CommandPalette/      # Keyboard shortcuts

│   │   └── 📂 ModulePalette/       # Module selector│   └── types/                   # TypeScript types│   - Real-time updates                │└─────────────────────────┘  └──────────────────────┘

│   │

│   ├── 📂 lib/                      # Utilities & helpers│       ├── data-tables.ts

│   │   ├── supabase.ts             # Supabase client

│   │   ├── utils.ts                # Helper functions│       ├── workspaces.ts└──────────────────────────────────────┘```

│   │   ├── tab-manager.ts          # Tab persistence

│   │   ││       └── scan-history.ts

│   │   ├── 📂 api/                 # API clients

│   │   │   ├── workspaces-client.ts│```

│   │   │   ├── request-hubs-client.ts

│   │   │   ├── data-tables-client.ts├── docs/                        # Documentation

│   │   │   ├── forms-client.ts

│   │   │   └── pulse-client.ts│   └── archive/                # Historical docs### Read Operations (Supabase Direct) ⚡

│   │   │

│   │   └── 📂 search/              # Search functionality│

│   │       └── hybrid-search-engine.ts

│   │├── migrations/                  # Database migrations---- **Scanner barcode matching**: `rowsSupabase.searchByBarcode()`

│   ├── 📂 types/                    # TypeScript definitions

│   │   ├── data-tables.ts├── 001_initial_schema.sql      # Complete database schema

│   │   ├── workspaces.ts

│   │   ├── scan-history.ts└── README.md                   # This file- **Table metadata**: `tablesSupabase.get()`

│   │   └── index.ts

│   │```

│   ├── 📂 hooks/                    # Custom React hooks

│   │   ├── useWorkspaceDiscovery.ts## 🛠️ Tech Stack- **Workspace list**: `workspacesSupabase.list()`

│   │   └── useBarcodeScanning.ts

│   │---

│   └── 📂 ui-components/            # shadcn/ui components

│       ├── button.tsx- **Scan history**: `scanHistoryAPI.list()`

│       ├── card.tsx

│       ├── dialog.tsx## 🔌 API Endpoints

│       ├── input.tsx

│       ├── dropdown-menu.tsx### Frontend- **Row queries**: `rowsSupabase.list()`

│       └── ... (20+ components)

│### Health Check

├── 📂 public/                       # Static assets

│   ├── favicon.ico- `GET /health` - Server health status- **Framework**: Next.js 14.2.5 (App Router)

│   └── images/

│

├── 📂 migrations/                   # Database migrations

│   └── (future migration files)### Workspaces- **Language**: TypeScript 5.x**Performance**: <100ms (20-50x faster than FastAPI)

│

├── 📂 docs/                         # Documentation- `GET /api/v1/workspaces` - List all workspaces

│   ├── 📂 archive/                 # Historical docs

│   └── (API docs, guides)- `POST /api/v1/workspaces` - Create workspace- **Styling**: Tailwind CSS 3.4

│

├── 001_initial_schema.sql          # Database schema- `GET /api/v1/workspaces/:id` - Get workspace

├── .env.local.example              # Frontend env template

├── .gitignore                      # Git ignore rules- `PATCH /api/v1/workspaces/:id` - Update workspace- **UI Components**: shadcn/ui### Write Operations (FastAPI) 🛡️

├── next.config.js                  # Next.js configuration

├── tailwind.config.ts              # Tailwind CSS config- `DELETE /api/v1/workspaces/:id` - Delete workspace

├── tsconfig.json                   # TypeScript config

├── package.json                    # Frontend dependencies- **State**: React hooks, Context API- **Row updates**: Data integrity, audit trails

└── README.md                       # This file

```### Request Hubs



---- `GET /api/v1/request-hubs` - List all hubs- **Auth**: Supabase Auth (JWT tokens)- **FormBuilder**: Complex multi-step logic



## 🔌 API Reference- `POST /api/v1/request-hubs` - Create hub



### Base URL- `GET /api/v1/request-hubs/:hub_id` - Get hub- **Workspace creation**: Transaction handling

```

http://localhost:8000/api/v1- `PATCH /api/v1/request-hubs/:hub_id` - Update hub

```

- `DELETE /api/v1/request-hubs/:hub_id` - Delete hub### Backend

### Authentication

All endpoints require a Supabase JWT token in the Authorization header:- `GET /api/v1/request-hubs/:hub_id/tabs` - List tabs

```

Authorization: Bearer <your-jwt-token>- `POST /api/v1/request-hubs/:hub_id/tabs` - Create tab- **Language**: Go 1.21+**Why**: Ensures validation, consistency, proper error handling

```

- `PATCH /api/v1/request-hubs/:hub_id/tabs/:tab_id` - Update tab

### Endpoints

- `DELETE /api/v1/request-hubs/:hub_id/tabs/:tab_id` - Delete tab- **Framework**: Gin v1.10.0

#### Health Check

```http- `POST /api/v1/request-hubs/:hub_id/tabs/reorder` - Reorder tabs

GET /health

```- **ORM**: GORM v1.25.12---

Returns server status.

### Data Tables

---

- `GET /api/v1/tables` - List all tables- **Database Driver**: PostgreSQL (pgx)

#### Workspaces

- `POST /api/v1/tables` - Create table

| Method | Endpoint | Description |

|--------|----------|-------------|- `GET /api/v1/tables/:id` - Get table- **CORS**: gin-contrib/cors## 🛠️ Tech Stack

| `GET` | `/workspaces` | List all workspaces for authenticated user |

| `POST` | `/workspaces` | Create new workspace |- `PATCH /api/v1/tables/:id` - Update table

| `GET` | `/workspaces/:id` | Get workspace by ID |

| `PATCH` | `/workspaces/:id` | Update workspace |- `DELETE /api/v1/tables/:id` - Delete table- **Config**: godotenv

| `DELETE` | `/workspaces/:id` | Delete workspace |

- `GET /api/v1/tables/:id/rows` - List rows

**Example Request**:

```bash- `POST /api/v1/tables/:id/rows` - Create row### Frontend

curl -X POST http://localhost:8000/api/v1/workspaces \

  -H "Authorization: Bearer <token>" \- `PATCH /api/v1/tables/:id/rows/:row_id` - Update row

  -H "Content-Type: application/json" \

  -d '{- `DELETE /api/v1/tables/:id/rows/:row_id` - Delete row### Database- **Framework**: Next.js 14.2.5 (App Router)

    "name": "Marketing Team",

    "slug": "marketing",

    "description": "Marketing workspace"

  }'### Forms- **Provider**: Supabase (PostgreSQL 15)- **Language**: TypeScript 5.x

```

- `GET /api/v1/forms` - List all forms

---

- `POST /api/v1/forms` - Create form- **Connection**: Direct (port 5432 with IPv4 add-on)- **Styling**: Tailwind CSS 3.4

#### Request Hubs

- `GET /api/v1/forms/:id` - Get form

| Method | Endpoint | Description |

|--------|----------|-------------|- `PATCH /api/v1/forms/:id` - Update form- **Schema**: 18 tables (organizations, workspaces, tables, forms, etc.)- **UI Components**: shadcn/ui

| `GET` | `/request-hubs` | List all request hubs |

| `POST` | `/request-hubs` | Create new hub |- `DELETE /api/v1/forms/:id` - Delete form

| `GET` | `/request-hubs/by-slug/:slug` | Get hub by slug |

| `GET` | `/request-hubs/:hub_id` | Get hub by ID |- `GET /api/v1/forms/:id/submissions` - List submissions- **State**: React hooks, Context API

| `PATCH` | `/request-hubs/:hub_id` | Update hub |

| `DELETE` | `/request-hubs/:hub_id` | Delete hub |- `POST /api/v1/forms/:id/submit` - Submit form

| `GET` | `/request-hubs/:hub_id/tabs` | List tabs |

| `POST` | `/request-hubs/:hub_id/tabs` | Create tab |---- **Real-time**: Supabase Realtime

| `PATCH` | `/request-hubs/:hub_id/tabs/:tab_id` | Update tab |

| `DELETE` | `/request-hubs/:hub_id/tabs/:tab_id` | Delete tab |**Total**: 32 endpoints (all reads AND writes)

| `POST` | `/request-hubs/:hub_id/tabs/reorder` | Reorder tabs |

- **Hosting**: Vercel

---

---

#### Data Tables

## 📁 Project Structure

| Method | Endpoint | Description |

|--------|----------|-------------|## 💻 Development

| `GET` | `/tables` | List all tables |

| `POST` | `/tables` | Create new table |### Backend

| `GET` | `/tables/:id` | Get table with columns |

| `PATCH` | `/tables/:id` | Update table |### Backend Development

| `DELETE` | `/tables/:id` | Delete table |

| `GET` | `/tables/:id/rows` | List table rows |```- **Database**: PostgreSQL (Supabase)

| `POST` | `/tables/:id/rows` | Create row |

| `PATCH` | `/tables/:id/rows/:row_id` | Update row |```bash

| `DELETE` | `/tables/:id/rows/:row_id` | Delete row |

cd go-backendmatic-platform/- **API (Optional)**: FastAPI + SQLAlchemy 2.0 async (Render)

---



#### Forms

# Install dependencies├── go-backend/                    # Go API server- **Auth**: Supabase Auth (JWT tokens)

| Method | Endpoint | Description |

|--------|----------|-------------|go mod download

| `GET` | `/forms` | List all forms |

| `POST` | `/forms` | Create new form |│   ├── main.go                   # Application entry point- **Security**: Row Level Security (RLS)

| `GET` | `/forms/:id` | Get form with fields |

| `PATCH` | `/forms/:id` | Update form |# Run server (with hot reload using air)

| `DELETE` | `/forms/:id` | Delete form |

| `GET` | `/forms/:id/submissions` | List submissions |go install github.com/cosmtrek/air@latest│   ├── .env                      # Environment configuration- **Real-time**: Supabase Realtime (postgres_changes)

| `POST` | `/forms/:id/submit` | Submit form response |

air

---

│   ├── config/

**Total**: 32 RESTful endpoints

# Or run directly

For complete API documentation with request/response examples, see the [API Documentation](docs/API.md) (coming soon).

go run main.go│   │   └── config.go            # Config loader### Scanner

---



## 💻 Development

# Build for production│   ├── database/- **Library**: @zxing/browser

### Running in Development Mode

go build -o matic-server main.go

#### Backend (with auto-reload)

./matic-server│   │   └── database.go          # GORM connection- **Formats**: All standard barcodes (EAN, UPC, Code128, QR, etc.)

Install Air for hot reloading:

```bash```

go install github.com/cosmtrek/air@latest

```│   ├── models/- **Features**: Auto-focus, torch, device switching



Run with Air:### Frontend Development

```bash

cd go-backend│   │   └── models.go            # 13 database models

air

``````bash



Or run directly:# Development server│   ├── handlers/---

```bash

cd go-backendnpm run dev

go run main.go

```│   │   ├── workspaces.go        # Workspace CRUD



#### Frontend (with hot reload)# Type checking



```bashnpm run type-check│   │   ├── request_hubs.go      # Request Hub CRUD## 📁 Project Structure

npm run dev

```



### Available Scripts# Linting│   │   ├── data_tables.go       # Table CRUD



**Frontend**:npm run lint

```bash

npm run dev          # Start development server│   │   └── forms.go             # Form CRUD```

npm run build        # Build for production

npm run start        # Start production server# Build for production

npm run lint         # Run ESLint

npm run type-check   # TypeScript type checkingnpm run build│   └── router/matic-platform/

```

npm run start

**Backend**:

```bash```│       └── router.go            # API routes├── src/

go run main.go       # Run server

go build -o server   # Build binary

go test ./...        # Run tests

go mod tidy          # Clean dependencies### Environment Variables││   ├── app/                          # Next.js 14 App Router

```



### Code Style & Formatting

**Backend** (`go-backend/.env`):├── src/                          # Next.js frontend│   │   ├── scan/                     # 📱 Barcode scanner page

**Go**:

```bash```bash

go fmt ./...         # Format code

go vet ./...         # Vet codeDATABASE_URL=postgresql://user:password@host:5432/database│   ├── app/                     # App Router pages│   │   ├── scan-results/             # 📊 Scan history viewer

```

PORT=8000

**TypeScript/JavaScript**:

```bashGIN_MODE=debug│   │   ├── scan/               # Barcode scanner│   │   ├── workspaces/               # 🏢 Workspace list

npm run lint         # ESLint

npm run lint:fix     # Auto-fix issuesCORS_ORIGINS=http://localhost:3000,https://your-frontend.vercel.app

```

SUPABASE_URL=https://your-project.supabase.co│   │   ├── workspaces/         # Workspace list│   │   ├── workspace/[slug]/         # 📋 Workspace detail

### Adding New Features

SUPABASE_ANON_KEY=your-anon-key

1. **Create a new branch**:

   ```bashSUPABASE_SERVICE_ROLE_KEY=your-service-role-key│   │   ├── workspace/[slug]/   # Workspace detail│   │   ├── login/                    # 🔐 Authentication

   git checkout -b feature/your-feature-name

   ``````



2. **Backend changes**:│   │   ├── login/              # Authentication│   │   └── signup/                   # ✍️ Registration

   - Add model in `go-backend/models/models.go`

   - Create handler in `go-backend/handlers/`**Frontend** (`.env.local`):

   - Add routes in `go-backend/router/router.go`

```bash│   │   └── signup/             # Registration│   │

3. **Frontend changes**:

   - Add API client in `src/lib/api/`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

   - Create types in `src/types/`

   - Build UI components in `src/components/`NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key│   ││   ├── components/                   # React components



4. **Test your changes**:NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

   ```bash

   # Backend```│   ├── components/              # React components│   │   ├── NavigationLayout.tsx      # Main app shell

   cd go-backend && go test ./...

   

   # Frontend

   npm run type-check---│   │   ├── NavigationLayout.tsx│   │   ├── WorkspaceTabProvider.tsx  # Tab system

   npm run lint

   ```



5. **Commit and push**:## 🗄️ Database Schema│   │   ├── WorkspaceTabProvider.tsx│   │   ├── TabBar/                   # Tab navigation

   ```bash

   git add .

   git commit -m "feat: add your feature"

   git push origin feature/your-feature-name### Core Tables│   │   ├── TabBar/│   │   ├── Canvas/                   # Main content area

   ```

- **organizations** - Top-level tenants

---

- **workspaces** - Project containers within orgs│   │   └── Tables/│   │   └── Tables/                   # Data table components

## 🚀 Deployment

- **workspace_members** - User access control

### Backend Deployment

- **data_tables** - Table definitions│   ││   │

#### Option 1: Docker

- **table_columns** - Column schemas (20+ types)

Create `Dockerfile` in `go-backend/`:

```dockerfile- **table_rows** - Data stored as JSONB│   ├── lib/│   ├── lib/

FROM golang:1.21-alpine AS builder

WORKDIR /app- **table_views** - View configurations (grid, kanban, etc.)

COPY go.* ./

RUN go mod download- **table_links** - Cross-table relationships│   │   ├── api/                 # API clients (call Go backend)│   │   ├── api/                      # API clients

COPY . .

RUN go build -o main .- **forms** - Form definitions



FROM alpine:latest- **form_fields** - Form field configurations│   │   │   ├── workspaces-client.ts│   │   │   ├── scan-history-client.ts   # ✅ Supabase Direct

RUN apk --no-cache add ca-certificates

WORKDIR /root/- **form_submissions** - Form responses

COPY --from=builder /app/main .

EXPOSE 8000- **request_hubs** - Request management hubs│   │   │   ├── request-hubs-client.ts│   │   │   ├── tables-supabase.ts       # ✅ Supabase Direct

CMD ["./main"]

```- **request_hub_tabs** - Hub tab configurations



Build and run:- **scan_history** - Barcode scan records│   │   │   ├── data-tables-client.ts│   │   │   ├── workspaces-supabase.ts   # ✅ Supabase Direct

```bash

docker build -t matic-backend .

docker run -p 8000:8000 --env-file .env matic-backend

```### Setup│   │   │   ├── forms-client.ts│   │   │   ├── rows-supabase.ts         # ✅ Supabase Direct



#### Option 2: Render.comRun `001_initial_schema.sql` in your Supabase SQL Editor to set up the complete database schema.



1. Push code to GitHub│   │   │   └── pulse-client.ts│   │   │   ├── data-tables-client.ts    # ⚠️ FastAPI (writes)

2. Create new **Web Service** on [Render](https://render.com)

3. Connect your repository---

4. Configure:

   - **Root Directory**: `go-backend`│   │   ││   │   │   ├── forms-client.ts          # ⚠️ FastAPI (complex)

   - **Build Command**: (auto-detected)

   - **Start Command**: `./main`## ✨ Features

5. Add environment variables from `.env`

6. Deploy!│   │   ├── supabase.ts         # Supabase auth client│   │   │   └── workspaces-client.ts     # ⚠️ FastAPI (writes)



#### Option 3: Fly.io### 📱 Barcode Scanner



```bash- Real-time scanning with @zxing/browser│   │   └── utils.ts            # Utilities│   │   │

fly launch --name matic-backend

fly deploy- Auto-matching against table data

```

- Mobile-optimized with camera controls│   ││   │   ├── supabase.ts               # Supabase client config

### Frontend Deployment

- Scan history tracking

#### Vercel (Recommended)

│   └── types/                   # TypeScript types│   │   ├── tab-manager.ts            # Tab persistence

1. Push code to GitHub

2. Import project on [Vercel](https://vercel.com)### 📊 Data Tables (Airtable-like)

3. Configure:

   - **Framework Preset**: Next.js- 20+ column types (text, number, select, date, etc.)│       ├── data-tables.ts│   │   └── utils.ts                  # Utility functions

   - **Root Directory**: `./`

4. Add environment variables:- 6 view types (grid, kanban, calendar, gallery, timeline, form)

   ```

   NEXT_PUBLIC_SUPABASE_URL- Linked records and relationships│       ├── workspaces.ts│   │

   NEXT_PUBLIC_SUPABASE_ANON_KEY

   NEXT_PUBLIC_API_URL (your deployed backend URL)- Formula calculations

   ```

5. Deploy!- Real-time collaboration│       └── scan-history.ts│   ├── types/                        # TypeScript definitions



Auto-deployments on every push to `main`:

```bash

git push origin main### 📝 Forms││   │   ├── data-tables.ts

```

- Drag-and-drop form builder

#### Manual Build

- Conditional logic├── docs/                        # Documentation│   │   ├── scan-history.ts

```bash

npm run build- Custom validation

npm run start

```- Form submissions linked to tables│   └── archive/                # Historical docs│   │   └── workspaces.ts



---



## ⚙️ Configuration### 🏢 Workspaces││   │



### Environment Variables- Multi-workspace organization



#### Frontend (`.env.local`)- Team collaboration├── migrations/                  # Database migrations│   └── ui-components/                # shadcn/ui components



| Variable | Description | Required |- Role-based access control

|----------|-------------|----------|

| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ |- Custom branding (icons, colors)├── 001_initial_schema.sql      # Complete database schema│       ├── button.tsx

| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |

| `NEXT_PUBLIC_API_URL` | Backend API base URL | ✅ |



#### Backend (`go-backend/.env`)### 🔍 Request Hubs└── README.md                   # This file│       ├── card.tsx



| Variable | Description | Required |- Centralized request management

|----------|-------------|----------|

| `DATABASE_URL` | PostgreSQL connection string | ✅ |- Multi-tab organization```│       ├── dialog.tsx

| `PORT` | Server port (default: 8000) | ✅ |

| `GIN_MODE` | `debug` or `release` | ✅ |- Custom workflows

| `CORS_ORIGINS` | Allowed origins (comma-separated) | ✅ |

| `SUPABASE_URL` | Supabase project URL | ✅ |│       └── ...

| `SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |

| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ⚠️ |---



### Database Configuration---│



**Connection String Format**:## 🚀 Deployment

```

postgresql://postgres:password@db.your-project.supabase.co:5432/postgres├── backend/                          # FastAPI backend (optional)

```

### Backend (Docker/Render/Fly.io)

**Important Notes**:

- Use **port 5432** (direct connection, not pooler)## 🔌 API Endpoints│   ├── app/

- Enable **IPv4 add-on** in Supabase if needed

- Avoid special characters in passwords (or use URL encoding)**Dockerfile** (create in `go-backend/`):



### CORS Configuration```dockerfile│   │   ├── main.py                   # FastAPI app



Edit `go-backend/router/router.go`:FROM golang:1.21-alpine AS builder

```go

config := cors.DefaultConfig()WORKDIR /app### Health Check│   │   ├── routers/                  # API endpoints

config.AllowOrigins = strings.Split(cfg.CORSOrigins, ",")

```COPY go.* ./



Add production domains to `CORS_ORIGINS` in `.env`.RUN go mod download- `GET /health` - Server health status│   │   ├── models/                   # SQLAlchemy models



---COPY . .



## 🗄️ Database SchemaRUN go build -o main .│   │   └── schemas/                  # Pydantic schemas



### Core Tables



| Table | Description | Relationships |FROM alpine:latest### Workspaces│   │

|-------|-------------|---------------|

| `organizations` | Top-level tenants | → workspaces |RUN apk --no-cache add ca-certificates

| `workspaces` | Project containers | → data_tables, forms, request_hubs |

| `workspace_members` | User access control | ← users, workspaces |WORKDIR /root/- `GET /api/v1/workspaces` - List all workspaces│   └── requirements.txt              # Python dependencies

| `data_tables` | Table definitions | → table_columns, table_rows |

| `table_columns` | Column schemas | ← data_tables |COPY --from=builder /app/main .

| `table_rows` | Data (JSONB) | ← data_tables |

| `table_views` | View configurations | ← data_tables |EXPOSE 8000- `POST /api/v1/workspaces` - Create workspace│

| `table_links` | Cross-table relationships | ← data_tables |

| `table_row_links` | Row-to-row links | ← table_rows |CMD ["./main"]

| `forms` | Form definitions | → form_fields |

| `form_fields` | Field configurations | ← forms |```- `GET /api/v1/workspaces/:id` - Get workspace├── setup_complete_rls.sql            # 🔒 Complete RLS setup

| `form_submissions` | Form responses | ← forms |

| `form_table_connections` | Form-to-table links | ← forms, data_tables |

| `request_hubs` | Hub definitions | → request_hub_tabs |

| `request_hub_tabs` | Tab configurations | ← request_hubs |**Deploy to Render**:- `PATCH /api/v1/workspaces/:id` - Update workspace└── README.md                         # This file

| `scan_history` | Barcode scan records | ← workspaces |

1. Connect GitHub repo

### Column Types Supported

2. Select `go-backend` directory- `DELETE /api/v1/workspaces/:id` - Delete workspace```

Text, Number, Select, Multi-Select, Date, DateTime, Checkbox, URL, Email, Phone, Attachment, User, Lookup, Rollup, Formula, Autonumber, Rating, Duration, Currency, Progress

3. Build command: (automatic for Go)

### Schema Management

4. Start command: `./main`

The database schema is managed via SQL file:

```bash5. Add environment variables from `.env.example`

# Run in Supabase SQL Editor

001_initial_schema.sql### Request Hubs---

```

### Frontend (Vercel)

Future migrations will be added to the `migrations/` directory.

- `GET /api/v1/request-hubs` - List all hubs

---

```bash

## 🐛 Troubleshooting

# Auto-deploy on push to main- `POST /api/v1/request-hubs` - Create hub## ✨ Features

### Common Issues

git push origin main

#### Backend won't start

- `GET /api/v1/request-hubs/:hub_id` - Get hub

**Problem**: `dial tcp: connection refused`

# Manual deploy

**Solution**:

1. Check `DATABASE_URL` formatvercel --prod- `PATCH /api/v1/request-hubs/:hub_id` - Update hub### 📱 Barcode Scanner

2. Verify Supabase is accessible

3. Test connection: `psql "<your-database-url>"````



---- `DELETE /api/v1/request-hubs/:hub_id` - Delete hub- **Real-time scanning**: Instant barcode/QR code recognition



**Problem**: `port 8000 already in use`Set environment variables in Vercel dashboard:



**Solution**:- `NEXT_PUBLIC_SUPABASE_URL`- `GET /api/v1/request-hubs/:hub_id/tabs` - List tabs- **Auto-matching**: Searches table data automatically

```bash

# Find process using port 8000- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

lsof -i :8000

- `NEXT_PUBLIC_API_URL` (your deployed Go backend URL)- `POST /api/v1/request-hubs/:hub_id/tabs` - Create tab- **Mobile optimized**: Camera controls, torch support

# Kill the process

kill -9 <PID>

```

---- `PATCH /api/v1/request-hubs/:hub_id/tabs` - Update tab- **Offline capable**: Works without network

---



#### Frontend can't connect to backend

## 🔐 Security- `DELETE /api/v1/request-hubs/:hub_id/tabs` - Delete tab- **History tracking**: Records all scans with timestamps

**Problem**: CORS errors in browser console



**Solution**:

1. Add frontend URL to `CORS_ORIGINS` in backend `.env`### Authentication- `POST /api/v1/request-hubs/:hub_id/tabs/reorder` - Reorder tabs- **Desktop view**: Review scan history with search/filter

2. Restart backend server

3. Clear browser cache- Supabase Auth with JWT tokens



---- Token passed via `Authorization: Bearer <token>` header



**Problem**: `API_URL not defined`- Frontend handles auth with `@supabase/ssr`



**Solution**:### Data Tables**Performance**: <100ms barcode match (vs 2-5s with old architecture)

1. Check `.env.local` has `NEXT_PUBLIC_API_URL`

2. Restart Next.js dev server### Authorization

3. Ensure variable starts with `NEXT_PUBLIC_`

- Row Level Security (RLS) in PostgreSQL- `GET /api/v1/tables` - List all tables

---

- Workspace-based access control

#### Database connection errors

- Backend validates user permissions via GORM- `POST /api/v1/tables` - Create table### 📊 Data Tables (Airtable-like)

**Problem**: `SASL authentication failed`



**Solution**:

1. Verify password is correct### CORS- `GET /api/v1/tables/:id` - Get table- **20+ column types**: Text, number, select, date, checkbox, etc.

2. Check for special characters (use URL encoding if needed)

3. Ensure using port **5432**, not 6543- Configured in `go-backend/router/router.go`



---- Add production frontend URL to `CORS_ORIGINS` env var- `PATCH /api/v1/tables/:id` - Update table- **6 view types**: Grid, kanban, calendar, gallery, timeline, form



**Problem**: IPv6 connection refused



**Solution**:---- `DELETE /api/v1/tables/:id` - Delete table- **Relationships**: Lookup, rollup, linked records

1. Enable **IPv4 add-on** in Supabase dashboard

2. Use direct connection (port 5432)



---## 🐛 Troubleshooting- `GET /api/v1/tables/:id/rows` - List rows- **Formulas**: Excel-like calculations



#### GORM migration errors



**Problem**: `constraint does not exist`### Backend won't start- `POST /api/v1/tables/:id/rows` - Create row- **Real-time collaboration**: See changes instantly



**Solution**:- Check `DATABASE_URL` format: `postgresql://user:password@host:5432/database`

- Tables created via SQL have different constraint names

- Server skips auto-migration by default- Verify database is accessible (try `psql` connection)- `PATCH /api/v1/tables/:id/rows` - Update row

- This is expected behavior - no action needed

- Check port 8000 is not in use: `lsof -i :8000`

---

- `DELETE /api/v1/tables/:id/rows` - Delete row### 📝 Forms

### Getting Help

### Frontend can't connect to backend

1. Check this README thoroughly

2. Review [closed issues](https://github.com/Jsanchez767/matic-platform/issues?q=is%3Aissue+is%3Aclosed)- Verify `NEXT_PUBLIC_API_URL` is correct- **Form builder**: Drag-and-drop interface

3. Check browser console for errors

4. Check backend logs for errors- Check CORS settings in backend

5. Open a new issue with:

   - Error message- Inspect browser console for errors### Forms- **Conditional logic**: Show/hide fields

   - Steps to reproduce

   - Environment details



---### Database connection errors- `GET /api/v1/forms` - List all forms- **Validation**: Built-in + custom rules



## 🤝 Contributing- Ensure Supabase IPv4 add-on is enabled (if needed)



### Development Workflow- Check password doesn't have special characters requiring encoding- `POST /api/v1/forms` - Create form- **Submissions**: Store responses in tables



1. **Fork the repository**- Verify direct connection port (5432) not pooler port (6543)

2. **Clone your fork**:

   ```bash- `GET /api/v1/forms/:id` - Get form- **Embeddable**: Share forms via link

   git clone https://github.com/YOUR_USERNAME/matic-platform.git

   ```### GORM migration errors

3. **Create a feature branch**:

   ```bash- Tables already exist from SQL schema - this is normal- `PATCH /api/v1/forms/:id` - Update form

   git checkout -b feature/amazing-feature

   ```- Server skips auto-migration by default

4. **Make your changes**

5. **Test thoroughly**:- Schema is managed via `001_initial_schema.sql`- `DELETE /api/v1/forms/:id` - Delete form### 🏢 Workspaces

   ```bash

   # Backend tests

   cd go-backend && go test ./...

   ---- `GET /api/v1/forms/:id/submissions` - List submissions- **Multi-workspace**: Separate data silos

   # Frontend checks

   npm run type-check

   npm run lint

   ```## 📖 Learn More- `POST /api/v1/forms/:id/submit` - Submit form- **Team collaboration**: Invite members

6. **Commit with conventional commits**:

   ```bash

   git commit -m "feat: add amazing feature"

   ```- [Go Documentation](https://go.dev/doc/)- **Role-based access**: Owner, admin, member, viewer

   

   Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`- [Gin Framework](https://gin-gonic.com/)



7. **Push to your fork**:- [GORM](https://gorm.io/)**Total**: 32 endpoints- **Customization**: Icons, colors, descriptions

   ```bash

   git push origin feature/amazing-feature- [Next.js Documentation](https://nextjs.org/docs)

   ```

8. **Open a Pull Request**- [Supabase Documentation](https://supabase.com/docs)



### Code Guidelines



- **Go**: Follow standard Go formatting (`go fmt`)---------

- **TypeScript**: Use ESLint configuration

- **Commits**: Use conventional commit messages

- **Tests**: Write tests for new features

- **Documentation**: Update README for major changes## 🤝 Contributing



---



## 📄 License1. Create feature branch: `git checkout -b feature/my-feature`## 💻 Development## 🗄️ Database Setup



**Private/Proprietary** - All rights reserved2. Make changes and test locally



This is a private project. Unauthorized copying, distribution, or use is prohibited.3. Commit: `git commit -m "Add my feature"`



---4. Push: `git push origin feature/my-feature`



## 🙏 Acknowledgments5. Create Pull Request### Backend Development### Schema Overview



- **[Gin](https://gin-gonic.com/)** - Fast HTTP web framework for Go

- **[GORM](https://gorm.io/)** - Fantastic ORM for Go

- **[Next.js](https://nextjs.org/)** - The React framework for production---

- **[Supabase](https://supabase.com/)** - Open source Firebase alternative

- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful UI components

- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework

- **[ZXing](https://github.com/zxing-js/library)** - Barcode scanning library## 📝 License```bash**Core Hierarchy**:



---



## 📞 Contact & SupportPrivate/Proprietary - All rights reservedcd go-backend```



- **Repository**: [github.com/Jsanchez767/matic-platform](https://github.com/Jsanchez767/matic-platform)

- **Issues**: [GitHub Issues](https://github.com/Jsanchez767/matic-platform/issues)

- **Documentation**: [docs/](docs/)---organizations → workspaces → tables/forms → rows/submissions



---



<div align="center">**Last Updated**: November 7, 2024  # Install dependencies```



**Built with ❤️ using Go and Next.js****Version**: 3.0.0 (Go Backend Complete - All Operations)



⭐ Star this repo if you find it useful!go mod download



**Version 3.0.0** | Last Updated: November 7, 2024**Main Tables**:



</div># Run server (with hot reload using air)- `organizations` - Top-level tenants


go install github.com/cosmtrek/air@latest- `workspaces` - Project containers

air- `workspace_members` - User access control

- `data_tables` - Table definitions

# Or run directly- `table_columns` - Column schemas (20+ types)

go run main.go- `table_rows` - Data stored as JSONB

- `table_views` - View configurations

# Build for production- `forms` - Form definitions

go build -o matic-server main.go- `form_submissions` - Form responses

./matic-server- `scan_history` - Scanner records

```

### RLS (Row Level Security)

### Frontend Development

All tables use RLS policies based on workspace membership:

```bash

# Development server```sql

npm run dev-- Example: Users can only see their workspace data

CREATE POLICY "workspace_access" ON table_rows

# Type checkingFOR SELECT USING (

npm run type-check  table_id IN (

    SELECT id FROM data_tables 

# Linting    WHERE workspace_id IN (

npm run lint      SELECT workspace_id FROM workspace_members 

      WHERE user_id = auth.uid()

# Build for production    )

npm run build  )

npm run start);

``````



### Environment Variables**Setup**: Run `setup_complete_rls.sql` in Supabase SQL Editor



**Backend** (`go-backend/.env`):---

```bash

DATABASE_URL=postgresql://user:password@host:5432/database## 💻 Development

PORT=8000

GIN_MODE=debug### Local Development

CORS_ORIGINS=http://localhost:3000,https://your-frontend.vercel.app

SUPABASE_URL=https://your-project.supabase.co```bash

SUPABASE_ANON_KEY=your-anon-key# Frontend

SUPABASE_SERVICE_ROLE_KEY=your-service-role-keynpm run dev          # Start Next.js on localhost:3000

```

# Backend (optional - for writes)

**Frontend** (`.env.local`):cd backend

```bashsource .venv/bin/activate

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.couvicorn app.main:app --reload --port 8000

NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key```

NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

```### Environment Variables



---```bash

# .env.local

## 🗄️ Database SchemaNEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

### Core Tables

- **organizations** - Top-level tenants# Optional - for FastAPI writes

- **workspaces** - Project containers within orgsNEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api

- **workspace_members** - User access control```

- **data_tables** - Table definitions

- **table_columns** - Column schemas (20+ types)### Key Commands

- **table_rows** - Data stored as JSONB

- **table_views** - View configurations (grid, kanban, etc.)```bash

- **table_links** - Cross-table relationshipsnpm run dev          # Development server

- **forms** - Form definitionsnpm run build        # Production build

- **form_fields** - Form field configurationsnpm run start        # Production server

- **form_submissions** - Form responsesnpm run lint         # ESLint

- **request_hubs** - Request management hubsnpm run type-check   # TypeScript check

- **request_hub_tabs** - Hub tab configurations```

- **scan_history** - Barcode scan records

---

### Setup

Run `001_initial_schema.sql` in your Supabase SQL Editor to set up the complete database schema.## 🚀 Deployment



---### Frontend (Vercel)



## ✨ Features```bash

# Auto-deploy on git push to main

### 📱 Barcode Scannergit push origin main

- Real-time scanning with @zxing/browser

- Auto-matching against table data# Manual deploy

- Mobile-optimized with camera controlsvercel --prod

- Scan history tracking```



### 📊 Data Tables (Airtable-like)**Environment**: Set Supabase env vars in Vercel dashboard

- 20+ column types (text, number, select, date, etc.)

- 6 view types (grid, kanban, calendar, gallery, timeline, form)### Backend (Render) - Optional

- Linked records and relationships

- Formula calculations1. Create new Web Service on Render

- Real-time collaboration2. Connect GitHub repo

3. Build command: `pip install -r requirements.txt`

### 📝 Forms4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

- Drag-and-drop form builder5. Add env var: `DATABASE_URL` (Supabase connection string)

- Conditional logic

- Custom validation### Database (Supabase)

- Form submissions linked to tables

1. Run `setup_complete_rls.sql` in SQL Editor

### 🏢 Workspaces2. Enable Realtime for tables:

- Multi-workspace organization   - Go to Database → Replication

- Team collaboration   - Enable for: `scan_history`, `table_rows`, `data_tables`

- Role-based access control

- Custom branding (icons, colors)---



### 🔍 Request Hubs## ⚡ Performance

- Centralized request management

- Multi-tab organization### Before Supabase Direct Migration

- Custom workflows

| Operation | Latency | Notes |

---|-----------|---------|-------|

| Scanner load | 2-5s | Render cold start |

## 🚀 Deployment| Barcode match | 1-3s | API roundtrip |

| Workspace list | 1-3s | Backend query |

### Backend (Docker/Render/Fly.io)| Scan results | 3-7s | Wake + query |



**Dockerfile** (create in `go-backend/`):### After Supabase Direct Migration

```dockerfile

FROM golang:1.21-alpine AS builder| Operation | Latency | Improvement |

WORKDIR /app|-----------|---------|-------------|

COPY go.* ./| Scanner load | <100ms | **20-50x faster** ⚡ |

RUN go mod download| Barcode match | <100ms | **10-30x faster** ⚡ |

COPY . .| Workspace list | <100ms | **10-30x faster** ⚡ |

RUN go build -o main .| Scan results | <150ms | **20-47x faster** ⚡ |



FROM alpine:latest**Key Wins**:

RUN apk --no-cache add ca-certificates- ✅ Zero cold starts

WORKDIR /root/- ✅ No backend wake-up delays

COPY --from=builder /app/main .- ✅ Direct database queries

EXPOSE 8000- ✅ RLS security built-in

CMD ["./main"]- ✅ Real-time updates native

```

---

**Deploy to Render**:

1. Connect GitHub repo## 📚 Migration History

2. Select `go-backend` directory

3. Build command: (automatic for Go)### Phase 1: Initial Architecture (Supabase Direct Only)

4. Start command: `./main`- Frontend queries Supabase directly

5. Add environment variables from `.env.example`- Simple but lacked backend validation

- No complex transaction support

### Frontend (Vercel)

### Phase 2: FastAPI Migration (Attempted)

```bash- Moved all queries to FastAPI backend

# Auto-deploy on push to main- Hit pgBouncer prepared statement errors

git push origin main- 2-5s cold starts on Render free tier

- Poor user experience

# Manual deploy

vercel --prod### Phase 3: Hybrid Architecture (Current) ✅

```- **Reads**: Supabase Direct (instant, <100ms)

- **Writes**: FastAPI (validation, transactions)

Set environment variables in Vercel dashboard:- Best of both worlds

- `NEXT_PUBLIC_SUPABASE_URL`- 20-50x performance improvement

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- `NEXT_PUBLIC_API_URL` (your deployed Go backend URL)### Migration Details



---**Migrated to Supabase Direct**:

- ✅ Scanner barcode matching (`rowsSupabase.searchByBarcode()`)

## 🔐 Security- ✅ Table metadata queries (`tablesSupabase.get()`)

- ✅ Workspace list (`workspacesSupabase.list()`)

### Authentication- ✅ Scan history (`scanHistoryAPI` - Supabase)

- Supabase Auth with JWT tokens- ✅ Row queries (`rowsSupabase.list()`)

- Token passed via `Authorization: Bearer <token>` header

- Frontend handles auth with `@supabase/ssr`**Kept on FastAPI**:

- ⚠️ Row updates (data integrity)

### Authorization- ⚠️ FormBuilder (complex logic)

- Row Level Security (RLS) in PostgreSQL- ⚠️ Workspace creation (transactions)

- Workspace-based access control

- Backend validates user permissions**Files Created**:

- `src/lib/api/tables-supabase.ts`

### CORS- `src/lib/api/workspaces-supabase.ts`

- Configured in `go-backend/router/router.go`- `src/lib/api/rows-supabase.ts`

- Add production frontend URL to `CORS_ORIGINS` env var- `src/lib/api/scan-history-client.ts` (migrated)

- `setup_complete_rls.sql` (all RLS policies)

---

---

## 🐛 Troubleshooting

## 🔐 Security

### Backend won't start

- Check `DATABASE_URL` format: `postgresql://user:password@host:5432/database`### Authentication

- Verify database is accessible (try `psql` connection)- **Provider**: Supabase Auth

- Check port 8000 is not in use: `lsof -i :8000`- **Method**: Email/password (JWT tokens)

- **Session**: Stored in browser

### Frontend can't connect to backend- **Expiry**: 1 hour (auto-refresh)

- Verify `NEXT_PUBLIC_API_URL` is correct

- Check CORS settings in backend### Authorization

- Inspect browser console for errors- **Method**: Row Level Security (RLS)

- **Scope**: Workspace-based

### Database connection errors- **Enforcement**: Database-level (can't bypass)

- Ensure Supabase IPv4 add-on is enabled (if needed)- **Pattern**: User → workspace_members → workspace_id → data

- Check password doesn't have special characters requiring encoding

- Verify direct connection port (5432) not pooler port (6543)### Data Protection

- All tables use RLS policies

---- Users can only access their workspace data

- Authenticated role required for all queries

## 📖 Learn More- Service role for admin operations only



- [Go Documentation](https://go.dev/doc/)---

- [Gin Framework](https://gin-gonic.com/)

- [GORM](https://gorm.io/)## 🐛 Troubleshooting

- [Next.js Documentation](https://nextjs.org/docs)

- [Supabase Documentation](https://supabase.com/docs)### "Permission denied for table X"

**Solution**: Run `setup_complete_rls.sql` in Supabase

---

### "No rows returned" despite data existing

## 🤝 Contributing**Solution**: Check `workspace_members` table - ensure user is a member



1. Create feature branch: `git checkout -b feature/my-feature`### Scanner not working

2. Make changes and test locally**Solution**: 

3. Commit: `git commit -m "Add my feature"`- Check camera permissions in browser

4. Push: `git push origin feature/my-feature`- Ensure HTTPS (required for camera access)

5. Create Pull Request- Try different browser



---### Real-time not updating

**Solution**:

## 📝 License- Check Replication settings in Supabase

- Verify table is in `supabase_realtime` publication

Private/Proprietary - All rights reserved- Check browser console for connection errors



---### Slow queries

**Solution**:

**Last Updated**: November 7, 2024  - Verify RLS policies are efficient

**Version**: 3.0.0 (Go Backend Complete)- Add indexes on frequently queried columns

- Check Supabase logs for slow queries

---

## 📖 API Reference

### Supabase Direct Clients

#### tables-supabase.ts
```typescript
// Get table with columns
const table = await tablesSupabase.get(tableId)

// List all workspace tables
const tables = await tablesSupabase.list(workspaceId)

// Get column by name
const column = await tablesSupabase.getColumnByName(tableId, columnName)
```

#### rows-supabase.ts
```typescript
// Search by barcode
const matches = await rowsSupabase.searchByBarcode(tableId, columnId, barcode)

// List all rows
const rows = await rowsSupabase.list(tableId, { limit: 100, archived: false })

// Get single row
const row = await rowsSupabase.get(tableId, rowId)

// Search by column name
const results = await rowsSupabase.searchByColumnName(tableId, columnName, value)
```

#### workspaces-supabase.ts
```typescript
// List user's workspaces
const workspaces = await workspacesSupabase.list()

// Get workspace by ID
const workspace = await workspacesSupabase.get(workspaceId)

// Get by slug
const workspace = await workspacesSupabase.getBySlug(slug, orgId)
```

#### scan-history-client.ts
```typescript
// Create scan record
const scan = await scanHistoryAPI.create({
  workspace_id, table_id, barcode, status, ...
})

// List scans
const scans = await scanHistoryAPI.list({
  tableId, columnName, limit: 100
})
```

---

## 🎯 Roadmap

### Current Features ✅
- ✅ Barcode scanner with instant matching
- ✅ Scan history tracking
- ✅ Multi-workspace support
- ✅ Real-time updates
- ✅ Mobile-responsive UI

### In Progress 🚧
- 🚧 FormBuilder (using FastAPI)
- 🚧 Data table views (grid, kanban, etc.)
- 🚧 Advanced column types

### Planned 📋
- 📋 Multiplayer collaboration (live cursors)
- 📋 Import/export (CSV, Excel)
- 📋 API webhooks
- 📋 Automation rules
- 📋 Custom permissions

### Future Considerations 💭
- 💭 PartyKit for real-time collaboration
- 💭 Edge Functions for serverless logic
- 💭 Full FastAPI decommission
- 💭 AI-powered features

---

## 🤝 Contributing

This is a private project, but if you have access:

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes
3. Test locally
4. Commit: `git commit -m "Add my feature"`
5. Push: `git push origin feature/my-feature`
6. Create Pull Request

---

## 📝 License

Private/Proprietary - All rights reserved

---

## 📞 Support

For questions or issues:
- Check this README first
- Review `FASTAPI_DECOMMISSION_GUIDE.md` for architecture details
- Check Supabase logs for errors
- Review browser console for frontend issues

---

## 🎉 Acknowledgments

- **shadcn/ui** for beautiful components
- **Supabase** for amazing backend-as-a-service
- **Vercel** for seamless deployments
- **ZXing** for barcode scanning library

---

**Last Updated**: October 22, 2025  
**Version**: 2.0.0 (Supabase Direct Migration Complete)
