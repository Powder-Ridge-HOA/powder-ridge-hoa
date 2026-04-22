import { ref, onMounted, watch, type Ref } from 'vue'

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID
const dataset = import.meta.env.VITE_SANITY_DATASET || 'production'
const apiVersion = import.meta.env.VITE_SANITY_API_VERSION || '2024-01-01'

/**
 * Fetches a Sanity collection via the public CDN and returns a reactive ref.
 * `initialGetter` returns the data the parent page projection passed in (may be
 * undefined). If it returns a non-empty array, the fetch is skipped. Otherwise
 * the composable fetches on mount so the section renders even when the page
 * projection is stale or missing.
 */
export function useCollection<T = unknown>(
  query: string,
  initialGetter: () => T[] | undefined,
): { data: Ref<T[]>; loading: Ref<boolean>; error: Ref<string | null> } {
  const first = initialGetter()
  const data = ref<T[]>(Array.isArray(first) ? (first as T[]) : []) as Ref<T[]>
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    if (!projectId) return
    loading.value = true
    error.value = null
    try {
      const url = new URL(`https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}`)
      url.searchParams.set('query', query)
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error(`Sanity query failed: ${res.status}`)
      const json = await res.json()
      data.value = Array.isArray(json.result) ? (json.result as T[]) : []
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    const initial = initialGetter()
    if (Array.isArray(initial) && initial.length) {
      data.value = initial
      return
    }
    load()
  })

  watch(initialGetter, (next) => {
    if (Array.isArray(next) && next.length) data.value = next
  })

  return { data, loading, error }
}
