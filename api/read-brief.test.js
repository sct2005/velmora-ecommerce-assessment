// Server function tests with the Claude API mocked. No real key or network is used.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { POST, GET } from './read-brief.js'

const call = (body, headers = {}) =>
  POST(new Request('https://velmora.example/api/read-brief', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://velmora.example', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }))

const toolResponse = (input) => new Response(JSON.stringify({
  content: [{ type: 'tool_use', name: 'record_reading', id: 'x', input }],
  stop_reason: 'tool_use',
}), { status: 200, headers: { 'content-type': 'application/json' } })

describe('POST /api/read-brief', () => {
  beforeEach(() => { delete process.env.ANTHROPIC_API_KEY })
  afterEach(() => { vi.unstubAllGlobals(); delete process.env.ANTHROPIC_API_KEY })

  it('returns 503 not_configured without a key, and never calls the API', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const res = await call({ text: 'black tie', today: '2026-10-13' })
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ error: 'not_configured' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('rejects empty input, bad JSON and other origins', async () => {
    expect((await call({ text: '   ' })).status).toBe(400)
    expect((await call('{not json')).status).toBe(400)
    expect((await call({ text: 'gala' }, { origin: 'https://evil.example' })).status).toBe(403)
    expect(GET().status).toBe(405)
  })

  it('returns a validated reading from a well-formed model reply', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    const fetchSpy = vi.fn(async () => toolResponse({
      occasion: 'winter wedding', categories: ['dress'], colours: ['oxblood', 'black'], fabrics: [], fits: [],
      colour_mappings: [{ said: 'burgundy', as: ['oxblood'] }], max_budget_gbp: 200, delivery_region: 'UK',
      named_products: ['Velmora Royale'], // invented: not in the text, must be dropped
    }))
    vi.stubGlobal('fetch', fetchSpy)
    const res = await call({ text: 'winter wedding in London under £200, black or burgundy dress', today: '2026-10-13' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.source).toBe('model')
    expect(body.reading).toMatchObject({ occasion: 'winter wedding', maxBudget: 200, region: 'UK', colours: ['oxblood', 'black'], namedProducts: [] })
    // Key goes only in the request header to Anthropic, and never into the response.
    const [url, init] = fetchSpy.mock.calls[0]
    expect(url).toBe('https://api.anthropic.com/v1/messages')
    expect(init.headers['x-api-key']).toBe('test-key')
    expect(JSON.stringify(body)).not.toContain('test-key')
    const sent = JSON.parse(init.body)
    expect(sent.tool_choice).toEqual({ type: 'tool', name: 'record_reading' })
    expect(JSON.stringify(sent)).not.toMatch(/price_gbp|VLM-0/) // no catalogue data is sent to the model
  })

  it('falls back on rate limits, server errors, malformed replies and timeouts', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 429 })))
    expect((await call({ text: 'gala' })).status).toBe(503)
    vi.stubGlobal('fetch', vi.fn(async () => new Response('oops', { status: 500 })))
    expect((await call({ text: 'gala' })).status).toBe(502)
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ content: [{ type: 'text', text: 'Try the Aurora gown, £50' }] }), { status: 200 })))
    const malformed = await call({ text: 'gala' })
    expect(malformed.status).toBe(502)
    expect(await malformed.json()).toEqual({ error: 'malformed' })
    vi.stubGlobal('fetch', vi.fn(async () => { const e = new Error('aborted'); e.name = 'AbortError'; throw e }))
    expect((await call({ text: 'gala' })).status).toBe(504)
  })
})
