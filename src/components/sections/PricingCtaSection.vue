<script setup>
import SmartLink from '@/components/ui/SmartLink.vue';
import { PortableText } from '@portabletext/vue';
defineProps({ section: { type: Object, default: null } });
</script>

<template>
  <section v-if="section?.heading || section?.body" class="reveal-scale py-16 px-6 bg-[var(--color-surface)]">
    <div class="max-w-3xl mx-auto text-center">
      <h2 v-if="section?.heading" class="text-3xl font-bold text-[var(--color-text)] mb-6">{{ section.heading }}</h2>
      <div v-if="section?.body" class="prose-cta text-[var(--color-text-secondary)] text-base leading-relaxed mb-8">
        <PortableText :value="section.body" />
      </div>
      <SmartLink v-if="section?.ctaLabel && section?.ctaUrl" :to="section.ctaUrl" class="focus-ring inline-block font-semibold px-8 py-3 rounded-lg text-white transition-colors hover:opacity-90" style="background-color: var(--color-primary)">{{ section.ctaLabel }}</SmartLink>
    </div>
  </section>
</template>
