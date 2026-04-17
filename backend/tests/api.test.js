/**
 * Basic API integration tests
 * Run: npm test (in backend/)
 * Requires: MONGODB_URI_TEST env var pointing to a test DB
 */

const request = require('supertest')
const mongoose = require('mongoose')
const { app }  = require('../src/server')

let accessToken = ''
let userId      = ''

const testUser = {
  name:      'Test User',
  email:     `test_${Date.now()}@diskmedia.com`,
  password:  'TestPass123!',
  interests: ['Technology', 'Science']
}

// ── Teardown ───────────────────────────────────────────────────────────────────
afterAll(async () => {
  // Clean up test user
  if (userId) {
    const User = require('../src/models/User.model')
    await User.findByIdAndDelete(userId)
  }
  await mongoose.connection.close()
})

// ── Auth tests ─────────────────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  it('creates a new user and returns tokens', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201)

    expect(res.body).toHaveProperty('accessToken')
    expect(res.body.user).toMatchObject({ email: testUser.email, plan: 'free', role: 'user' })
    expect(res.body.user).not.toHaveProperty('passwordHash')
    accessToken = res.body.accessToken
    userId      = res.body.user._id
  })

  it('rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(409)
    expect(res.body.message).toMatch(/already registered/i)
  })

  it('validates required fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'bad' })
      .expect(422)
    expect(res.body).toHaveProperty('errors')
  })
})

describe('POST /api/auth/login', () => {
  it('returns tokens for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200)
    expect(res.body).toHaveProperty('accessToken')
    expect(res.headers['set-cookie']).toBeDefined()
    accessToken = res.body.accessToken
  })

  it('rejects wrong password', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' })
      .expect(401)
  })
})

describe('GET /api/auth/me', () => {
  it('returns current user with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
    expect(res.body.user.email).toBe(testUser.email)
  })

  it('returns 401 without token', async () => {
    await request(app).get('/api/auth/me').expect(401)
  })
})

// ── Content tests ──────────────────────────────────────────────────────────────
describe('GET /api/content', () => {
  it('returns paginated content list', async () => {
    const res = await request(app).get('/api/content').expect(200)
    expect(res.body).toHaveProperty('items')
    expect(res.body).toHaveProperty('total')
    expect(Array.isArray(res.body.items)).toBe(true)
  })

  it('supports type filter', async () => {
    const res = await request(app).get('/api/content?type=article').expect(200)
    res.body.items.forEach(item => expect(item.type).toBe('article'))
  })
})

describe('GET /api/content/trending', () => {
  it('returns trending items sorted by score', async () => {
    const res = await request(app).get('/api/content/trending').expect(200)
    expect(res.body).toHaveProperty('items')
  })
})

// ── Feed tests ─────────────────────────────────────────────────────────────────
describe('GET /api/feed', () => {
  it('returns personalized feed for authenticated user', async () => {
    const res = await request(app)
      .get('/api/feed')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
    expect(res.body).toHaveProperty('items')
    expect(res.body).toHaveProperty('hasMore')
  })

  it('returns anonymous feed without token', async () => {
    const res = await request(app).get('/api/feed').expect(200)
    expect(Array.isArray(res.body.items)).toBe(true)
  })
})

// ── Search tests ───────────────────────────────────────────────────────────────
describe('GET /api/search', () => {
  it('returns results for a query', async () => {
    const res = await request(app).get('/api/search?q=technology').expect(200)
    expect(res.body).toHaveProperty('results')
    expect(Array.isArray(res.body.results)).toBe(true)
  })

  it('returns empty for blank query', async () => {
    const res = await request(app).get('/api/search?q=').expect(200)
    expect(res.body.results).toHaveLength(0)
  })
})

// ── Subscribe plans test ───────────────────────────────────────────────────────
describe('GET /api/subscribe/plans', () => {
  it('returns all pricing plans', async () => {
    const res = await request(app).get('/api/subscribe/plans').expect(200)
    expect(res.body.plans).toHaveLength(3)
    expect(res.body.plans.map(p => p.id)).toEqual(['free', 'premium', 'enterprise'])
  })
})

// ── Health check ───────────────────────────────────────────────────────────────
describe('GET /health', () => {
  it('responds with ok', async () => {
    const res = await request(app).get('/health').expect(200)
    expect(res.body.status).toBe('ok')
  })
})
