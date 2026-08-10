# cderc-nuxt-frontend

## Local development

Use the real backend:

```bash
npm run dev
```

Use the local mock API in a second terminal:

```bash
npm run mock:api
npm run dev:mock
```

The mock API runs at `http://127.0.0.1:3002` and uses `mock/db.json` as a small writable development database. The Nuxt app reads `.env.mock` when started with `npm run dev:mock`.

Mocked endpoints currently cover the frontend API contract:

- `POST /auth/login`
- `GET|POST /children`
- `PUT|DELETE /children/:id`
- `GET /users`
- `POST /admin/users`
- `GET|POST /super-admin/organizations`
- `PUT|DELETE /super-admin/organizations/:id`
- `POST /super-admin/organizations/:id/admins`

## SUPER_ADMIN: organization and admin flow

The `SUPER_ADMIN` creates an organization first. The backend/database generates the `organizationId`; the frontend must not ask the user to enter an ID manually.

```http
POST /api/super-admin/organizations
```

```json
{
  "name": "CDERC Togo",
  "email": "info@cderc.org"
}
```

To create an organization admin, the frontend loads the organizations and renders them as a dropdown:

```http
GET /api/super-admin/organizations
```

The user sees only organization names, for example `CDERC Togo`. Internally, the selected option keeps the generated ID, for example `CDERC Togo -> id = 2`.

When the form is submitted, the selected ID is used as a path parameter:

```http
POST /api/super-admin/organizations/2/admins
```

```json
{
  "name": "Togo Admin",
  "email": "admin@cderc.org",
  "password": "123456"
}
```

The request body contains only the admin data. It must not include `organizationId`.

For regular `ADMIN` users, the frontend continues to call:

```http
POST /api/admin/users
```

In that flow, the frontend must not send `organization` or `organizationId`. The backend assigns the organization from the logged-in admin.
