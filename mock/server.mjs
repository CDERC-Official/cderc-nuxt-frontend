import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbPath = join(__dirname, 'db.json')
const port = Number(process.env.MOCK_API_PORT || 3002)

async function readDb() {
  let content = await readFile(dbPath, 'utf8')
  if (content.charCodeAt(0) === 0xfeff) content = content.slice(1)
  return JSON.parse(content)
}

async function writeDb(db) {
  await writeFile(dbPath, JSON.stringify(db, null, 2) + '\n', 'utf8')
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Content-Type': 'application/json; charset=utf-8',
  })
  res.end(payload === undefined ? '' : JSON.stringify(payload))
}

function sendEmpty(res, status = 204) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  })
  res.end()
}

async function readBody(req) {
  let raw = ''
  for await (const chunk of req) {
    raw += chunk
  }
  return raw ? JSON.parse(raw) : {}
}

function nextId(items) {
  return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1
}

function findOrganization(db, id) {
  return db.organizations.find((organization) => Number(organization.id) === Number(id))
}

function userWithOrganization(db, request, role = request.role || 'USER') {
  const organization = request.organizationId ? findOrganization(db, request.organizationId) : undefined
  return {
    id: nextId(db.users),
    name: request.name || '',
    email: request.email || '',
    role,
    organization: organization || null,
  }
}

function collectionForPath(pathname) {
  if (pathname === '/children' || pathname.startsWith('/children/')) return 'children'
  if (pathname === '/users' || pathname.startsWith('/users/')) return 'users'
  if (pathname === '/super-admin/organizations' || pathname.startsWith('/super-admin/organizations/')) return 'organizations'
  return null
}

function idFromPath(pathname) {
  const id = pathname.split('/').filter(Boolean).at(-1)
  return Number(id)
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      sendEmpty(res)
      return
    }

    const url = new URL(req.url || '/', `http://${req.headers.host}`)
    const pathname = url.pathname.replace(/^\/api/, '') || '/'
    const db = await readDb()

    if (req.method === 'GET' && (pathname === '/' || pathname === '/health')) {
      sendJson(res, 200, { status: 'ok', service: 'cderc-mock-api' })
      return
    }

    if (req.method === 'POST' && pathname === '/auth/login') {
      const body = await readBody(req)
      sendJson(res, 200, {
        token: 'mock-jwt-token',
        user: {
          id: 1,
          name: 'Super Admin',
          email: body.email || 'admin@cderc.local',
          role: 'SUPER_ADMIN',
        },
      })
      return
    }

    if (req.method === 'POST' && pathname === '/admin/users') {
      const body = await readBody(req)
      const user = userWithOrganization(db, body)
      db.users.push(user)
      await writeDb(db)
      sendJson(res, 201, user)
      return
    }

    if (req.method === 'POST' && pathname === '/super-admin/users/admins') {
      const body = await readBody(req)
      const user = userWithOrganization(db, body, 'ADMIN')
      db.users.push(user)
      await writeDb(db)
      sendJson(res, 201, user)
      return
    }

    const collection = collectionForPath(pathname)
    if (!collection) {
      sendJson(res, 404, { message: `Mock endpoint not found: ${req.method} ${pathname}` })
      return
    }

    if (req.method === 'GET') {
      sendJson(res, 200, db[collection])
      return
    }

    if (req.method === 'POST') {
      const body = await readBody(req)
      const item = { id: nextId(db[collection]), ...body }
      db[collection].push(item)
      await writeDb(db)
      sendJson(res, 201, item)
      return
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const id = idFromPath(pathname)
      const index = db[collection].findIndex((item) => Number(item.id) === id)
      if (index === -1) {
        sendJson(res, 404, { message: 'Item not found' })
        return
      }
      const body = await readBody(req)
      db[collection][index] = { ...db[collection][index], ...body, id }
      await writeDb(db)
      sendJson(res, 200, db[collection][index])
      return
    }

    if (req.method === 'DELETE') {
      const id = idFromPath(pathname)
      const nextItems = db[collection].filter((item) => Number(item.id) !== id)
      if (nextItems.length === db[collection].length) {
        sendJson(res, 404, { message: 'Item not found' })
        return
      }
      db[collection] = nextItems
      await writeDb(db)
      sendEmpty(res)
      return
    }

    sendJson(res, 405, { message: `Method not allowed: ${req.method}` })
  } catch (error) {
    sendJson(res, 500, { message: error instanceof Error ? error.message : String(error) })
  }
})

server.listen(port, '127.0.0.1', () => {
  console.log(`CDERC mock API running at http://127.0.0.1:${port}`)
})

