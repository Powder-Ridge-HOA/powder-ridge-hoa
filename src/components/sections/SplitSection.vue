<script setup>
import { computed } from 'vue';
import SmartLink from '@/components/ui/SmartLink.vue';
import { sanityImage } from '@/composables/useSanityImage';
const props = defineProps({ section: { type: Object, default: null } });
const bulletPoints = computed(() => props.section?.bulletPoints || []);
</script>

<template>
  <section class="py-16 px-6 bg-[var(--color-bg)]">
    <div class="max-w-5xl mx-auto flex flex-col md:flex-row gap-10 items-center" :class="section?.imageRight ? '' : 'md:flex-row-reverse'">
      <div class="flex-1 min-w-0">
        <p v-if="section?.eyebrow" class="text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)] mb-3">{{ section.eyebrow }}</p>
        <h2 v-if="section?.heading" class="text-3xl font-bold text-[var(--color-text)] mb-4 leading-tight">{{ section.heading }}</h2>
        <p v-if="section?.body" class="text-[var(--color-text-secondary)] text-base leading-relaxed mb-6">{{ section.body }}</p>
        <ul v-if="bulletPoints.length" class="space-y-2 mb-8">
          <li v-for="(f, i) in bulletPoints" :key="i" class="flex items-start gap-2 text-sm text-[var(--color-text)]">
            <span class="font-bold mt-0.5 text-[var(--color-primary)]">✓</span> {{ typeof f === 'string' ? f : f.title }}
          </li>
        </ul>
        <SmartLink v-if="section?.ctaLabel && section?.ctaUrl" :to="section.ctaUrl" class="focus-ring inline-block text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors hover:opacity-90" style="background-color: var(--color-primary)">{{ section.ctaLabel }}</SmartLink>
      </div>
      <div class="flex-1 min-w-0">
        <img v-if="section?.image" :src="sanityImage(section.image).width(800).height(600).fit('crop').auto('format').url()" :alt="section?.imageAlt || section?.heading || ''" loading="lazy" class="aspect-[4/3] rounded-2xl object-cover w-full shadow-sm" />
        <div v-else class="aspect-[4/3] rounded-2xl flex items-center justify-center text-5xl shadow-sm" style="background: linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 8%, transparent), color-mix(in srgb, var(--color-secondary) 14%, transparent))">🏢</div>
      </div>
    </div>
  </section>
</template>
