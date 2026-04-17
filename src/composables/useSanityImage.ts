import { createImageUrlBuilder } from '@sanity/image-url'

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID
const dataset = import.meta.env.VITE_SANITY_DATASET || 'production'

const builder = createImageUrlBuilder({ projectId, dataset })

/**
 * Returns a Sanity image URL builder for the given source.
 * Respects crop and hotspot metadata set in the Studio.
 *
 * Usage: sanityImage(source).width(80).height(80).url()
 */
export function sanityImage(source: unknown) {
  return builder.image(source as any)
}
