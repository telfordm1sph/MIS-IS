# Architecture Documentation

## Overview

MIS-IS (Management Information System - Inventory System) is a **Laravel 12 + Inertia.js + React** application for managing IT assets including hardware, software, parts, printers, CCTV systems, and issuances. It integrates with multiple company-internal databases (Authify SSO, QA, and Masterlist) for authentication and reference data.

---

## Technology Stack

| Layer             | Technology                               | Version       |
| ----------------- | ---------------------------------------- | ------------- |
| Backend Framework | Laravel                                  | 12 (PHP 8.2+) |
| Frontend Library  | React                                    | 18.2          |
| Full-Stack Bridge | Inertia.js                               | 2.0           |
| Styling           | Tailwind CSS                             | 3.2           |
| UI Components     | Shadcn UI (Radix primitives), Ant Design | —             |
| Build Tool        | Vite                                     | 6.2           |
| Testing           | Pest PHP                                 | 3.8           |
| Database          | MySQL                                    | —             |
| State Management  | Zustand                                  | 5.0           |
| Form Handling     | React Hook Form + Zod                    | —             |
| Charts            | Recharts, Chart.js                       | —             |
| Animations        | Framer Motion                            | —             |
| Icons             | Lucide React                             | —             |
| Notifications     | Sonner / React Hot Toast                 | —             |

---

## Project Directory Structure

```
mis-is/
├── app/
│   ├── Constants/               # Status enums and constants
│   ├── Http/
│   │   ├── Controllers/         # Request handlers (grouped by domain)
│   │   │   ├── Api/             # API-only controllers
│   │   │   └── General/         # Web-only controllers (Admin, Profile)
│   │   ├── Middleware/          # Auth, API token, Admin guards
│   │   ├── Requests/            # Form request validation
│   │   └── Resources/           # API JSON response transformers
│   ├── Models/                  # Eloquent ORM models
│   ├── Repositories/            # Data access layer (database queries)
│   ├── Services/                # Business logic and orchestration
│   ├── Traits/                  # Reusable traits (Loggable)
│   └── Providers/               # Laravel service providers
│
├── resources/js/
│   ├── Components/              # Shared React components
│   │   ├── drawer/              # Side panel / drawer components
│   │   ├── forms/               # Cascading field components
│   │   ├── inventory/           # Table header, badges, log modals
│   │   ├── modal/               # Confirmation modals
│   │   ├── sidebar/             # Navigation and sidebar
│   │   └── ui/                  # Shadcn UI primitives
│   ├── Config/                  # Frontend configuration (pagination, item config)
│   ├── Hooks/                   # Custom React hooks
│   ├── Layouts/                 # Page layouts (authenticated, guest)
│   ├── Pages/                   # Inertia page components
│   │   ├── Admin/               # Admin management pages
│   │   ├── Authentication/      # Login page
│   │   ├── Dashboard/           # Dashboard, charts, summaries
│   │   └── Inventory/           # All inventory tables
│   ├── store/                   # Zustand global state stores
│   └── Utils/                   # Utility functions (date, columns)
│
├── routes/
│   ├── web.php                  # Main web route registration
│   ├── auth.php                 # Auth routes (logout, system status)
│   ├── general.php              # Dashboard, admin, profile routes
│   ├── hardware.php             # Hardware web routes
│   ├── parts.php                # Parts web routes
│   ├── software.php             # Software + licenses web routes
│   ├── printer.php              # Printer web routes
│   ├── cctv.php                 # CCTV web routes
│   └── api/                     # API route files
│       ├── apiHardware.php
│       ├── apiPrinter.php
│       ├── apicctv.php
│       ├── apiIssuance.php
│       ├── apiEmp.php
│       ├── apiLocations.php
│       └── apiDashboard.php
│
├── database/migrations/         # Database schema definitions
├── config/                      # Laravel configuration files
└── tests/                       # Pest PHP tests
```

---

## Design Patterns

### Service-Repository Pattern

All domain logic flows through a strict layered architecture:

```
HTTP Request
    ↓
Middleware (Auth, ApiToken, Admin)
    ↓
Controller  ← validates input
    ↓
Service     ← business logic, orchestration
    ↓
Repository  ← database queries, data access
    ↓
Model       ← Eloquent ORM, relationships
    ↓
Database (MySQL)
```

**Example — Hardware Update:**

```
PUT /api/hardware/{id}/update
    → ApiTokenMiddleware (validates bearer token)
    → HardwareController@update (validates input)
    → HardwareUpdateService@updateHardware (orchestrates update + inventory changes)
    → HardwareRepository (query/persist)
    → Hardware model (Eloquent)
```

### API Resource Pattern

API responses are consistently formatted via Laravel Resources:

- `HardwareResource` — resolves status labels, colors, department/location names, nested parts/software/users
- `HardwarePartResource` — formats parts data
- `HardwareSoftwareResource` — formats software data

### Frontend State Strategy

| State Type          | Solution                       |
| ------------------- | ------------------------------ |
| Server/remote data  | Inertia.js props + Axios fetch |
| Global shared state | Zustand stores                 |
| Local UI state      | React `useState`/`useReducer`  |
| Form state          | React Hook Form + Zod schemas  |

---

## Authentication & Authorization Flow

### SSO Authentication (Web Requests)

```
User visits /{APP_NAME}/...
    ↓
AuthMiddleware
    ├── Checks for token: ?key= param → Cookie → Session
    ├── Validates token against Authify DB (192.168.2.221:8200)
    ├── Checks user department = MIS and emp_from = active
    ├── Checks system maintenance mode
    │       → If maintenance: redirect to /maintenance (unless exempt route)
    ├── Stores emp_data in session
    └── Sets persistent cookie (7 days)
```

### API Token Authentication (API Requests)

```
External system calls /api/...
    ↓
ApiTokenMiddleware
    ├── If request is internal (same host as APP_URL) → bypass token check
    ├── Reads Authorization: Bearer {token} header
    ├── Validates against config('api.token') from INVENTORY_API_TOKEN env
    └── Returns 401 Unauthorized if invalid
```

### Admin Authorization

```
User accesses /{APP_NAME}/admin
    ↓
AuthMiddleware → AdminMiddleware
    ├── Looks up user in admin table
    └── Redirects to dashboard if not found
```

---

## Multi-Database Architecture

The system connects to **4 databases** simultaneously:

| Connection   | Purpose                    | Key Tables                                          |
| ------------ | -------------------------- | --------------------------------------------------- |
| `mysql`      | Primary inventory database | hardware, parts, issuance, software, printers, cctv |
| `qa`         | External reference data    | location_list, departments, prodlines, stations     |
| `masterlist` | Employee records           | employee_masterlist                                 |
| `authify`    | SSO session storage        | sessions/tokens (external)                          |

Models declare their connection explicitly:

```php
protected $connection = 'qa';       // Locations, Departments
protected $connection = 'masterlist'; // User, Masterlist
protected $connection = 'mysql';     // Default (Hardware, Parts, etc.)
```

---

## Module Overview

### Core Inventory Modules

| Module        | Web Route         | API Prefix       | Purpose                                         |
| ------------- | ----------------- | ---------------- | ----------------------------------------------- |
| **Hardware**  | `/{APP}/hardware` | `/api/hardware`  | IT equipment tracking (laptops, desktops, etc.) |
| **Parts**     | `/{APP}/parts`    | —                | Spare parts inventory management                |
| **Software**  | `/{APP}/software` | —                | Software inventory management                   |
| **Licenses**  | `/{APP}/licenses` | —                | Software license key tracking                   |
| **Printers**  | `/{APP}/printers` | `/api/printer`   | Printer asset management                        |
| **CCTV**      | `/{APP}/cctv`     | `/api/cctv`      | CCTV camera inventory                           |
| **Issuance**  | —                 | `/api/issuance`  | Asset assignment to employees                   |
| **Locations** | `/{APP}/admin`    | `/api/locations` | Physical location management                    |
| **Dashboard** | `/{APP}/`         | `/api/dashboard` | Analytics and summaries                         |

---

## All Routes (Full Reference)

### Web Routes

All web routes require `AuthMiddleware` and are prefixed with `/{APP_NAME}`.

#### Auth Routes (`routes/auth.php`)

| Method | URI                                | Controller                            | Middleware |
| ------ | ---------------------------------- | ------------------------------------- | ---------- |
| GET    | `/{APP}/logout`                    | AuthenticationController@logout       | auth       |
| POST   | `/{APP}/system-status/online`      | SystemStatusController@setOnline      | auth       |
| POST   | `/{APP}/system-status/maintenance` | SystemStatusController@setMaintenance | auth       |
| GET    | `/{APP}/unauthorized`              | —                                     | —          |

#### General Routes (`routes/general.php`)

| Method | URI                        | Controller                       | Middleware      |
| ------ | -------------------------- | -------------------------------- | --------------- |
| GET    | `/{APP}/`                  | DashboardController@index        | auth, protected |
| GET    | `/{APP}/admin`             | AdminController@index            | auth, admin     |
| GET    | `/{APP}/new-admin`         | AdminController@index_addAdmin   | auth, admin     |
| POST   | `/{APP}/add-admin`         | AdminController@addAdmin         | auth, admin     |
| POST   | `/{APP}/remove-admin`      | AdminController@removeAdmin      | auth, admin     |
| PATCH  | `/{APP}/change-admin-role` | AdminController@changeAdminRole  | auth, admin     |
| GET    | `/{APP}/profile`           | ProfileController@index          | auth            |
| POST   | `/{APP}/change-password`   | ProfileController@changePassword | auth            |

#### Inventory Web Routes

| Method | URI                          | Controller                          |
| ------ | ---------------------------- | ----------------------------------- |
| GET    | `/{APP}/hardware`            | HardwareController@getHardwareTable |
| GET    | `/{APP}/parts`               | PartsController@getPartsTable       |
| POST   | `/{APP}/parts`               | PartsController@store               |
| PUT    | `/{APP}/parts/{id}`          | PartsController@update              |
| DELETE | `/{APP}/parts/{id}`          | PartsController@destroy             |
| GET    | `/{APP}/parts/{id}/logs`     | PartsController@getLogs             |
| GET    | `/{APP}/software`            | SoftwareController@getSoftwareTable |
| POST   | `/{APP}/software`            | SoftwareController@store            |
| PUT    | `/{APP}/software/{id}`       | SoftwareController@update           |
| DELETE | `/{APP}/software/{id}`       | SoftwareController@destroy          |
| GET    | `/{APP}/software/{id}/logs`  | SoftwareController@getLogs          |
| GET    | `/{APP}/licenses`            | LicensesController@getLicensesTable |
| POST   | `/{APP}/licenses`            | LicensesController@store            |
| PUT    | `/{APP}/licenses/{id}`       | LicensesController@update           |
| DELETE | `/{APP}/licenses/{id}`       | LicensesController@destroy          |
| GET    | `/{APP}/licenses/{id}/logs`  | LicensesController@getLogs          |
| GET    | `/{APP}/printers`            | PrinterController@getPrinterTable   |
| POST   | `/{APP}/printers/store`      | PrinterController@store             |
| PUT    | `/{APP}/printers/{id}`       | PrinterController@update            |
| DELETE | `/{APP}/printers/{id}`       | PrinterController@destroy           |
| GET    | `/{APP}/printers/{id}/parts` | PrinterController@getPrinterParts   |
| GET    | `/{APP}/printers/{id}/logs`  | PrinterController@getLogs           |
| GET    | `/{APP}/cctv`                | CCTVController@getCCTVTable         |

### API Routes

All API routes use `api.token` middleware. Prefixed with `/api`.

#### Hardware API (`/api/hardware`)

| Method | URI                                      | Controller                                        | Throttle |
| ------ | ---------------------------------------- | ------------------------------------------------- | -------- |
| GET    | `/hardware/hostnames`                    | HardwareDetailController@getHostNames             | high     |
| GET    | `/hardware/hostnames-or-serials/{type}`  | HardwareDetailController@getHostNamesOrSerial     | high     |
| GET    | `/hardware/{id}/full-details`            | HardwareDetailController@fullDetails              | high     |
| GET    | `/hardware/{id}/parts`                   | HardwareDetailController@parts                    | high     |
| GET    | `/hardware/{id}/software`                | HardwareDetailController@software                 | high     |
| GET    | `/hardware/parts-options/{filters?}`     | HardwareDetailController@partsOptions             | high     |
| GET    | `/hardware/parts-inventory/{filters?}`   | HardwareDetailController@partsInventory           | high     |
| GET    | `/hardware/software-options/{filters?}`  | HardwareDetailController@softwareOptions          | high     |
| GET    | `/hardware/software-licenses/{filters?}` | HardwareDetailController@softwareLicenses         | high     |
| GET    | `/hardware/software-inventory-options`   | HardwareDetailController@softwareInventoryOptions | high     |
| GET    | `/hardware/{id}/logs`                    | HardwareController@getLogs                        | 50/min   |
| GET    | `/hardware/parts/available`              | HardwareDetailController@availableParts           | high     |
| GET    | `/hardware/parts/all-available`          | HardwareDetailController@allAvailableParts        | high     |
| GET    | `/hardware/software/available`           | HardwareDetailController@availableSoftware        | high     |
| GET    | `/hardware/software/all-available`       | HardwareDetailController@allAvailableSoftware     | high     |
| GET    | `/hardware/hardwareApi`                  | HardwareApiController@index                       | —        |
| POST   | `/hardware/hardware/store`               | HardwareController@store                          | high     |
| PUT    | `/hardware/{id}/update`                  | HardwareController@update                         | high     |
| POST   | `/hardware/replace-component`            | HardwareController@replaceComponent               | high     |
| POST   | `/hardware/add-component`                | HardwareController@addComponent                   | high     |
| POST   | `/hardware/remove-component`             | HardwareController@removeComponent                | high     |

#### Printer API (`/api/printer`)

| Method | URI                  | Controller                |
| ------ | -------------------- | ------------------------- |
| POST   | `/printer/`          | PrinterController@store   |
| PUT    | `/printer/{id}`      | PrinterController@update  |
| DELETE | `/printer/{id}`      | PrinterController@destroy |
| GET    | `/printer/{id}/logs` | PrinterController@getLogs |

#### CCTV API (`/api/cctv`)

| Method | URI               | Controller             |
| ------ | ----------------- | ---------------------- |
| POST   | `/cctv/`          | CCTVController@store   |
| PUT    | `/cctv/{id}`      | CCTVController@update  |
| DELETE | `/cctv/{id}`      | CCTVController@destroy |
| GET    | `/cctv/{id}/logs` | CCTVController@getLogs |

#### Issuance API (`/api/issuance`)

| Method | URI                                     | Controller                                            | Throttle |
| ------ | --------------------------------------- | ----------------------------------------------------- | -------- |
| POST   | `/issuance/create`                      | IssuanceController@createIssuance                     | very-low |
| POST   | `/issuance/component/maintenance/batch` | IssuanceController@createComponentMaintenanceIssuance | very-low |
| POST   | `/issuance/table`                       | IssuanceController@getIssuanceTable                   | medium   |
| PUT    | `/issuance/acknowledge/{id}`            | IssuanceController@acknowledgeIssuance                | low      |

#### Employee/Reference API (`/api/emp`)

| Method | URI                  | Controller                        | Throttle |
| ------ | -------------------- | --------------------------------- | -------- |
| GET    | `/emp/emp-list`      | UserController@getEmployees       | high     |
| GET    | `/emp/dept-list`     | UserController@getDepartments     | high     |
| GET    | `/emp/loc-list`      | UserController@getLocationList    | high     |
| GET    | `/emp/prodline-list` | UserController@getProdlineOptions | high     |
| GET    | `/emp/station-list`  | UserController@getStationOptions  | high     |

#### Locations API (`/api/locations`)

| Method | URI                   | Controller                   |
| ------ | --------------------- | ---------------------------- |
| GET    | `/locations/`         | LocationsController@index    |
| GET    | `/locations/paginate` | LocationsController@paginate |
| GET    | `/locations/search`   | LocationsController@search   |
| GET    | `/locations/{id}`     | LocationsController@show     |
| POST   | `/locations/`         | LocationsController@store    |
| PUT    | `/locations/{id}`     | LocationsController@update   |
| DELETE | `/locations/{id}`     | LocationsController@destroy  |

#### Dashboard API (`/api/dashboard`)

| Method | URI                              | Controller                            |
| ------ | -------------------------------- | ------------------------------------- |
| GET    | `/dashboard/hardware/counts`     | DashboardController@hardwareCounts    |
| GET    | `/dashboard/hardware/chart-data` | DashboardController@hardwareChartData |
| GET    | `/dashboard/parts/counts`        | DashboardController@partsCounts       |
| GET    | `/dashboard/parts/chart-data`    | DashboardController@partsChartData    |

---

## Models & Relationships

### Hardware

- **Table:** `hardware` | **Connection:** `mysql`
- **Soft Deletes:** Yes
- **Key Fields:** hostname (UNIQUE), category, brand, model, serial_number, ip_address, wifi_mac, lan_mac, status, location, department, prodline, station, installed_by, date_issued
- **Status Enum:** active, spare, defective, disposed, in_repair, retired
- **Relationships:**
    - `parts()` → hasMany(HardwarePart)
    - `software()` → hasMany(HardwareSoftware)
    - `users()` → hasMany(HardwareUsers)
    - `installedByUser()` → belongsTo(User)
    - `activityLogs()` → morphMany(ActivityLog) via Loggable trait

### HardwarePart

- **Table:** `hardware_parts`
- **Key Fields:** hardware_id, part_type, brand, model, specifications, serial_number, slot_position, quantity, status, installed_date, removed_date, source_inventory_id
- **Status Enum:** installed, spare, removed
- **Relationships:**
    - `hardware()` → belongsTo(Hardware)
    - `sourceInventory()` → belongsTo(PartInventory)

### HardwareSoftware

- **Table:** `hardware_software`
- **Key Fields:** hardware_id, software_inventory_id, software_license_id, installation_date, installed_by, status, uninstall_date
- **Relationships:**
    - `hardware()` → belongsTo(Hardware)
    - `softwareInventory()` → belongsTo(SoftwareInventory)
    - `softwareLicense()` → belongsTo(SoftwareLicense)

### HardwareUsers

- **Table:** `hardware_users` | **Connection:** `mysql`
- **Purpose:** Many-to-many assignment of employees to hardware units
- **Relationships:**
    - `hardware()` → belongsTo(Hardware)
    - `user()` → belongsTo(User, 'user_id', 'EMPLOYID')

### SoftwareInventory

- **Table:** `software_inventory`
- **Key Fields:** software_name, software_type, version, publisher, license_type, requires_key_tracking, total_licenses
- **Relationships:**
    - `licenses()` → hasMany(SoftwareLicense)
    - `hardwareSoftware()` → hasMany(HardwareSoftware)

### SoftwareLicense

- **Table:** `software_licenses`
- **Relationships:**
    - `softwareInventory()` → belongsTo(SoftwareInventory)
    - `hardwareSoftware()` → hasMany(HardwareSoftware)

### Part / PartInventory

- **Tables:** `parts`, `part_inventory`
- **Relationships:** `Part.inventories()` → hasMany(PartInventory)

### Printer

- **Table:** `printer`
- **Key Fields:** printer_name, ip_address, printer_type, printer_category, location, brand, model, serial_number, status
- **Relationships:**
    - `parts()` → hasMany(PrinterPart)
    - `locationDetail()` → belongsTo(Locations)

### CCTV

- **Table:** `cctv_lists`
- **Key Fields:** camera_name, channel, ip_address, control_no, location, location_ip, status

### Issuance

- **Table:** `issuance` | **Timestamps:** false (created_at only)
- **Issuance Types:** 1 = Whole Unit, 2 = Component Maintenance
- **Numbering:** `ISS-YYYY-XXXX` format
- **Relationships:**
    - `acknowledgement()` → hasOne(Acknowledgement)
    - `componentDetails()` → hasMany(ComponentIssuanceDetail)
    - `hardware()` → belongsTo(Hardware)

### ActivityLog

- **Table:** `activity_logs`
- **Polymorphic:** Attached to any model using the `Loggable` trait
- **Records:** All create, update, delete events with timestamps and user tracking

### User (Authenticatable)

- **Table:** `employee_masterlist` | **Connection:** `masterlist`
- **Primary Key:** `EMPLOYID`
- **Key Fields:** EMPLOYID, EMPNAME, DEPARTMENT, JOB_TITLE

### Locations

- **Table:** `location_list` | **Connection:** `qa`

---

## Services (Business Logic)

| Service                      | Responsibility                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| `HardwareService`            | Paginated hardware fetch, filter/search, log retrieval, delete (with inventory cleanup)    |
| `HardwareUpdateService`      | Create/update hardware, add/remove components with inventory management                    |
| `HardwareReplacementService` | Component replacement: track old component removal, install new with inventory             |
| `HardwareDetailService`      | Full hardware detail, cascading parts/software options, available inventory                |
| `PartsService`               | Parts CRUD, inventory tracking, activity logs                                              |
| `SoftwareService`            | Software inventory CRUD, logs                                                              |
| `LicensesService`            | License CRUD, seat tracking                                                                |
| `PrinterService`             | Printer CRUD, parts, logs                                                                  |
| `CCTVService`                | CCTV camera CRUD, logs                                                                     |
| `LocationsService`           | Location CRUD from external QA DB                                                          |
| `IssuanceService`            | Issuance number generation, whole-unit and component maintenance issuance, acknowledgement |
| `DashboardService`           | Aggregated counts and chart data for dashboard                                             |
| `UserRoleService`            | Employee and reference data (departments, locations, prodlines, stations)                  |
| `SystemStatusService`        | Maintenance mode toggling and status checks                                                |
| `DataTableService`           | Generic datatable handler (search, sort, paginate, CSV export)                             |

---

## Repositories (Data Access)

| Repository                 | Key Queries                                                                                  |
| -------------------------- | -------------------------------------------------------------------------------------------- |
| `HardwareRepository`       | Paginated hardware with relationships, category counts, status counts, logs                  |
| `HardwareDetailRepository` | Cascading dropdowns (parts options, software options), formatted parts/software for hardware |
| `PartsRepository`          | Parts table queries, CRUD                                                                    |
| `PrinterRepository`        | Printer table, CRUD, logs                                                                    |
| `CCTVRepository`           | CCTV table, CRUD                                                                             |
| `LocationsRepository`      | Locations from QA DB, paginate, search                                                       |
| `IssuanceRepository`       | Unified issuance table, numbering, create                                                    |
| `SoftwareRepository`       | Software inventory CRUD                                                                      |
| `LicensesRepository`       | License CRUD                                                                                 |
| `UserRepository`           | Employee batch fetches, department/location options from Masterlist                          |
| `ReferenceRepository`      | Batch resolve departments, locations, stations, prodlines by ID                              |
| `DashboardRepository`      | Hardware/parts status aggregates                                                             |
| `SystemStatusRepository`   | Read/write system maintenance state                                                          |

---

## Middleware

| Middleware              | Purpose                                                                 |
| ----------------------- | ----------------------------------------------------------------------- |
| `AuthMiddleware`        | SSO token validation, session management, maintenance mode guard        |
| `ApiTokenMiddleware`    | Bearer token validation for API access (bypassed for internal requests) |
| `AdminMiddleware`       | Restricts routes to users in the admin table                            |
| `HandleInertiaRequests` | Shares global data with all Inertia page responses                      |

---

## Constants & Enums

All located in `app/Constants/`.

| File                 | Constants                                                                             |
| -------------------- | ------------------------------------------------------------------------------------- |
| `Status.php`         | ACTIVE=1, NEW=2, INACTIVE=3, DEFECTIVE=4 + `getLabel()`, `getColor()`, `getOptions()` |
| `IssuanceStatus.php` | Issuance state constants                                                              |
| `ItemStatus.php`     | General item status constants                                                         |
| `PrinterStatus.php`  | Printer-specific status constants                                                     |
| `PromisStatus.php`   | Promis integration status constants                                                   |

---

## Frontend Architecture

### Page Structure

```
resources/js/Pages/
├── Dashboard/
│   ├── index.jsx              # Dashboard root
│   ├── Charts.jsx             # Chart visualizations
│   ├── HardwareView.jsx       # Hardware summary section
│   ├── PartsView.jsx          # Parts summary section
│   └── SummaryCard.jsx        # Metric widgets
├── Inventory/
│   ├── HardwareTable.jsx      # Hardware inventory (main table)
│   ├── PartsTable.jsx         # Parts inventory
│   ├── SoftwareTable.jsx      # Software inventory
│   ├── SoftwareLicense.jsx    # License management
│   ├── PrinterTable.jsx       # Printer management
│   └── CCTVTable.jsx          # CCTV management
├── Admin/
│   ├── Admin.jsx              # Admin user management
│   ├── NewAdmin.jsx           # Add new admin
│   └── Location.jsx           # Location management
├── Authentication/
│   └── Login.jsx              # Login page
├── Profile.jsx
├── Maintenance.jsx
├── Unauthorized.jsx
└── 404.jsx
```

### Component Structure

```
resources/js/Components/
├── drawer/
│   ├── ComponentMaintenanceDrawer/
│   │   ├── HardwareInfo.jsx
│   │   ├── EditHardwareInfo.jsx
│   │   ├── ComponentsReviewTable.jsx
│   │   ├── AddComponent.jsx
│   │   ├── RemoveComponent.jsx
│   │   ├── ReplaceComponent.jsx
│   │   ├── InventoryTable.jsx
│   │   └── IssuanceConfirmationModal.jsx
│   ├── DetailsDrawer.jsx
│   ├── FormDrawer.jsx
│   ├── HardwareFormDrawer.jsx
│   └── LocationFormDrawer.jsx
├── forms/
│   ├── CascadingPartFields.jsx    # Part type→brand→model→spec dropdowns
│   └── CascadingSoftwareFields.jsx # Software cascading dropdowns
├── inventory/
│   ├── InventoryHeaderWithFilters.jsx
│   ├── CategoryBadge.jsx
│   └── ActivityLogsModal.jsx
├── modal/
│   └── RemovalReasonModal.jsx
├── sidebar/
│   ├── SideBar.jsx
│   ├── Navigation.jsx
│   ├── SidebarLink.jsx
│   ├── DropDown.jsx
│   └── ThemeToggler.jsx
├── ui/                            # Shadcn/Radix primitives
│   ├── button.jsx, input.jsx, label.jsx
│   ├── dialog.jsx, sheet.jsx, alert-dialog.jsx
│   ├── select.jsx, combobox.jsx, command.jsx
│   ├── table.jsx, tabs.jsx, card.jsx
│   ├── badge.jsx, avatar.jsx, tooltip.jsx
│   ├── form.jsx (React Hook Form wrapper)
│   ├── chart.jsx (Chart.js wrapper)
│   └── sonner.jsx (toast)
├── DataTable.jsx
├── TablePagination.jsx
├── Modal.jsx
├── NavBar.jsx
├── DeleteConfirm.jsx
└── ThemeContext.jsx
```

### Custom Hooks

| Hook                      | Purpose                                                        |
| ------------------------- | -------------------------------------------------------------- |
| `useCrudOperations`       | Shared CRUD logic (create, update, delete) with toast feedback |
| `useDashboardData`        | Fetch and refresh dashboard metrics                            |
| `useDrawer`               | Drawer open/close state management                             |
| `useFormDrawer`           | Form drawer with pre-populated data                            |
| `useComponentMaintenance` | Full component maintenance workflow state                      |
| `useComponentManagement`  | Component selection and action management                      |
| `useComponentSelection`   | Part/software selection logic                                  |
| `useHardwareParts`        | Fetch parts for a hardware unit                                |
| `useHardwareSoftware`     | Fetch software for a hardware unit                             |
| `useInventoryFilters`     | Filter state for inventory tables                              |
| `useLogsModal`            | Activity logs modal open/close + data                          |
| `useRemovalModal`         | Removal reason confirmation                                    |
| `useTableConfig`          | Column definitions and table settings                          |

### Global State (Zustand)

| Store              | State                             |
| ------------------ | --------------------------------- |
| `usePartsStore`    | Available parts inventory list    |
| `useSoftwareStore` | Available software inventory list |

---

## Database Schema (Key Tables)

### `hardware`

| Column                                  | Type           | Notes                                                   |
| --------------------------------------- | -------------- | ------------------------------------------------------- |
| id                                      | PK             |                                                         |
| hostname                                | varchar UNIQUE | Primary identifier                                      |
| category                                | enum           | Desktop, Laptop, Monitor, Server, Network Device, Other |
| brand, model, serial_number             | varchar        |                                                         |
| ip_address                              | varchar(45)    | Supports IPv6                                           |
| wifi_mac, lan_mac                       | varchar        |                                                         |
| status                                  | enum           | active, spare, defective, disposed, in_repair, retired  |
| location, department, prodline, station | FK references  | Resolved from QA DB                                     |
| issued_to                               | EMPLOYID       | From masterlist                                         |
| installed_by, created_by, updated_by    | EMPLOYID       | Audit fields                                            |
| date_issued                             | datetime       |                                                         |
| deleted_at                              | datetime       | Soft delete                                             |

### `hardware_parts`

| Column                                  | Type                | Notes                     |
| --------------------------------------- | ------------------- | ------------------------- |
| hardware_id                             | FK → hardware       |                           |
| part_type, brand, model, specifications | varchar/text        |                           |
| serial_number, slot_position            | varchar             |                           |
| quantity                                | int default 1       |                           |
| status                                  | enum                | installed, spare, removed |
| source_inventory_id                     | FK → part_inventory | Tracks origin             |
| installed_date, removed_date            | datetime            |                           |

### `issuance`

| Column                | Type     | Notes                                 |
| --------------------- | -------- | ------------------------------------- |
| issuance_number       | varchar  | Format: ISS-YYYY-XXXX                 |
| issuance_type         | tinyint  | 1=whole unit, 2=component maintenance |
| request_number        | varchar  |                                       |
| hostname, hardware_id | FK       |                                       |
| created_by            | EMPLOYID |                                       |

---

## Key Flows

### Hardware Creation Flow

```
Frontend (HardwareFormDrawer)
  → POST /api/hardware/hardware/store
  → ApiTokenMiddleware
  → HardwareController@store
  → validateHardwareCreate()
  → HardwareUpdateService@createHardware()
      ├── Creates Hardware record
      ├── Creates HardwarePart records (deducts from PartInventory)
      ├── Creates HardwareSoftware records (assigns SoftwareLicense)
      └── Creates HardwareUsers records
  → ActivityLog created (Loggable trait)
  → Returns HardwareResource JSON
```

### Component Replacement Flow

```
Frontend (ReplaceComponent drawer)
  → POST /api/hardware/replace-component
  → HardwareController@replaceComponent
  → validateReplacementRequest()
  → HardwareReplacementService@replaceComponent()
      ├── Marks old HardwarePart as removed (records removal date + reason)
      ├── Returns old part to PartInventory (if condition = good)
      ├── Installs new HardwarePart (deducts from PartInventory)
      └── Logs replacement activity
  → ActivityLog created
```

### Issuance Flow

```
Frontend (IssuanceConfirmationModal)
  → POST /api/issuance/create  (whole unit)
  → OR POST /api/issuance/component/maintenance/batch
  → IssuanceController@createIssuance / createComponentMaintenanceIssuance
  → IssuanceService@generateIssuanceNumber()  → ISS-2026-0001
  → IssuanceService@createIssuance()
      ├── Creates Issuance record
      ├── Creates ComponentIssuanceDetail records (for type 2)
      └── Updates hardware status/assignment
  → Awaits acknowledgement via PUT /api/issuance/acknowledge/{id}
```

### Dashboard Data Flow

```
Frontend (Dashboard/index.jsx)
  → useEffect → Axios GET /api/dashboard/hardware/counts
  → Axios GET /api/dashboard/hardware/chart-data
  → Axios GET /api/dashboard/parts/counts
  → Axios GET /api/dashboard/parts/chart-data
  → DashboardController → DashboardService → DashboardRepository
  → Returns aggregated counts and chart-ready datasets
  → Rendered via Recharts / Chart.js components
```

---

## External Integrations

| System            | Host                                | Purpose                                     |
| ----------------- | ----------------------------------- | ------------------------------------------- |
| **Authify SSO**   | 192.168.2.221:8200                  | User authentication, token validation       |
| **QA Database**   | Configured in `config/database.php` | Locations, departments, stations, prodlines |
| **Masterlist DB** | Configured in `config/database.php` | Employee records and user data              |

---

## Build & Run

```bash
# Install dependencies
composer install
npm install

# Environment setup
cp .env.example .env
php artisan key:generate

# Database (import admin table FIRST)
mysql -u root -p your_database < System_Tables.sql
php artisan migrate

# Development server (all services)
composer run dev

# Or separately
php artisan serve
npm run dev

# Production build
npm run build

# Run tests
composer test
```

---

## Environment Variables Reference

```env
APP_NAME=                        # Used as route prefix (/{APP_NAME}/...)
APP_URL=                         # Base URL (used by ApiTokenMiddleware for internal check)

DB_HOST=
DB_PORT=
DB_DATABASE=
DB_USERNAME=
DB_PASSWORD=

# External DBs
QA_DB_HOST=
QA_DB_DATABASE=
MASTERLIST_DB_HOST=
MASTERLIST_DB_DATABASE=

SESSION_DRIVER=
SANCTUM_STATEFUL_DOMAINS=

INVENTORY_API_TOKEN=             # Bearer token for API access
```
