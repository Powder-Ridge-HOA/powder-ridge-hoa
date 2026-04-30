<script setup>
import { computed } from 'vue';
import { sanityImage } from '@/composables/useSanityImage';

const props = defineProps({ section: { type: Object, default: null } });

const widthClassMap = {
  narrow: 'max-w-2xl',  // 672px tailwind = max-w-2xl (672)
  normal: 'max-w-4xl',  // 896px
  wide: 'max-w-6xl',    // 1152px
  full: 'max-w-none',
};

const widthClass = computed(() => widthClassMap[props.section?.width] || widthClassMap.normal);

const imageUrl = computed(() => {
  const img = props.section?.image;
  if (!img?.asset) return null;
  // Cap the rendered file at ~2400px wide; the browser will scale to the
  // container size. .fit('max') preserves aspect ratio without cropping.
  // Hotspot/crop metadata still applies if the editor set it.
  try {
    return sanityImage(img).width(2400).fit('max').auto('format').url();
  } catch {
    return null;
  }
});
</script>

<template>
  <section class="reveal py-12 px-4 sm:px-6 bg-[var(--color-bg)]">
    <div :class="[widthClass, 'mx-auto']">
      <h2
        v-if="section?.heading"
        class="text-3xl font-bold text-[var(--color-text)] text-center mb-8"
      >
        {{ section.heading }}
      </h2>
      <figure v-if="imageUrl" class="m-0">
        <img
          :src="imageUrl"
          :alt="section?.alt || ''"
          class="w-full h-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
          loading="lazy"
        />
        <figcaption
          v-if="section?.caption"
          class="mt-3 text-sm text-[var(--color-text-secondary)] text-center"
        >
          {{ section.caption }}
        </figcaption>
      </figure>
    </div>
  </section>
</template>
