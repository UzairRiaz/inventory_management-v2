# Multi-tenant Ledger + Inventory App

This project now follows the required role flows:
- Super Admin: login, create organizations, assign organization admins
- Organization Admin: manage users, ledger, inventory, notes, and view activity log
- Organization User: login to org, view organization data, and request adjustments

## Stack
- Backend: Node.js, Express, MongoDB (Mongoose), JWT auth
- Frontend: React Native (Expo) for web + Android + iOS

## Backend setup

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Required environment variables (`backend/.env`):
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `SUPERADMIN_EMAIL`
- `SUPERADMIN_PASSWORD`
- `SUPERADMIN_NAME`

At startup, backend auto-creates default superadmin if it does not exist.

## Backend deployment (AWS Lambda with SAM)

From the backend folder:

```bash
cd backend
sam build
sam deploy --guided \
	--parameter-overrides \
		MongoDbUri='<your-mongodb-uri>' \
		JwtSecret='<your-jwt-secret>' \
		JwtExpiresIn='7d' \
		SuperadminEmail='<optional>' \
		SuperadminPassword='<optional>' \
		SuperadminName='Super Admin' \
		ClientOrigin='*'
```

Local SAM testing:

```bash
cd backend
sam local start-api --parameter-overrides \
	MongoDbUri='<your-mongodb-uri>' \
	JwtSecret='<your-jwt-secret>'
```

## Frontend setup

```bash
cd frontend
cp .env.example .env
npm install
npm run start
```

Set API URL:
- `EXPO_PUBLIC_API_URL=http://localhost:5000`

## Web app setup

```bash
cd web
cp .env.example .env
npm install
npm run start
```

Set API URL:
- `REACT_APP_API_URL=http://localhost:5000`

## Authentication APIs
- `POST /api/auth/superadmin/login`
- `POST /api/auth/organization/login` (organizationCode + email + password)

All protected APIs require:
- `Authorization: Bearer <token>`

## Superadmin APIs
- `GET /api/organizations`
- `POST /api/superadmin/organizations`
- `POST /api/superadmin/admins`
- `POST /api/superadmin/organizations/with-admin`

## Organization APIs (admin/manager/staff as allowed)
- Users: `GET /api/users`, `POST /api/users` (admin only)
- Inventory: `GET/POST /api/warehouses`, `GET/POST /api/items`, `GET /api/stock`, `POST /api/stock/adjust`
- Sales: `GET/POST /api/sales`, `GET /api/sales/profit/summary`
- Notes: `GET/POST /api/notes`
- Ledger: `GET/POST/PUT/DELETE /api/ledger`, `GET /api/ledger/profit/summary`
- Activity log: `GET /api/activity` (admin/manager)

## Role behavior summary
- Superadmin cannot access organization ledger/inventory/user-action flows.
- Admin can create users (manager/staff), manage ledger/inventory/notes, and view activity.
- Manager can manage ledger/inventory/notes and view activity.
- Staff can view data and request adjustments from UI.

## Frontend flow
- Login selector screen (Super Admin Login / Organization Login)
- Superadmin dashboard screen for organization + admin creation
- Organization tabbed dashboard with role-specific screens
