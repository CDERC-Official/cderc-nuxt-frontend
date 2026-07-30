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
- `POST /super-admin/users/admins`
- `GET|POST /super-admin/organizations`
- `PUT|DELETE /super-admin/organizations/:id`
