<script setup>
import { computed } from 'vue';
import { useSiteStore } from '@/stores/useSiteStore';
import SmartLink from '@/components/ui/SmartLink.vue';
import SiteAmbience from '@/components/layout/SiteAmbience.vue';
import { sanityImage } from '@/composables/useSanityImage';

const props = defineProps({ section: { type: Object, default: null } });
const site = useSiteStore();

const heroStyle = computed(() => {
  const img = props.section?.image;
  if (!img) return {};
  const url = sanityImage(img).width(1920).height(800).fit('crop').auto('format').url();
  return { '--hero-image': `url(${url})` };
});
</script>

<template>
  <section class="hero relative flex items-center justify-center min-h-[480px] px-6 py-24 overflow-hidden" :style="heroStyle" :aria-label="section?.imageAlt || undefined">
    <SiteAmbience variant="hero" />
    <div class="relative z-10 text-center text-white max-w-3xl mx-auto">
      <h1 v-if="section?.title || site.name" class="text-5xl font-extrabold leading-tight mb-4">{{ section?.title || site.name }}</h1>
      <p v-if="section?.subtitle || site.tagline" class="text-xl opacity-80 mb-8">{{ section?.subtitle || site.tagline }}</p>
      <SmartLink v-if="section?.cta?.label && section?.cta?.url" :to="section.cta.url" class="focus-ring-light inline-block border-2 border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white hover:text-[var(--color-primary)] transition-colors">{{ section.cta.label }}</SmartLink>
    </div>
  </section>
</template>

<style scoped>
.hero {
  /* Hero gradient endpoints — scoped per theme so light mode stays bright/airy
     while dark mode stays deep. Both pairs keep AA+ contrast for white text. */
  --hero-from: #018e4a;
  --hero-to: #016b37;
  background: linear-gradient(135deg, var(--hero-from) 0%, var(--hero-to) 100%);
  background-size: cover;
  background-position: center;
}
[data-theme="dark"] .hero {
  --hero-from: #016b37;
  --hero-to: #014322;
}
.hero[style*="--hero-image"] {
  background: linear-gradient(135deg, color-mix(in srgb, var(--hero-from) 75%, transparent) 0%, color-mix(in srgb, var(--hero-to) 75%, transparent) 100%), var(--hero-image);
  background-size: cover;
  background-position: center;
}
</style>
