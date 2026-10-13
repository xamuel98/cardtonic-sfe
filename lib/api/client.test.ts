import { api, ApiError } from './client'

describe('api client', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('returns successful API bodies', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { ok: true } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    await expect(api.get<{ ok: boolean }>('/example')).resolves.toEqual({ data: { ok: true } })
  })

  it('throws ApiError for non-2xx responses', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Missing' } }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    await expect(api.get('/missing')).rejects.toMatchObject<ApiError>({
      name: 'ApiError',
      status: 404,
      code: 'NOT_FOUND',
      message: 'Missing',
    })
  })
})
