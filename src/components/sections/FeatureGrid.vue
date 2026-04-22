<script setup>
import { computed } from 'vue';
import SmartLink from '@/components/ui/SmartLink.vue';
const props = defineProps({ section: { type: Object, default: null } });
const features = computed(() => props.section?.items || []);
</script>

<template>
  <section class="reveal py-16 px-6 bg-[var(--color-bg)]">
    <div v-if="section?.heading" class="max-w-5xl mx-auto">
      <h2 class="text-3xl font-bold text-[var(--color-text)] text-center mb-12">{{ section.heading }}</h2>
    </div>
    <div v-if="features.length" class="reveal-stagger max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
      <template v-for="(feature, i) in features" :key="i">
        <SmartLink
          v-if="feature.url"
          :to="feature.url"
          class="block text-center p-10 rounded-xl bg-[var(--color-surface)] hover:bg-[var(--color-bg-hover)] transition-colors focus-ring"
        >
          <div class="text-5xl mb-6 feature-icon" role="img" :aria-label="feature.title || 'Feature icon'" v-html="feature.icon?.svg || '✨'"></div>
          <h3 class="text-2xl font-semibold text-[var(--color-text)] mb-3">{{ feature.title }}</h3>
          <p class="text-[var(--color-text-secondary)] text-base">{{ feature.description }}</p>
        </SmartLink>
        <div v-else class="text-center p-10">
          <div class="text-5xl mb-6 feature-icon" role="img" :aria-label="feature.title || 'Feature icon'" v-html="feature.icon?.svg || '✨'"></div>
          <h3 class="text-2xl font-semibold text-[var(--color-text)] mb-3">{{ feature.title }}</h3>
          <p class="text-[var(--color-text-secondary)] text-base">{{ feature.description }}</p>
        </div>
      </template>
    </div>
  </section>
</template>

<style scoped>
.feature-icon :deep(svg) { width: 3rem; height: 3rem; margin: 0 auto; color: var(--color-primary); }
</style>
