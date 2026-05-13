# Architecture Documentation

## Overview

MIS-IS (Management Information System - Inventory System) is a Laravel 12 + Inertia.js + React application for managing IT assets including hardware, software, parts, printers, CCTV systems, and issuances.

## Technology Stack

| Layer | Technology |
|-------|------------|
| Backend | Laravel 12 (PHP 8.2+) |
| Frontend | React 18 + Inertia.js |
| UI Components | Shadcn UI (Radix primitives) |
| Styling | Tailwind CSS |
| Build Tool | Vite |
| Testing | Pest PHP |
| Database | MySQL |

## Project Structure

```
mis-is/
├── app/
│   ├── Constants/           # Status enums and constants
│   ├── Http/
│   │   ├── Controllers/     # Request handlers
│   │   ├── Middleware/      # Auth, API token handling
│   │   ├── Requests/        # Form request validation
│   │   └── Resources/       # API resource transformers
│   ├── Models/              # Eloquent models
│   ├── Repositories/        # Data access layer
│   ├── Services/            # Business logic
│   ├── Traits/              # Reusable traits
│   └── Providers/           # Service providers
├── resources/js/
│   ├── Components/          # React components
│   │   ├── drawer/          # Form drawers
│   │   ├── sidebar/         # Navigation components
│   │   └── ui/              # Shadcn UI components
│   ├── Config/              # App configuration
│   ├── Hooks/               # Custom React hooks
│   ├── Layouts/             # Page layouts
│   ├── Pages/               # Inertia page components
│   │   ├── Admin/           # Admin pages
│   │   ├── Authentication/  # Login page
│   │   ├── Dashboard/       # Dashboard & charts
│   │   └── Inventory/       # Inventory tables
│   ├── Store/               # Zustand state stores
│   └── Utils/               # Utility functions
├── routes/
│   ├── api/                 # API endpoints
│   └── web.php              # Web routes
└── config/                  # Laravel configuration
```

## Design Patterns

### Service-Repository Pattern
- **Services**: Contain business logic, orchestrate operations
- **Repositories**: Handle data access, queries, and database operations
- Example: `HardwareService` → `HardwareRepository` → `Hardware` model

### Resource Pattern
- API responses transformed via Laravel Resources
- Example: `HardwareResource`, `HardwareSoftwareResource`, `HardwarePartResource`

### State Management
- **Zustand** for frontend state (see `resources/js/store/`)
- Used for: software list, parts data

## Module Overview

### Core Modules

| Module | Purpose |
|--------|---------|
| **Hardware** | Track IT equipment (laptops, desktops, etc.) |
| **Software** | License management and software inventory |
| **Parts** | Spare parts inventory |
| **Printer** | Printer management |
| **CCTV** | CCTV camera inventory |
| **Issuance** | Asset assignment to employees |
| **Locations** | Physical location management |
| **Dashboard** | Analytics and summaries |

### Key Entities

- `Hardware`: Main asset table
- `HardwarePart`: Parts assigned to hardware
- `HardwareSoftware`: Software installed on hardware
- `Issuance`: Asset issuances to users
- `SoftwareInventory`: Available software
- `SoftwareLicense`: License tracking
- `PartInventory`: Spare parts stock

## Authentication & Authorization

- **Breeze** for authentication (login, registration, password reset)
- **Middleware**: `AuthMiddleware`, `AdminMiddleware`, `ApiTokenMiddleware`
- Role-based access via `UserRoleService`

## API Structure

| Endpoint | Description |
|----------|-------------|
| `/api/hardware` | Hardware CRUD |
| `/api/software` | Software management |
| `/api/parts` | Parts inventory |
| `/api/issuance` | Issuance records |
| `/api/printer` | Printer management |
| `/api/cctv` | CCTV management |
| `/api/dashboard` | Dashboard data |
| `/api/locations` | Location data |

## Database Notes

- Primary system table: `admin` (requires manual creation from `System_Tables.sql`)
- Uses Eloquent ORM with soft deletes on most models
- Timestamps: `created_date`, `last_updated`, `last_updated_by`, `deleted_at`

## Build & Run

```bash
# Install dependencies
composer install
npm install

# Setup environment
cp .env.example .env
php artisan key:generate

# Run development server
composer run dev

# Run tests
composer test
```
