import { onMounted, onUnmounted, watch, nextTick, type Ref } from 'vue'

/**
 * Sets up an IntersectionObserver that adds `is-visible` to
 * `.reveal`, `.reveal-stagger`, `.reveal-left`, `.reveal-right`, `.reveal-scale`
 * elements as they enter the viewport.
 *
 * Re-scans after `trigger` ref changes (e.g., when CMS data loads and new sections render).
 */
export function useRevealObserver(trigger?: Ref<unknown>) {
  let observer: IntersectionObserver | null = null

  function scan() {
    if (!observer) return
    document.querySelectorAll('.reveal, .reveal-stagger, .reveal-left, .reveal-right, .reveal-scale').forEach((el) => {
      if (!el.classList.contains('is-visible')) {
        observer!.observe(el)
      }
    })
  }

  onMounted(() => {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer!.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15 }
    )
    scan()
  })

  if (trigger) {
    watch(trigger, async () => {
      await nextTick()
      scan()
    })
  }

  onUnmounted(() => {
    observer?.disconnect()
  })
}
