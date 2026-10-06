import test from 'node:test'
import assert from 'node:assert/strict'
import worker from '../src/index.ts'

const mockEnv = {
  UPSTREAM_URL: 'https://mock.upstream/snapshot.php',
}

test('OPTIONS returns 204 with CORS headers', async () => {
  const req = new Request('https://pk-planner.workers.dev/api/schedule', {
    method: 'OPTIONS',
  })
  const res = await worker.fetch(req, mockEnv)
  assert.equal(res.status, 204)
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), '*')
})

test('Non-GET/OPTIONS returns 405', async () => {
  const req = new Request('https://pk-planner.workers.dev/api/schedule', {
    method: 'POST',
  })
  const res = await worker.fetch(req, mockEnv)
  assert.equal(res.status, 405)
  const body = await res.json()
  assert.deepEqual(body, { error: 'Method not allowed' })
})

test('Health check works on /health and /api/health', async () => {
  const res1 = await worker.fetch(new Request('https://pk-planner.workers.dev/health'), mockEnv)
  assert.equal(res1.status, 200)
  assert.deepEqual(await res1.json(), { ok: true })

  const res2 = await worker.fetch(new Request('https://pk-planner.workers.dev/api/health'), mockEnv)
  assert.equal(res2.status, 200)
  assert.deepEqual(await res2.json(), { ok: true })
})

test('API root endpoint returns directory on /api', async () => {
  const res = await worker.fetch(new Request('https://pk-planner.workers.dev/api'), mockEnv)
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.ok, true)
  assert.equal(body.name, 'pk-planner-api')
  assert.equal(body.endpoints.schedule, '/api/schedule')
})

test('API subdomain prefix (api.*) routing works', async () => {
  // Root / on api.* returns API directory
  const rootRes = await worker.fetch(new Request('https://api.twojadomena.pl/'), mockEnv)
  assert.equal(rootRes.status, 200)
  const rootBody = await rootRes.json()
  assert.equal(rootBody.ok, true)
  assert.equal(rootBody.endpoints.schedule, '/schedule')

  // /health on api.*
  const healthRes = await worker.fetch(new Request('https://api.twojadomena.pl/health'), mockEnv)
  assert.equal(healthRes.status, 200)
  assert.deepEqual(await healthRes.json(), { ok: true })

  // 404 for unknown path on api.*
  const unknownRes = await worker.fetch(new Request('https://api.twojadomena.pl/unknown'), mockEnv)
  assert.equal(unknownRes.status, 404)
  assert.deepEqual(await unknownRes.json(), { error: 'Not found' })
})
