<script setup>
import { computed } from 'vue';
const props = defineProps({ section: { type: Object, default: null } });
const steps = computed(() => props.section?.steps || []);
</script>

<template>
  <section v-if="steps.length" class="py-16 px-6 bg-[var(--color-surface)]">
    <div class="max-w-5xl mx-auto">
      <div v-if="section?.heading || section?.subheading" class="text-center mb-12">
        <h2 v-if="section?.heading" class="text-3xl font-bold text-[var(--color-text)] mb-3">{{ section.heading }}</h2>
        <p v-if="section?.subheading" class="text-[var(--color-text-secondary)] text-base max-w-xl mx-auto">{{ section.subheading }}</p>
      </div>
      <div class="reveal-stagger process-grid grid grid-cols-1 gap-0" :style="{ '--process-cols': Math.min(steps.length, 4) }">
        <div v-for="(step, idx) in steps" :key="idx" class="relative flex flex-col items-center text-center px-4">
          <div v-if="idx < steps.length - 1" aria-hidden="true" class="hidden md:block absolute top-8 w-full h-0.5" style="left: 50%; background-color: color-mix(in srgb, var(--color-primary) 20%, transparent)"></div>
          <div class="relative z-10 w-16 h-16 rounded-full bg-[var(--color-bg)] border-2 flex items-center justify-center text-2xl mb-4 shadow-sm" style="border-color: color-mix(in srgb, var(--color-primary) 35%, transparent)" v-html="step.icon?.svg || '📋'" role="img" :aria-label="step.title || 'Step icon'"></div>
          <div class="absolute top-0 right-6 md:right-4 w-5 h-5 rounded-full text-white text-[0.8125rem] font-bold flex items-center justify-center z-20 bg-[var(--color-primary)]">{{ idx + 1 }}</div>
          <h3 class="font-semibold text-[var(--color-text)] mb-2">{{ step.title }}</h3>
          <p class="text-[var(--color-text-secondary)] text-sm leading-relaxed">{{ step.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
@media (min-width: 768px) { .process-grid { grid-template-columns: repeat(var(--process-cols, 4), minmax(0, 1fr)); } }
</style>
