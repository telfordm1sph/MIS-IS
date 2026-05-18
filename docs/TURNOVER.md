# Turnover Documentation

## Overview

MIS-IS is a Laravel 12 + Inertia.js + React inventory management system for IT assets. It connects to multiple internal company databases (primary MySQL, QA, Masterlist, Authify SSO). This document covers everything a new developer needs to get started, understand the system, and begin contributing.

---

## Onboarding Checklist for New Developer

### 1. Prerequisites

Ensure you have the following installed:

- PHP 8.2+
- Composer
- Node.js 18+ and npm
- MySQL
- Git

### 2. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd mis-is

# Install PHP dependencies
composer install

# Install Node dependencies
npm install
```

### 3. Environment Setup

```bash
# Create environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

Then open `.env` and configure:

```env
APP_NAME=mis               # Route prefix: all web routes are /{APP_NAME}/...
APP_URL=http://localhost:8000

# Primary database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=mis_inventory
DB_USERNAME=root
DB_PASSWORD=

# External databases (get credentials from senior dev)
QA_DB_HOST=
QA_DB_DATABASE=

MASTERLIST_DB_HOST=
MASTERLIST_DB_DATABASE=

# SSO (Authify) — internal network only
# No direct config needed — host is hardcoded in AuthMiddleware

SESSION_DRIVER=database
SANCTUM_STATEFUL_DOMAINS=localhost

# API token for external system access
INVENTORY_API_TOKEN=your-token-here
```

### 4. Database Setup

> **CRITICAL**: The `admin` table is **not** in migrations. You must create it manually first.

```bash
# Step 1: Import the admin table (do this BEFORE migrations)
mysql -u root -p your_database < System_Tables.sql

# Step 2: Run all migrations
php artisan migrate
```

### 5. Running the Application

```bash
# Development — runs all services (PHP + Vite) concurrently
composer run dev

# Or run separately:
php artisan serve          # Backend on http://localhost:8000
npm run dev                # Vite frontend dev server
```

### 6. Access the Application

Navigate to: `http://localhost:8000/{APP_NAME}/`

Authentication uses the company SSO (Authify) system. On the internal network, pass `?key={token}` or use an active Authify session cookie. If Authify is unavailable locally, ask a senior dev for a test session workaround.

---

## Key Files & Locations

| What You Need        | Where To Find It                                                       |
| -------------------- | ---------------------------------------------------------------------- |
| Add new web route    | `routes/web.php` (registers sub-files) or create `routes/mymodule.php` |
| Add new API route    | `routes/api/apiMyModule.php` and register in `routes/api.php`          |
| Add new model        | `app/Models/`                                                          |
| Add new repository   | `app/Repositories/`                                                    |
| Add new service      | `app/Services/`                                                        |
| Add new controller   | `app/Http/Controllers/`                                                |
| Add new migration    | `php artisan make:migration create_xxx_table`                          |
| Add status constants | `app/Constants/`                                                       |
| Add API resource     | `app/Http/Resources/`                                                  |
| Add frontend page    | `resources/js/Pages/`                                                  |
| Add shared component | `resources/js/Components/`                                             |
| Add custom hook      | `resources/js/Hooks/`                                                  |
| Add global state     | `resources/js/store/`                                                  |
| Frontend utilities   | `resources/js/Utils/`                                                  |
| Page layouts         | `resources/js/Layouts/`                                                |
| Theme/sidebar config | `resources/js/Components/sidebar/Navigation.jsx`                       |

---

## Understanding the Architecture

### Request Flow (Web)

```
Browser Request
    ↓
AuthMiddleware
    ├── Validates SSO token (Authify)
    ├── Checks maintenance mode
    └── Sets emp_data in session
    ↓
Controller (validates input)
    ↓
Service (business logic)
    ↓
Repository (database queries)
    ↓
Model (Eloquent)
    ↓
Inertia::render('PageName', $data)
    ↓
React Page Component (receives props)
```

### Request Flow (API)

```
External System / Frontend Axios call
    ↓
ApiTokenMiddleware
    ├── Internal host? → bypass token check
    └── External? → validate Bearer token from INVENTORY_API_TOKEN
    ↓
Controller (validates input)
    ↓
Service → Repository → Model
    ↓
HardwareResource / JSON response
```

### Frontend Architecture

```
Inertia Page (Pages/*.jsx)
    ↓
useXxxHook (custom hooks in Hooks/)
    │   ├── Axios calls to /api/...
    │   └── Manages loading/error state
    ↓
Component (Components/...)
    │   ├── DataTable.jsx (main table)
    │   ├── Drawer components (forms)
    │   └── Modal components (confirmations)
    ↓
Zustand Store (store/)  ← for shared state across components
```

---

## Common Tasks

### Adding a New Inventory Module

Follow these steps for a full end-to-end module (e.g., "Peripherals"):

**1. Database migration**

```bash
php artisan make:migration create_peripherals_table
```

**2. Model** — `app/Models/Peripheral.php`

```php
class Peripheral extends Model {
    use SoftDeletes, Loggable;
    protected $table = 'peripherals';
    protected $fillable = [...];
}
```

**3. Repository** — `app/Repositories/PeripheralRepository.php`

- Methods: `getTable(array $filters)`, `create()`, `update()`, `delete()`

**4. Service** — `app/Services/PeripheralService.php`

- Methods: `getPeripheralTable()`, `create()`, `update()`, `delete()`, `getLogs()`

**5. Controller** — `app/Http/Controllers/PeripheralController.php`

- Inject `PeripheralService` via constructor
- Methods: `getPeripheralTable(Request)`, `store(Request)`, `update(Request, $id)`, `destroy($id)`, `getLogs(Request, $id)`

**6. Web routes** — `routes/peripheral.php`

```php
Route::middleware(['auth'])->group(function () {
    Route::get('/{appName}/peripherals', [PeripheralController::class, 'getPeripheralTable']);
    Route::post('/{appName}/peripherals', [PeripheralController::class, 'store']);
    Route::put('/{appName}/peripherals/{id}', [PeripheralController::class, 'update']);
    Route::delete('/{appName}/peripherals/{id}', [PeripheralController::class, 'destroy']);
    Route::get('/{appName}/peripherals/{id}/logs', [PeripheralController::class, 'getLogs']);
});
```

**7. Register routes** — `routes/web.php`

```php
require __DIR__.'/peripheral.php';
```

**8. React page** — `resources/js/Pages/Inventory/PeripheralTable.jsx`

- Follow the pattern from `PartsTable.jsx` or `PrinterTable.jsx`

**9. Add to sidebar** — `resources/js/Components/sidebar/Navigation.jsx`

### Adding a New API Endpoint

1. Create `routes/api/apiPeripheral.php`
2. Register in `routes/api.php` under the `api.token` middleware group
3. Add controller in `app/Http/Controllers/Api/` if separate from web controller

### Modifying an Existing Module

Always follow the service-repository chain. Do NOT query the database directly in controllers.

```
// WRONG — direct DB in controller
$hardware = Hardware::where('status', 'active')->get();

// CORRECT — go through the service
$hardware = $this->hardwareService->getHardwareTable($filters);
```

### Adding a Status Constant

Edit the relevant file in `app/Constants/`:

```php
// app/Constants/Status.php
const MY_NEW_STATUS = 5;

const LABELS = [
    self::ACTIVE => 'Active',
    self::MY_NEW_STATUS => 'My New Status',  // Add here
];

const COLORS = [
    self::MY_NEW_STATUS => 'gray',  // Add here
];
```

### Adding Activity Logging to a Model

Use the `Loggable` trait:

```php
use App\Traits\Loggable;

class MyModel extends Model {
    use Loggable;
    // All saves/deletes will now be logged to activity_logs
}
```

### Adding a New Admin Role Check

Route-level protection uses `AdminMiddleware`. For more granular role checks, use `UserRoleService`.

---

## Frontend Patterns

### Fetching Data (API call in hook)

```javascript
// resources/js/Hooks/useMyData.js
import { useState, useEffect } from "react";
import axios from "axios";

export function useMyData(filters) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        axios
            .get("/api/my-endpoint", { params: filters })
            .then((res) => setData(res.data))
            .finally(() => setLoading(false));
    }, [filters]);

    return { data, loading };
}
```

### CRUD Operations Pattern

Use `useCrudOperations` hook — it handles store/update/delete with toast feedback.

### Cascading Dropdowns (Parts / Software)

Use the pre-built components:

- `CascadingPartFields.jsx` — Part type → Brand → Model → Specification
- `CascadingSoftwareFields.jsx` — Software → Version → License key

These fetch options from `/api/hardware/parts-options/{filters}` and `/api/hardware/software-options/{filters}`.

### Table Pattern

All inventory tables follow this structure:

```
Page.jsx
  → InventoryHeaderWithFilters.jsx  (search + filter controls)
  → DataTable.jsx                   (main table with pagination)
  → FormDrawer.jsx                  (create/edit side panel)
  → ActivityLogsModal.jsx           (view logs)
  → DeleteConfirm.jsx               (delete confirmation)
```

### Zustand Store Usage

```javascript
// Reading store
import { usePartsStore } from "@/store/usePartsStore";
const { parts, fetchParts } = usePartsStore();

// Zustand stores are used for data shared across multiple components
// (e.g., parts list used in both the table and the hardware form drawer)
```

---

## Database Connections

The application uses 4 database connections defined in `config/database.php`:

| Connection   | Used By                                     | Purpose                |
| ------------ | ------------------------------------------- | ---------------------- |
| `mysql`      | Most models (Hardware, Parts, etc.)         | Primary inventory data |
| `qa`         | Locations, Departments, Stations, Prodlines | Reference data         |
| `masterlist` | User, Masterlist                            | Employee records       |
| `authify`    | AuthMiddleware                              | SSO session validation |

When writing queries that need to cross databases, use the explicit connection model:

```php
$locations = Locations::on('qa')->where(...)->get();
```

---

## Authentication Notes

### SSO Integration (Authify)

- Auth is handled by the company's Authify system at `192.168.2.221:8200`
- The `AuthMiddleware` validates a token from: query param (`?key=`), cookie, or session
- Only users with department = `MIS` and active status can log in
- Token is stored in a cookie for 7 days

### Admin Access

- Admin users are tracked in the `admin` table (created from `System_Tables.sql`)
- Admin middleware (`AdminMiddleware`) protects routes like `/admin`
- Admins can: add/remove other admins, change roles

### API Access

- External systems call `/api/...` with `Authorization: Bearer {INVENTORY_API_TOKEN}`
- Internal requests (same host as APP_URL) bypass token validation automatically

---

## Known Quirks & Notes

1. **Admin Table** — Must be created manually from `System_Tables.sql` before running `php artisan migrate`. It is not in migrations.

2. **APP_NAME as Route Prefix** — All web routes are prefixed with `/{APP_NAME}`. If APP_NAME is `mis`, routes are at `/mis/hardware`, `/mis/admin`, etc.

3. **Multi-Database Models** — When models have `protected $connection = 'qa'`, they query an external database. If that DB is unavailable, those features will fail. Get connection strings from a senior dev.

4. **Soft Deletes** — Most models use `SoftDeletes`. Deleted records are NOT removed; they get a `deleted_at` timestamp. Use `withTrashed()` to include them in queries.

5. **No Timestamps on Issuance** — The `issuance` table uses `timestamps = false` and only has `created_at`. Do not call `updated_at` on issuance records.

6. **Duplicate Backup Files** — Files like `DataTableService copy.php` are backup files and not used. Ignore them.

7. **API vs Web Routes** — CCTV, Printer, and Issuance CUD operations go through API routes (with token auth), not web routes. Hardware does the same. Parts, Software, and Licenses use web routes for their CUD operations.

8. **Cascading Part/Software Dropdowns** — These use a filter-chaining pattern. The frontend sends the currently-selected values as URL params, and the API returns only valid next-step options. See `HardwareDetailController@partsOptions` and `HardwareDetailController@softwareOptions`.

9. **Issuance Number Format** — Issuance numbers follow `ISS-YYYY-XXXX` (e.g., `ISS-2026-0042`). They are generated by `IssuanceService@generateIssuanceNumber()` using the last existing number.

10. **Component Maintenance vs Whole Unit Issuance** — Issuance type 1 = assigning a whole hardware unit to a user. Type 2 = batch component maintenance (replacing/adding/removing parts with a formal paper trail).

---

## Testing

```bash
# Run all tests
composer test

# Run a specific test file
php artisan test --filter=HardwareHostnameTest

# Run with coverage (if Xdebug installed)
php artisan test --coverage
```

Tests are written with **Pest PHP** and live in `tests/`. Follow existing test patterns for new modules.

---

## Troubleshooting

| Issue                                    | Solution                                                                                            |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Blank page after login                   | Check `APP_URL` in `.env` matches your host exactly                                                 |
| Redirected to `/unauthorized`            | Your user account's department is not `MIS`, or emp_from is not active in Authify                   |
| API 401 errors                           | Check `INVENTORY_API_TOKEN` in `.env` matches what the calling system sends                         |
| Database connection error                | Verify all 4 DB connection strings in `.env`. QA and Masterlist DBs require internal network access |
| Assets not loading in production         | Run `npm run build` — Vite dev server is not used in production                                     |
| `admin` table missing                    | Import `System_Tables.sql` manually before running migrations                                       |
| Maintenance mode stuck                   | Call `POST /{APP_NAME}/system-status/online` or update the `system_status` table directly           |
| Parts/software cascading dropdowns empty | Check that PartInventory and SoftwareInventory tables have data                                     |
| Issuance numbers not incrementing        | Check `issuance` table for existing records; `generateIssuanceNumber()` reads the last one          |

---

## Project Contacts

_To be updated with current team contacts_

---

## External Dependencies Summary

### Backend (Composer)

| Package                          | Purpose                         |
| -------------------------------- | ------------------------------- |
| `laravel/framework ^12.0`        | Core framework                  |
| `inertiajs/inertia-laravel ^2.0` | Inertia.js SSR bridge           |
| `laravel/sanctum ^4.0`           | API auth helpers                |
| `tightenco/ziggy ^2.0`           | Pass Laravel routes to frontend |
| `pestphp/pest ^3.8`              | Testing framework               |
| `laravel/pint ^1.13`             | PHP code style fixer            |

### Frontend (npm)

| Package                 | Purpose                                |
| ----------------------- | -------------------------------------- |
| `react ^18.2`           | UI library                             |
| `@inertiajs/react ^2.0` | Inertia React adapter                  |
| `tailwindcss ^3.2`      | Utility-first CSS                      |
| `zustand ^5.0`          | State management                       |
| `react-hook-form ^7.71` | Form state management                  |
| `zod ^4.3`              | Schema validation                      |
| `axios ^1.10`           | HTTP client                            |
| `recharts ^2.15`        | Chart library (dashboard)              |
| `chart.js ^4.5`         | Chart library (alternative charts)     |
| `lucide-react ^0.555`   | Icon library                           |
| `sonner ^2.0`           | Toast notifications                    |
| `framer-motion ^12.34`  | Animations                             |
| `dayjs ^1.11`           | Date manipulation                      |
| `lodash ^4.17`          | Utility functions                      |
| `@radix-ui/*`           | Accessible UI primitives (Shadcn base) |
| `daisyui ^5.0`          | Tailwind component plugin              |
| `antd ^6.0`             | Ant Design component library           |
| `cmdk ^1.1`             | Command palette                        |
| `uuid ^13.0`            | UUID generation                        |
