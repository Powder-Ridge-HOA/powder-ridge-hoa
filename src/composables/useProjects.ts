import { ref, onMounted, type Ref } from 'vue'

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID
const dataset = import.meta.env.VITE_SANITY_DATASET || 'production'

/**
 * Fetches published projects of a given Sanity document type.
 * Sorted by featured first, then newest.
 */
export function useProjects(documentType: string): {
  projects: Ref<any[]>
  loading: Ref<boolean>
  error: Ref<string | null>
} {
  const projects = ref<any[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)

  onMounted(async () => {
    if (!projectId) {
      loading.value = false
      return
    }
    try {
      const query = encodeURIComponent(
        `*[_type == "${documentType}" && !(_id in path("drafts.**"))] | order(coalesce(featured, false) desc, _createdAt desc) { title, "slug": slug.current, category, description, image, imageAlt, logo, featured }`
      )
      const res = await fetch(
        `https://${projectId}.apicdn.sanity.io/v2024-01-01/data/query/${dataset}?query=${query}`
      )
      if (!res.ok) throw new Error(`Failed to fetch projects: ${res.status}`)
      const json = await res.json()
      projects.value = json.result || []
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load projects.'
    } finally {
      loading.value = false
    }
  })

  return { projects, loading, error }
}
