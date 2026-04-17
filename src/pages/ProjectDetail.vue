<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { PortableText } from '@portabletext/vue';
import { sanityImage } from '@/composables/useSanityImage';

const route = useRoute();
const project = ref(null);
const loading = ref(true);
const fetchError = ref(false);

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID;
const dataset = import.meta.env.VITE_SANITY_DATASET || 'production';

onMounted(async () => {
  if (!projectId) { loading.value = false; return; }
  try {
    const slug = route.params.slug;
    const query = encodeURIComponent(`*[_type == "caseStudy" && !(_id in path("drafts.**")) && slug.current == "${slug}"][0]{ title, "slug": slug.current, category, description, image, imageAlt, logo, body }`);
    const res = await fetch(`https://${projectId}.apicdn.sanity.io/v2024-01-01/data/query/${dataset}?query=${query}`);
    const json = await res.json();
    project.value = json.result || null;
  } catch (e) {
    console.error('Failed to fetch project:', e);
    fetchError.value = true;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <main class="page page--project-detail">
    <!-- Loading -->
    <div v-if="loading" class="py-24 text-center">
      <p class="text-[var(--color-text-secondary)] text-sm">Loading project...</p>
    </div>

    <!-- Error -->
    <div v-else-if="fetchError" class="py-24 text-center">
      <h1 class="text-3xl font-bold text-[var(--color-text)] mb-4">Something went wrong</h1>
      <p class="text-[var(--color-text-secondary)] mb-6">We couldn't load this project. Please try again later.</p>
      <RouterLink to="/portfolio" aria-label="Go back to portfolio" class="text-[var(--color-primary)] hover:underline font-medium focus-ring rounded">← Back to Portfolio</RouterLink>
    </div>

    <!-- Not Found -->
    <div v-else-if="!project" class="py-24 text-center">
      <h1 class="text-3xl font-bold text-[var(--color-text)] mb-4">Project not found</h1>
      <RouterLink to="/portfolio" aria-label="Go back to portfolio" class="text-[var(--color-primary)] hover:underline font-medium focus-ring rounded">← Back to Portfolio</RouterLink>
    </div>

    <!-- Project Content -->
    <template v-else>
      <!-- Cover Image -->
      <div v-if="project.image" class="w-full h-64 md:h-96 overflow-hidden">
        <img
          :src="sanityImage(project.image).width(1440).height(480).fit('crop').auto('format').url()"
          :alt="project.imageAlt || project.title"
          loading="lazy" class="w-full h-full object-cover"
        />
      </div>

      <article class="py-16 px-6">
        <div class="max-w-3xl mx-auto">
          <!-- Back link -->
          <nav class="mb-10">
            <RouterLink to="/portfolio" aria-label="Go back to portfolio" class="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline font-medium rounded focus-ring">
              ← Back to Portfolio
            </RouterLink>
          </nav>

          <!-- Category -->
          <span v-if="project.category" class="inline-block text-[0.8125rem] font-semibold uppercase tracking-widest text-[var(--color-primary)] mb-3 pb-1 border-b border-[var(--color-border)]">{{ project.category }}</span>

          <!-- Title -->
          <h1 class="text-4xl md:text-5xl font-extrabold text-[var(--color-text)] leading-tight mb-6" style="font-family: var(--font-heading)">{{ project.title }}</h1>

          <!-- Description -->
          <p v-if="project.description" class="text-lg text-[var(--color-text-secondary)] leading-relaxed mb-10">{{ project.description }}</p>

          <!-- Body -->
          <div v-if="project.body" class="legal-content text-[var(--color-text-secondary)]">
            <PortableText :value="project.body" />
          </div>
        </div>
      </article>
    </template>
  </main>
</template>
