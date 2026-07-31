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

function findChild(db, id) {
  return db.children.find((child) => Number(child.id) === Number(id))
}

function findEvent(db, id) {
  return db.events.find((event) => Number(event.id) === Number(id))
}

function userWithOrganization(db, request, role = request.role || 'USER') {
  const organization = request.organizationId ? findOrganization(db, request.organizationId) : undefined
  return {
    id: nextId(db.users),
    name: request.name || '',
    email: request.email || '',
    role,
    organizationId: organization?.id || request.organizationId || null,
  }
}

function collectionForPath(pathname) {
  if (pathname === '/children' || pathname.startsWith('/children/')) return 'children'
  if (pathname === '/admin/events' || pathname.startsWith('/admin/events/')) return 'events'
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
          organizationId: null,
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

    if (pathname === '/admin/reports/organization/total' && req.method === 'GET') {
      const totalExpenses = [...(db.expenses || []), ...(db.eventExpenses || [])].reduce((sum, item) => sum + Number(item.amount || 0), 0)
      sendJson(res, 200, { totalExpenses })
      return
    }

    const reportEventTotalMatch = pathname.match(/^\/admin\/reports\/events\/(\d+)\/total$/)
    if (reportEventTotalMatch && req.method === 'GET') {
      const eventId = Number(reportEventTotalMatch[1])
      const event = findEvent(db, eventId)
      const totalExpenses = (db.eventExpenses || []).filter((item) => Number(item.eventId) === eventId).reduce((sum, item) => sum + Number(item.amount || 0), 0)
      sendJson(res, 200, { eventId, eventTitle: event?.title || String(eventId), totalExpenses })
      return
    }

    const reportEventCategoryMatch = pathname.match(/^\/admin\/reports\/events\/(\d+)\/by-category$/)
    if (reportEventCategoryMatch && req.method === 'GET') {
      const eventId = Number(reportEventCategoryMatch[1])
      const totals = new Map()
      ;(db.eventExpenses || []).filter((item) => Number(item.eventId) === eventId).forEach((item) => {
        const category = item.category || 'OTHER'
        totals.set(category, (totals.get(category) || 0) + Number(item.amount || 0))
      })
      sendJson(res, 200, Array.from(totals.entries()).map(([category, total]) => ({ category, total })))
      return
    }

    if (pathname === '/admin/reports/events/compare' && req.method === 'GET') {
      const year1 = Number(url.searchParams.get('year1'))
      const year2 = Number(url.searchParams.get('year2'))
      const totalByYear = (year) => (db.eventExpenses || [])
        .filter((item) => String(item.expenseDate || '').startsWith(String(year)))
        .reduce((sum, item) => sum + Number(item.amount || 0), 0)
      sendJson(res, 200, [
        { year: year1, total: totalByYear(year1) },
        { year: year2, total: totalByYear(year2) },
      ])
      return
    }

    if (pathname === '/admin/reports/members/active/count' && req.method === 'GET') {
      sendJson(res, 200, 18)
      return
    }

    if (pathname === '/admin/reports/members/supporting/count' && req.method === 'GET') {
      sendJson(res, 200, 7)
      return
    }

    if (pathname === '/admin/reports/members/board' && req.method === 'GET') {
      sendJson(res, 200, [{ id: 1, name: 'Mariam K.', email: 'mariam@example.org', type: 'BOARD', status: 'ACTIVE' }])
      return
    }

    if (pathname === '/admin/reports/members/volunteers' && req.method === 'GET') {
      sendJson(res, 200, [{ id: 2, name: 'Lukas P.', email: 'lukas@example.org', type: 'VOLUNTEER', status: 'ACTIVE' }])
      return
    }

    if (pathname === '/admin/reports/members/inactive' && req.method === 'GET') {
      sendJson(res, 200, [{ id: 3, name: 'Sara N.', email: 'sara@example.org', type: 'SUPPORTING', status: 'INACTIVE' }])
      return
    }
    const childExpenseMatch = pathname.match(/^\/children\/(\d+)\/expenses(?:\/(\d+))?$/)
    if (childExpenseMatch) {
      const childId = Number(childExpenseMatch[1])
      const expenseId = childExpenseMatch[2] ? Number(childExpenseMatch[2]) : null
      const child = findChild(db, childId)
      if (!child) {
        sendJson(res, 404, { message: 'Child not found' })
        return
      }

      if (req.method === 'GET') {
        sendJson(res, 200, expenseId ? db.expenses.find((item) => Number(item.id) === expenseId && Number(item.childId) === childId) : db.expenses.filter((item) => Number(item.childId) === childId))
        return
      }

      if (req.method === 'POST') {
        const body = await readBody(req)
        const item = { id: nextId(db.expenses), ...body, childId, childName: child.name || String(childId) }
        db.expenses.push(item)
        await writeDb(db)
        sendJson(res, 201, item)
        return
      }

      if ((req.method === 'PUT' || req.method === 'PATCH') && expenseId) {
        const index = db.expenses.findIndex((item) => Number(item.id) === expenseId && Number(item.childId) === childId)
        if (index === -1) {
          sendJson(res, 404, { message: 'Expense not found' })
          return
        }
        const body = await readBody(req)
        db.expenses[index] = { ...db.expenses[index], ...body, id: expenseId, childId, childName: child.name || String(childId) }
        await writeDb(db)
        sendJson(res, 200, db.expenses[index])
        return
      }

      if (req.method === 'DELETE' && expenseId) {
        const nextItems = db.expenses.filter((item) => !(Number(item.id) === expenseId && Number(item.childId) === childId))
        if (nextItems.length === db.expenses.length) {
          sendJson(res, 404, { message: 'Expense not found' })
          return
        }
        db.expenses = nextItems
        await writeDb(db)
        sendEmpty(res)
        return
      }
    }

    const eventExpenseMatch = pathname.match(/^\/admin\/events\/(\d+)\/expenses(?:\/(\d+))?$/)
    if (eventExpenseMatch) {
      const eventId = Number(eventExpenseMatch[1])
      const expenseId = eventExpenseMatch[2] ? Number(eventExpenseMatch[2]) : null
      const event = findEvent(db, eventId)
      if (!event) {
        sendJson(res, 404, { message: 'Event not found' })
        return
      }

      if (req.method === 'GET') {
        sendJson(res, 200, expenseId ? db.eventExpenses.find((item) => Number(item.id) === expenseId && Number(item.eventId) === eventId) : db.eventExpenses.filter((item) => Number(item.eventId) === eventId))
        return
      }

      if (req.method === 'POST') {
        const body = await readBody(req)
        const item = { id: nextId(db.eventExpenses), ...body, eventId, eventTitle: event.title || String(eventId) }
        db.eventExpenses.push(item)
        await writeDb(db)
        sendJson(res, 201, item)
        return
      }

      if ((req.method === 'PUT' || req.method === 'PATCH') && expenseId) {
        const index = db.eventExpenses.findIndex((item) => Number(item.id) === expenseId && Number(item.eventId) === eventId)
        if (index === -1) {
          sendJson(res, 404, { message: 'Event expense not found' })
          return
        }
        const body = await readBody(req)
        db.eventExpenses[index] = { ...db.eventExpenses[index], ...body, id: expenseId, eventId, eventTitle: event.title || String(eventId) }
        await writeDb(db)
        sendJson(res, 200, db.eventExpenses[index])
        return
      }

      if (req.method === 'DELETE' && expenseId) {
        const nextItems = db.eventExpenses.filter((item) => !(Number(item.id) === expenseId && Number(item.eventId) === eventId))
        if (nextItems.length === db.eventExpenses.length) {
          sendJson(res, 404, { message: 'Event expense not found' })
          return
        }
        db.eventExpenses = nextItems
        await writeDb(db)
        sendEmpty(res)
        return
      }
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





