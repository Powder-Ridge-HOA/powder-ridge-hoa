<script setup>
import { ref, watch, computed, h } from 'vue';
import { useRoute } from 'vue-router';
import { PortableText } from '@portabletext/vue';

const props = defineProps({
  slug: { type: String, default: '' },
  fallbackTitle: { type: String, default: '' },
});

const route = useRoute();
const resolvedSlug = computed(() => props.slug || route.path);
const resolvedFallbackTitle = computed(() =>
  props.fallbackTitle || (typeof route.name === 'string' ? route.name : ''),
);

const page = ref(null);
const loading = ref(true);

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID;
const dataset = import.meta.env.VITE_SANITY_DATASET || 'production';

async function load() {
  if (!projectId) { loading.value = false; return; }
  loading.value = true;
  try {
    const query = encodeURIComponent(
      `*[_type == "legalPage" && slug.current == "${resolvedSlug.value}"][0]{ title, lastUpdated, body }`,
    );
    const res = await fetch(`https://${projectId}.apicdn.sanity.io/v2024-01-01/data/query/${dataset}?query=${query}`);
    const json = await res.json();
    page.value = json.result || null;
  } catch (e) {
    console.error('Failed to fetch legal page:', e);
    page.value = null;
  } finally {
    loading.value = false;
  }
}

watch(resolvedSlug, load, { immediate: true });

const portableComponents = {
  block: {
    normal: (_, { slots }) => h('p', { class: 'mb-4 last:mb-0' }, slots.default?.()),
    h1: (_, { slots }) => h('h1', { class: 'text-3xl font-bold mt-8 mb-4' }, slots.default?.()),
    h2: (_, { slots }) => h('h2', { class: 'text-2xl font-semibold mt-6 mb-3' }, slots.default?.()),
    h3: (_, { slots }) => h('h3', { class: 'text-xl font-semibold mt-4 mb-2' }, slots.default?.()),
  },
};
</script>

<template>
  <main class="page px-6 py-16">
    <div v-if="loading" class="text-center py-24">
      <p class="text-[var(--color-text-secondary)] text-sm">Loading...</p>
    </div>

    <template v-else-if="page">
      <h1 class="text-4xl font-bold mb-6">{{ page.title }}</h1>
      <div class="legal-content max-w-3xl">
        <p v-if="page.lastUpdated" class="mb-6"><strong>Last updated:</strong> {{ new Date(page.lastUpdated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }}</p>
        <PortableText v-if="page.body" :value="page.body" :components="portableComponents" />
      </div>
    </template>

    <template v-else>
      <h1>{{ resolvedFallbackTitle }}</h1>
      <div class="legal-content">
        <p class="text-[var(--color-text-secondary)]">This page has not been set up yet. Please add content in the CMS.</p>
      </div>
    </template>
  </main>
</template>
