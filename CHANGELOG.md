# Changelog

## 2026-01-13

- Backend: Added Customers module (controller, service, DTOs) with loyalty points, tiers, search, CRUD
- Backend: Integrated SalesService with customerId, order types, status updates, refund logic
- Backend: Fixed TypeScript errors by aligning SalesController payload types with SalesService
- Backend: Replaced Prisma CustomerTier imports with local enum to avoid build-time client dependency
- Backend: Built and started NestJS server; resolved port conflicts and Prisma generate permission issue
- Backend: Added unit tests for CustomersService (loyalty points and tier promotions)
- Frontend: Created Customers page with search, add, list, delete; integrated API client
- Frontend: Switched Dashboard and Staff to centralized API client and improved error handling
- Frontend: Fixed ThemeProvider state initialization and side-effect pattern
- Routing: Added protected route /admin/customers and dashboard nav link
- Bugfix: Corrected API import to default export in Customers page

### Breaking Changes
- SalesController payload type changes: `orderType` now `'IN_STORE' | 'ONLINE' | 'CURBSIDE'`; `status` now `'PENDING' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED'`

### Migrations
- Prisma schema includes Customer model and relation to Sale. Run database migration when environment permits.

### Security
- JWT configured with secret via ConfigService; ensure environment variable is set in production.

### Known Issues
- Linting: Several frontend and backend lint warnings remain for `any` usage and test utilities.
- Prisma generate may fail due to PowerShell execution policy or filesystem permissions.
