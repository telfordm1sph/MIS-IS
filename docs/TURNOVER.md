# Turnover Documentation

## Onboarding Checklist for New Developer

### 1. Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd mis-is

# Install PHP dependencies
composer install

# Install Node dependencies
npm install

# Create environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Create admin table (manual - see System_Tables.sql)
# Import the SQL to your database
mysql -u root -p your_database < System_Tables.sql
```

### 2. Database Setup

**Critical**: The `admin` table must be created manually from `System_Tables.sql` before running migrations.

```bash
# Run migrations
php artisan migrate
```

### 3. Running the Application

```bash
# Development (runs all services)
composer run dev

# Or separately:
php artisan serve
npm run dev
```

## Key Files & Locations

| What You Need | File/Location |
|---------------|---------------|
| Add new route | `routes/web.php` or `routes/api/*.php` |
| Add new model | `app/Models/` |
| Add service logic | `app/Services/` |
| Add frontend page | `resources/js/Pages/` |
| Add UI component | `resources/js/Components/ui/` |
| Configuration | `.env`, `config/app.php` |
| Constants/Status | `app/Constants/` |

## Common Tasks

### Adding a New Inventory Module

1. Create model: `app/Models/NewItem.php`
2. Create repository: `app/Repositories/NewItemRepository.php`
3. Create service: `app/Services/NewItemService.php`
4. Create controller: `app/Http/Controllers/NewItemController.php`
5. Add routes: `routes/newitem.php`
6. Register routes in `routes/web.php`
7. Create React page: `resources/js/Pages/Inventory/NewItemTable.jsx`
8. Add sidebar navigation: `resources/js/Components/sidebar/Navigation.jsx`

### Modifying an Existing Service

Services follow this flow:
```
Controller → Service → Repository → Model
```

Example for Hardware:
- `app/Http/Controllers/HardwareController.php`
- `app/Services/HardwareService.php`
- `app/Repositories/HardwareRepository.php`
- `app/Models/Hardware.php`

### Adding a Status Constant

Status constants are in `app/Constants/`:
- `Status.php`
- `ItemStatus.php`
- `PrinterStatus.php`
- `IssuanceStatus.php`
- `PromisStatus.php`

## Known Quirks & Notes

1. **Admin Table**: Must be created manually from `System_Tables.sql` - not included in migrations

2. **Duplicate Files**: Some files may be duplicated (e.g., `DataTableService copy.php`) - these are backup files, not actively used

3. **API vs Web Routes**:
   - Use web routes for Inertia pages
   - Use API routes for external integrations

4. **State Management**: Some components use Zustand stores (`resources/js/store/`), others use local state

5. **Soft Deletes**: Most models use soft deletes - use `withTrashed()` to query deleted records

6. **Custom Middleware**: `AuthMiddleware` and `ApiTokenMiddleware` are custom, not Laravel defaults

## Testing

```bash
# Run all tests
composer test

# Run specific test file
php artisan test --filter=HardwareHostnameTest
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Blank page after login | Check `APP_URL` in `.env` matches your host |
| API 401 errors | Check `ApiTokenMiddleware` - tokens may be expired |
| Database connection | Verify `.env` database credentials |
| Assets not loading | Run `npm run build` for production |

## Project Contacts

*To be updated with current team contacts*

## External Dependencies

- **Shadcn UI**: UI component library (manually added components in `resources/js/Components/ui/`)
- **Lucide React**: Icon library
- **Recharts**: Charting library for dashboard
- **Tabulator**: Table library for data tables
- **Zustand**: State management

## Environment Variables

Key variables in `.env`:
```
APP_NAME=
APP_URL=
DB_HOST=
DB_PORT=
DB_DATABASE=
DB_USERNAME=
DB_PASSWORD=
SESSION_DRIVER=
SANCTUM_STATEFUL_DOMAINS=
```
