import { ref, onMounted, type Ref } from 'vue'

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID
const dataset = import.meta.env.VITE_SANITY_DATASET || 'production'
const apiVersion = import.meta.env.VITE_SANITY_API_VERSION || '2024-01-01'

function buildUrl(query: string, params?: Record<string, unknown>): string {
  const base = `https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}`
  const url = new URL(base)
  url.searchParams.set('query', query)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(`$${key}`, JSON.stringify(value))
    }
  }
  return url.toString()
}

/**
 * Reactive composable for fetching data from Sanity CMS via the CDN API.
 *
 * Returns null without fetching if VITE_SANITY_PROJECT_ID is not set,
 * allowing static defaults to show in the template.
 */
export function useSanity<T = unknown>(
  query: string,
  params?: Record<string, unknown>,
): { data: Ref<T | null>; loading: Ref<boolean>; error: Ref<string | null> } {
  const data = ref<T | null>(null) as Ref<T | null>
  const loading = ref(true)
  const error = ref<string | null>(null)

  onMounted(async () => {
    if (!projectId) {
      loading.value = false
      return
    }
    try {
      const res = await fetch(buildUrl(query, params))
      if (!res.ok) throw new Error(`Sanity query failed: ${res.status}`)
      const json = await res.json()
      data.value = json.result as T
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      loading.value = false
    }
  })

  return { data, loading, error }
}